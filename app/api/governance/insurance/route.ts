import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';

const VALID_POLICY_TYPES = [
  'Public Liability',
  'Professional Indemnity',
  'Personal Accident',
  'Workers Compensation',
  'Business/Participant Transport Vehicle Cover',
  'Motor/Vehicle related cover',
  'Cyber/Data Cover',
  'Clinical/High Intensity Extension',
  'Clinical/Professional extension',
  'Other',
] as const;

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: true, policies: [], overallStatus: 'NOT_SUPPLIED' });
    }

    const { data, error } = await supabase
      .from('organisation_insurance')
      .select('*')
      .neq('status', 'cancelled')
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
        verifiedState: p.verified_state || 'unverified',
        verifiedAt: p.verified_at,
        verifiedBy: p.verified_by,
        renewalReminderState: p.renewal_reminder_state || 'pending',
        notes: p.notes,
        isExpired,
        isExpiringSoon,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    let overallStatus: 'NOT_SUPPLIED' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'NEEDS_REVIEW' = 'NOT_SUPPLIED';
    if (policies.length === 0) {
      overallStatus = 'NOT_SUPPLIED';
    } else {
      const pl = policies.find((p: any) => p.policyType === 'Public Liability');
      if (!pl) {
        overallStatus = 'NOT_SUPPLIED';
      } else if (pl.isExpired) {
        overallStatus = 'EXPIRED';
      } else if (pl.verifiedState === 'needs_review' || pl.verifiedState === 'rejected') {
        overallStatus = 'NEEDS_REVIEW';
      } else if (pl.isExpiringSoon) {
        overallStatus = 'EXPIRING';
      } else {
        overallStatus = 'ACTIVE';
      }
    }

    return NextResponse.json({ ok: true, policies, overallStatus });
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
    const { policyType, insurer, policyNumber, coverageAmount, commencementDate, expiryDate, notes, certificateStoragePath, verifiedState, renewalReminderState } = body;

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

    const isVerified = verifiedState === 'verified';
    const insertData = {
      policy_type: policyType,
      insurer: insurer.trim(),
      policy_number: policyNumber.trim(),
      coverage_amount: coverageAmount ? Number(coverageAmount) : null,
      commencement_date: commencementDate,
      expiry_date: expiryDate,
      certificate_storage_path: certificateStoragePath || null,
      status: 'active',
      verified_state: verifiedState || 'verified', // Owner direct entry defaults to verified unless specified
      verified_at: isVerified || !verifiedState ? new Date().toISOString() : null,
      verified_by: 'admin_session',
      renewal_reminder_state: renewalReminderState || 'pending',
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

export async function PATCH(request: NextRequest) {
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
    const { id, verifiedState, status, renewalReminderState, notes, expiryDate } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Policy id is required.' }, { status: 400 });
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (verifiedState) {
      updateData.verified_state = verifiedState;
      if (verifiedState === 'verified') {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = 'admin_session';
      }
    }
    if (status) updateData.status = status;
    if (renewalReminderState) updateData.renewal_reminder_state = renewalReminderState;
    if (notes !== undefined) updateData.notes = notes;
    if (expiryDate) updateData.expiry_date = expiryDate;

    const { data, error } = await supabase
      .from('organisation_insurance')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update organisation_insurance:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, policy: data });
  } catch (err: any) {
    console.error('PATCH /api/governance/insurance error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to update insurance policy' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database service unavailable.' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, error: 'Policy id is required.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('organisation_insurance')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete organisation_insurance:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Insurance policy removed.' });
  } catch (err: any) {
    console.error('DELETE /api/governance/insurance error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Failed to delete insurance policy' }, { status: 500 });
  }
}
