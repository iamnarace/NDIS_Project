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
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: userFacingError(error.message), message: userFacingError(error.message) }, { status: 500 });
  }

  const mapped = (data || []).map((p: any) => ({
    id: p.id,
    referenceNumber: p.reference_number || p.id,
    name: p.full_name,
    ndisNumber: p.ndis_number || 'Pending NDIS #',
    dateOfBirth: p.date_of_birth || undefined,
    fundingType: p.funding_type,
    planManager: p.plan_manager_name || 'Self-Managed',
    planManagerEmail: p.plan_manager_email || undefined,
    suburb: p.suburb,
    streetAddress: p.street_address || undefined,
    allocatedHours: Number(p.allocated_weekly_hours) || 0,
    primaryService: p.primary_service || 'Daily Living & Community Participation',
    status: p.status,
    workerAssigned: 'To be assigned',
    contactPerson: p.contact_person || (p.phone ? `${p.full_name} (${p.phone})` : p.full_name),
    createdAt: p.created_at,
    phone: p.phone || undefined,
    email: p.email || undefined,
    emergencyContactName: p.emergency_contact_name || undefined,
    emergencyContactPhone: p.emergency_contact_phone || undefined,
    emergencyContactRelation: p.emergency_contact_relation || undefined,
    emergencyContactEmail: p.emergency_contact_email || undefined,
    secondaryEmergencyName: p.secondary_emergency_name || undefined,
    secondaryEmergencyPhone: p.secondary_emergency_phone || undefined,
    secondaryEmergencyRelation: p.secondary_emergency_relation || undefined,
    medicalAlert: p.medical_alert || undefined,
    allergies: p.allergies || undefined,
    workerInstructions: p.worker_instructions || undefined,
    communicationPreferences: p.communication_preferences || undefined,
    lifecycleStage: p.lifecycle_stage || 'onboarding',
    isRosterable: Boolean(p.is_rosterable),
    suitabilityAssessmentId: p.suitability_assessment_id || undefined,
    readinessNotes: p.readiness_notes || undefined,
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
      return NextResponse.json({ ok: false, error: 'Participant full legal name is required.', message: 'Participant full legal name is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database service unavailable.', message: 'Database service unavailable.' }, { status: 503 });
    }

    const refNum = body.referenceNumber || await nextReferenceNumber(supabase, 'participants', 'PAR');

    const insertData: Record<string, any> = {
      reference_number: refNum,
      full_name: body.name.trim(),
      ndis_number: body.ndisNumber ? body.ndisNumber.trim() : null,
      date_of_birth: body.dateOfBirth || body.dob || null,
      suburb: (body.suburb && body.suburb.trim()) || 'Yamba NSW',
      street_address: (body.streetAddress && body.streetAddress.trim()) || null,
      funding_type: body.fundingType || 'Plan-Managed',
      plan_manager_name: (body.planManager && body.planManager.trim()) || null,
      plan_manager_email: (body.planManagerEmail && body.planManagerEmail.trim()) || null,
      allocated_weekly_hours: Number(body.allocatedHours) || 0,
      phone: (body.phone && body.phone.trim()) || null,
      email: (body.email && body.email.trim()) || null,
      status: body.status === 'active' ? 'pending_intake' : (body.status || 'pending_intake'),
      lifecycle_stage: body.lifecycle_stage || 'onboarding',
      is_rosterable: false,
      primary_service: (body.primaryService && body.primaryService.trim()) || null,
      contact_person: (body.contactPerson && body.contactPerson.trim()) || null,
      emergency_contact_name: body.emergencyContactName || body.emergency_contact_name || null,
      emergency_contact_phone: body.emergencyContactPhone || body.emergency_contact_phone || null,
      emergency_contact_relation: body.emergencyContactRelation || body.emergency_contact_relation || null,
      emergency_contact_email: body.emergencyContactEmail || body.emergency_contact_email || null,
      secondary_emergency_name: body.secondaryEmergencyName || body.secondary_emergency_name || null,
      secondary_emergency_phone: body.secondaryEmergencyPhone || body.secondary_emergency_phone || null,
      secondary_emergency_relation: body.secondaryEmergencyRelation || body.secondary_emergency_relation || null,
      medical_alert: body.medicalAlert || body.medical_alert || null,
      allergies: body.allergies || null,
      worker_instructions: body.workerInstructions || body.worker_instructions || null,
      communication_preferences: body.communicationPreferences || body.communication_preferences || null,
    };

    const { data, error } = await supabase
      .from('participants')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      const errMsg = error?.message || 'Participant insert returned no record.';
      return NextResponse.json({ ok: false, error: errMsg, message: errMsg }, { status: 500 });
    }

    return NextResponse.json({ ok: true, participant: data });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Participant creation failed.';
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
      return NextResponse.json({ ok: false, error: 'Participant ID is required', message: 'Participant ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Database service unavailable.', message: 'Database service unavailable.' }, { status: 503 });
    }
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.full_name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.suburb !== undefined) dbUpdates.suburb = updates.suburb;
    if (updates.streetAddress !== undefined) dbUpdates.street_address = updates.streetAddress;
    if (updates.allocatedHours !== undefined) dbUpdates.allocated_weekly_hours = Number(updates.allocatedHours);
    if (updates.fundingType !== undefined) dbUpdates.funding_type = updates.fundingType;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.dateOfBirth !== undefined || updates.dob !== undefined) {
      dbUpdates.date_of_birth = updates.dateOfBirth ?? updates.dob;
    }
    if (updates.primaryService !== undefined || updates.primary_service !== undefined) {
      dbUpdates.primary_service = updates.primaryService ?? updates.primary_service;
    }
    if (updates.contactPerson !== undefined || updates.contact_person !== undefined) {
      dbUpdates.contact_person = updates.contactPerson ?? updates.contact_person;
    }

    // Emergency & care instruction fields
    if (updates.emergencyContactName !== undefined || updates.emergency_contact_name !== undefined) {
      dbUpdates.emergency_contact_name = updates.emergencyContactName ?? updates.emergency_contact_name;
    }
    if (updates.emergencyContactPhone !== undefined || updates.emergency_contact_phone !== undefined) {
      dbUpdates.emergency_contact_phone = updates.emergencyContactPhone ?? updates.emergency_contact_phone;
    }
    if (updates.emergencyContactRelation !== undefined || updates.emergency_contact_relation !== undefined) {
      dbUpdates.emergency_contact_relation = updates.emergencyContactRelation ?? updates.emergency_contact_relation;
    }
    if (updates.emergencyContactEmail !== undefined || updates.emergency_contact_email !== undefined) {
      dbUpdates.emergency_contact_email = updates.emergencyContactEmail ?? updates.emergency_contact_email;
    }
    if (updates.secondaryEmergencyName !== undefined || updates.secondary_emergency_name !== undefined) {
      dbUpdates.secondary_emergency_name = updates.secondaryEmergencyName ?? updates.secondary_emergency_name;
    }
    if (updates.secondaryEmergencyPhone !== undefined || updates.secondary_emergency_phone !== undefined) {
      dbUpdates.secondary_emergency_phone = updates.secondaryEmergencyPhone ?? updates.secondary_emergency_phone;
    }
    if (updates.secondaryEmergencyRelation !== undefined || updates.secondary_emergency_relation !== undefined) {
      dbUpdates.secondary_emergency_relation = updates.secondaryEmergencyRelation ?? updates.secondary_emergency_relation;
    }
    if (updates.medicalAlert !== undefined || updates.medical_alert !== undefined) {
      dbUpdates.medical_alert = updates.medicalAlert ?? updates.medical_alert;
    }
    if (updates.allergies !== undefined) dbUpdates.allergies = updates.allergies;
    if (updates.workerInstructions !== undefined || updates.worker_instructions !== undefined) {
      dbUpdates.worker_instructions = updates.workerInstructions ?? updates.worker_instructions;
    }
    if (updates.communicationPreferences !== undefined || updates.communication_preferences !== undefined) {
      dbUpdates.communication_preferences = updates.communicationPreferences ?? updates.communication_preferences;
    }

    const { data, error } = await supabase
      .from('participants')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, message: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, participant: data });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Failed to update participant.';
    return NextResponse.json({ ok: false, error: errMsg, message: errMsg }, { status: 500 });
  }
}
