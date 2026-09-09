import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { nextReferenceNumber } from '@/lib/referenceNumber';

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ message: 'Worker data could not be loaded.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
  }

  const mapped = (data || []).map((s: any) => ({
    id: s.id,
    referenceNumber: s.reference_number || s.id,
    name: s.full_name,
    role: s.role,
    phone: s.phone,
    email: s.email,
    suburbs: Array.isArray(s.suburbs) ? s.suburbs : ['Yamba', 'Maclean'],
    ndisScreening: s.ndis_screening || 'Verified',
    ndisScreeningExpiry: s.ndis_screening_expiry,
    wwcc: s.wwcc_number || 'Pending',
    wwccExpiry: s.wwcc_expiry,
    policeCheckDate: s.police_check_date,
    firstAid: s.first_aid_expiry ? `Valid to ${s.first_aid_expiry}` : 'Current',
    firstAidExpiry: s.first_aid_expiry,
    cprExpiry: s.cpr_expiry,
    hourlyRate: Number(s.hourly_rate) || 38.50,
    status: s.status,
    createdAt: s.created_at,
  }));
  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ message: 'Worker record could not be saved.' }, { status: 503 });
    }

    const refNum = body.referenceNumber || await nextReferenceNumber(supabase, 'staff', 'STF');

    const { data, error } = await supabase
      .from('staff')
      .insert({
            reference_number: refNum,
            full_name: body.name,
            role: body.role || 'Support Worker',
            phone: body.phone || '0400 000 000',
            email: body.email || 'staff@opuscare.com.au',
            suburbs: body.suburbs || ['Yamba', 'Maclean'],
            ndis_screening: body.ndisScreening || 'Verified',
            ndis_screening_expiry: body.ndisScreeningExpiry || null,
            wwcc_number: body.wwcc || null,
            wwcc_expiry: body.wwccExpiry || null,
            police_check_date: body.policeCheckDate || null,
            first_aid_expiry: body.firstAidExpiry || null,
            cpr_expiry: body.cprExpiry || null,
            hourly_rate: Number(body.hourlyRate) || 38.50,
            status: 'active',
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ message: userFacingError(error?.message || 'Worker insert returned no record.') }, { status: 500 });
    }

    return NextResponse.json({ ok: true, staff: data });
  } catch (err: unknown) {
    return NextResponse.json({ message: userFacingError(err) }, { status: 500 });
  }
}
