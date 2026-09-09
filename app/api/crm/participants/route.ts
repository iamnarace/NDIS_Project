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
    return NextResponse.json({ message: 'Participant data could not be loaded.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
  }

  const mapped = (data || []).map((p: any) => ({
          id: p.id,
          referenceNumber: p.reference_number || p.id,
          name: p.full_name,
          ndisNumber: p.ndis_number || 'Pending NDIS #',
          fundingType: p.funding_type,
          planManager: p.plan_manager_name || 'Self-Managed',
          suburb: p.suburb,
          allocatedHours: Number(p.allocated_weekly_hours) || 0,
          primaryService: 'Daily Living & Community Participation',
          status: p.status,
          workerAssigned: 'To be assigned',
          contactPerson: `${p.full_name} (${p.phone || 'No phone'})`,
          createdAt: p.created_at,
          emergencyContactName: p.emergency_contact_name || undefined,
          emergencyContactPhone: p.emergency_contact_phone || undefined,
          emergencyContactRelation: p.emergency_contact_relation || undefined,
          medicalAlert: p.medical_alert || undefined,
          allergies: p.allergies || undefined,
          workerInstructions: p.worker_instructions || undefined,
          communicationPreferences: p.communication_preferences || undefined,
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
      return NextResponse.json({ message: 'Participant record could not be saved.' }, { status: 503 });
    }

    const refNum = body.referenceNumber || await nextReferenceNumber(supabase, 'participants', 'PAR');

    const { data, error } = await supabase
      .from('participants')
      .insert({
            reference_number: refNum,
            full_name: body.name,
            ndis_number: body.ndisNumber || null,
            date_of_birth: body.dateOfBirth || null,
            suburb: body.suburb || 'Yamba NSW',
            street_address: body.streetAddress || null,
            funding_type: body.fundingType || 'Plan-Managed',
            plan_manager_name: body.planManager || null,
            plan_manager_email: body.planManagerEmail || null,
            allocated_weekly_hours: Number(body.allocatedHours) || 0,
            phone: body.phone || null,
            email: body.email || null,
            status: 'active',
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
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ message: userFacingError(error?.message || 'Participant insert returned no record.') }, { status: 500 });
    }

    return NextResponse.json({ ok: true, participant: data });
  } catch (err: unknown) {
    return NextResponse.json({ message: userFacingError(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authed = await isAuthenticatedAdmin(req);
  if (!authed) {
    return NextResponse.json({ message: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ message: 'Participant ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ message: 'Participant record could not be saved.' }, { status: 503 });
    }
    const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) dbUpdates.full_name = updates.name;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.suburb !== undefined) dbUpdates.suburb = updates.suburb;
      if (updates.allocatedHours !== undefined) dbUpdates.allocated_weekly_hours = Number(updates.allocatedHours);
      if (updates.fundingType !== undefined) dbUpdates.funding_type = updates.fundingType;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      
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
      return NextResponse.json({ message: userFacingError(error.message) }, { status: 500 });
    }
    return NextResponse.json({ ok: true, participant: data });
  } catch (err: unknown) {
    return NextResponse.json({ message: userFacingError(err) }, { status: 500 });
  }
}

