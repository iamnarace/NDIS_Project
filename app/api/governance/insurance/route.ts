import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';

const VALID_POLICY_TYPES = [
  'Public Liability',
  'Professional Indemnity',
  'Workers Compensation',
  'Business/Participant Transport Vehicle Cover',
  'Cyber/Data Cover',
  'Clinical/High Intensity Extension',
] as const;

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: true, policies: [] });
    }

    const { data, error } = await supabase
      .from('organisation_insurance')
      .select('*')
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('Failed to query organisation_insurance:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const policies = (data || []).map((p: any) => {
      const expiryTime = new Date(p.expiry_date).getTime();
      const isExpired = expiryTime < now;
      const isExpiringSoon = !isExpired && (expiryTime - now) <= thirtyDaysMs;

      return {
        id: p.id,
        policyType: p.policy_type,
        insurer: p.insurer,
        policyNumber: p.policy_number,
        coverageAmount: p.coverage_amount ? Number(p.coverage_amount) : null,
        commencementDate: p.commencement_date,
        expiryDate: p.expiry_date,
        certificateStoragePath: p.certificate_storage_path,
        status: p.status,
        notes: p.notes,
        isExpired,
        isExpiringSoon,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    return NextResponse.json({ ok: true, policies });
  } catch (err: any) {
    console.error('GET /api/governance/insurance error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to load insurance policies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
    }

    const body = await request.json();
    const { policyType, insurer, policyNumber, coverageAmount, commencementDate, expiryDate, notes, certificateStoragePath } = body;

    if (!policyType || !VALID_POLICY_TYPES.includes(policyType)) {
      return NextResponse.json({ ok: false, error: `Invalid policy type. Must be one of: ${VALID_POLICY_TYPES.join(', ')}` }, { status: 400 });
    }

    if (!insurer || !insurer.trim()) {
      return NextResponse.json({ ok: false, error: 'Insurer name is required.' }, { status: 400 });
    }

    if (!policyNumber || !policyNumber.trim()) {
      return NextResponse.json({ ok: false, error: 'Policy number is required.' }, { status: 400 });
    }

    if (!commencementDate || !expiryDate) {
      return NextResponse.json({ ok: false, error: 'Commencement date and expiry date are required.' }, { status: 400 });
    }

    const insertData = {
      policy_type: policyType,
      insurer: insurer.trim(),
      policy_number: policyNumber.trim(),
      coverage_amount: coverageAmount ? Number(coverageAmount) : null,
      commencement_date: commencementDate,
      expiry_date: expiryDate,
      certificate_storage_path: certificateStoragePath || null,
      status: 'active',
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('organisation_insurance')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Failed to insert organisation_insurance:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, policy: data });
  } catch (err: any) {
    console.error('POST /api/governance/insurance error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to save insurance policy' }, { status: 500 });
  }
}
