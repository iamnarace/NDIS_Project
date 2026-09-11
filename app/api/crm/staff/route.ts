import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { userFacingError } from '@/lib/userFacingError';
import { nextReferenceNumber } from '@/lib/referenceNumber';

export async function GET(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'Database service unavailable.', message: 'Database service unavailable.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: userFacingError(error.message), message: userFacingError(error.message) }, { status: 500 });
  }

  const mapped = (data || []).map((s: any) => ({
    id: s.id,
    referenceNumber: s.reference_number || s.id,
    name: s.full_name,
    role: s.role,
    phone: s.phone,
    email: s.email,
    engagementType: s.engagement_type || 'employee',
    abn: s.abn || undefined,
    emergencyContact: s.emergency_contact || undefined,
    ndisOrientationCompleted: !!s.ndis_orientation_completed,
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
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ ok: false, error: 'Worker full legal name is required.', message: 'Worker full legal name is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database service unavailable.', message: 'Database service unavailable.' }, { status: 503 });
    }

    const refNum = body.referenceNumber || await nextReferenceNumber(supabase, 'staff', 'STF');

    const insertData: Record<string, any> = {
      reference_number: refNum,
      full_name: body.name.trim(),
      role: (body.role && body.role.trim()) || 'Support Worker',
      phone: (body.phone && body.phone.trim()) || '0400 000 000',
      email: (body.email && body.email.trim()) || 'staff@opuscare.com.au',
      engagement_type: body.engagementType || body.engagement_type || 'employee',
      abn: (body.abn && body.abn.trim()) || null,
      emergency_contact: (body.emergencyContact && body.emergencyContact.trim()) || null,
      ndis_orientation_completed: Boolean(body.ndisOrientationCompleted ?? body.ndis_orientation_completed ?? false),
      suburbs: body.suburbs || ['Yamba', 'Maclean'],
      ndis_screening: body.ndisScreening || 'Verified',
      ndis_screening_expiry: body.ndisScreeningExpiry || null,
      wwcc_number: (body.wwcc && body.wwcc.trim()) || null,
      wwcc_expiry: body.wwccExpiry || null,
      police_check_date: body.policeCheckDate || null,
      first_aid_expiry: body.firstAidExpiry || null,
      cpr_expiry: body.cprExpiry || null,
      hourly_rate: Number(body.hourlyRate) || 38.50,
      status: body.status || 'active',
    };

    const { data, error } = await supabase
      .from('staff')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      const errMsg = error?.message || 'Worker insert returned no record.';
      return NextResponse.json({ ok: false, error: errMsg, message: errMsg }, { status: 500 });
    }

    return NextResponse.json({ ok: true, staff: data });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Failed to register worker.';
    return NextResponse.json({ ok: false, error: errMsg, message: errMsg }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ ok: false, error: 'Unauthorized: Admin access required.', message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Worker ID is required.', message: 'Worker ID is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database service unavailable.', message: 'Database service unavailable.' }, { status: 503 });
    }

    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.full_name = updates.name.trim();
    if (updates.role !== undefined) dbUpdates.role = updates.role.trim();
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone.trim();
    if (updates.email !== undefined) dbUpdates.email = updates.email.trim();
    if (updates.engagementType !== undefined || updates.engagement_type !== undefined) {
      dbUpdates.engagement_type = updates.engagementType ?? updates.engagement_type;
    }
    if (updates.abn !== undefined) dbUpdates.abn = updates.abn ? updates.abn.trim() : null;
    if (updates.emergencyContact !== undefined || updates.emergency_contact !== undefined) {
      dbUpdates.emergency_contact = updates.emergencyContact ?? updates.emergency_contact;
    }
    if (updates.ndisOrientationCompleted !== undefined || updates.ndis_orientation_completed !== undefined) {
      dbUpdates.ndis_orientation_completed = Boolean(updates.ndisOrientationCompleted ?? updates.ndis_orientation_completed);
    }
    if (updates.suburbs !== undefined) dbUpdates.suburbs = updates.suburbs;
    if (updates.ndisScreening !== undefined) dbUpdates.ndis_screening = updates.ndisScreening;
    if (updates.ndisScreeningExpiry !== undefined) dbUpdates.ndis_screening_expiry = updates.ndisScreeningExpiry || null;
    if (updates.wwcc !== undefined) dbUpdates.wwcc_number = updates.wwcc || null;
    if (updates.wwccExpiry !== undefined) dbUpdates.wwcc_expiry = updates.wwccExpiry || null;
    if (updates.policeCheckDate !== undefined) dbUpdates.police_check_date = updates.policeCheckDate || null;
    if (updates.firstAidExpiry !== undefined) dbUpdates.first_aid_expiry = updates.firstAidExpiry || null;
    if (updates.cprExpiry !== undefined) dbUpdates.cpr_expiry = updates.cprExpiry || null;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = Number(updates.hourlyRate) || 0;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await supabase
      .from('staff')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, staff: data });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Failed to update worker.';
    return NextResponse.json({ ok: false, error: errMsg, message: errMsg }, { status: 500 });
  }
}
