import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { evaluateWhsReadiness } from '@/lib/services/whsContinuityGovernance';

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    let supabase: any = null;

    if (isAdmin) {
      supabase = createAdminClient();
    } else {
      supabase = await createClient();
    }

    if (!supabase) return NextResponse.json({ assessments: [] });

    if (!isAdmin) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, portal_participant_id, portal_staff_id, is_active')
        .eq('id', user.id)
        .single();
      if (!profile?.is_active) return NextResponse.json({ error: 'Account inactive' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get('participant_id');

    let query = supabase
      .from('risk_assessments')
      .select('*, participant:participants(id, full_name, reference_number)')
      .order('created_at', { ascending: false });

    if (participantId) {
      query = query.eq('participant_id', participantId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('WHS risk assessments query error:', error);
      return NextResponse.json({ assessments: [] });
    }

    const assessmentsWithReadiness = (data || []).map((assessment: any) => {
      const readiness = evaluateWhsReadiness(assessment);
      return {
        ...assessment,
        whs_readiness: readiness,
      };
    });

    return NextResponse.json({ assessments: assessmentsWithReadiness });
  } catch (err) {
    console.error('GET /api/governance/whs error:', err);
    return NextResponse.json({ error: 'Failed to retrieve WHS assessments.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrative staff can record WHS assessments.' }, { status: 403 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
    }

    const body = await request.json();
    const {
      participant_id,
      assessment_title,
      whs_type,
      service_location_type,
      access_parking_hazards,
      slips_trips_hazards,
      manual_handling_hazards,
      mobility_transfer_hazards,
      smoking_smoke_exposure,
      pets_animals,
      aggression_security_concerns,
      sharps_infection_risks,
      electrical_fire_hazards,
      bathroom_toileting_access,
      communication_network_coverage,
      lone_worker_controls,
      emergency_evacuation_plan,
      participant_specific_whs_controls,
      worker_safety_instructions,
      overall_risk_rating,
      review_date,
      sign_off,
    } = body;

    if (!participant_id) {
      return NextResponse.json({ error: 'participant_id is required.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const defaultReviewDate = review_date || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('risk_assessments')
      .insert({
        participant_id,
        assessment_title: assessment_title || 'Home & Community WHS Assessment',
        version: 1,
        status: sign_off ? 'Approved' : 'Draft',
        whs_type: whs_type || 'home_and_community',
        service_location_type: service_location_type || 'participant_home',
        access_parking_hazards: access_parking_hazards || null,
        slips_trips_hazards: slips_trips_hazards || null,
        manual_handling_hazards: manual_handling_hazards || null,
        mobility_transfer_hazards: mobility_transfer_hazards || null,
        smoking_smoke_exposure: smoking_smoke_exposure || null,
        pets_animals: pets_animals || null,
        aggression_security_concerns: aggression_security_concerns || null,
        sharps_infection_risks: sharps_infection_risks || null,
        electrical_fire_hazards: electrical_fire_hazards || null,
        bathroom_toileting_access: bathroom_toileting_access || null,
        communication_network_coverage: communication_network_coverage || null,
        lone_worker_controls: lone_worker_controls || null,
        emergency_evacuation_plan: emergency_evacuation_plan || null,
        participant_specific_whs_controls: participant_specific_whs_controls || [],
        worker_safety_instructions: worker_safety_instructions || null,
        overall_risk_rating: overall_risk_rating || 'Medium',
        review_date: defaultReviewDate,
        whs_signed_off_at: sign_off ? now : null,
        whs_signed_off_by: sign_off ? 'Operations Lead' : null,
      })
      .select('*, participant:participants(id, full_name, reference_number)')
      .single();

    if (error) {
      console.error('WHS assessment insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      entity_type: 'risk_assessment',
      entity_id: data.id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: 'created',
      changes: { status: data.status, whs_type: data.whs_type },
      metadata: { participant_id },
    });

    const readiness = evaluateWhsReadiness(data);

    return NextResponse.json({ assessment: data, whs_readiness: readiness }, { status: 201 });
  } catch (err) {
    console.error('POST /api/governance/whs error:', err);
    return NextResponse.json({ error: 'Failed to record WHS assessment.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const isAdmin = await isAuthenticatedAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrative staff can update WHS assessments.' }, { status: 403 });
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
    }

    const body = await request.json();
    const { id, sign_off, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Assessment ID is required.' }, { status: 400 });
    }

    if (sign_off) {
      updates.status = 'Approved';
      updates.whs_signed_off_at = new Date().toISOString();
      updates.whs_signed_off_by = 'Operations Lead';
    }

    const { data, error } = await supabase
      .from('risk_assessments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, participant:participants(id, full_name, reference_number)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      entity_type: 'risk_assessment',
      entity_id: id,
      actor_type: 'admin',
      actor_id: 'admin',
      action: sign_off ? 'signed_off' : 'updated',
      changes: updates,
    });

    const readiness = evaluateWhsReadiness(data);

    return NextResponse.json({ assessment: data, whs_readiness: readiness });
  } catch (err) {
    console.error('PATCH /api/governance/whs error:', err);
    return NextResponse.json({ error: 'Failed to update WHS assessment.' }, { status: 500 });
  }
}
