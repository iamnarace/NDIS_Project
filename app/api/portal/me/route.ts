import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/portal/me
 * Returns the authenticated portal user's profile + linked participant or staff record.
 * Called by the participant dashboard on mount to load real data.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 503 });
    }

    // Validate session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Load profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active, portal_participant_id, portal_staff_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.is_active) {
      return NextResponse.json({ error: 'Account is inactive. Contact support.' }, { status: 403 });
    }

    let participant = null;
    let staffMember = null;

    // Load linked participant record
    if (profile.role === 'participant' && profile.portal_participant_id) {
      const { data } = await supabase
        .from('participants')
        .select(`
          id, reference_number, full_name, ndis_number, date_of_birth,
          phone, email, suburb, funding_type, plan_manager_name,
          support_coordinator_name, support_coordinator_phone,
          allocated_weekly_hours, emergency_contact_name, emergency_contact_phone,
          emergency_contact_relation, medical_alert, allergies,
          worker_instructions, communication_preferences, status
        `)
        .eq('id', profile.portal_participant_id)
        .single();
      participant = data;
    }

    // Load linked staff record for workers
    if (profile.role === 'worker' && profile.portal_staff_id) {
      const { data } = await supabase
        .from('staff')
        .select('id, reference_number, full_name, role, phone, suburbs, status')
        .eq('id', profile.portal_staff_id)
        .single();
      staffMember = data;
    }

    if ((profile.role === 'worker' && !staffMember) || (profile.role === 'participant' && !participant)) {
      return NextResponse.json({ error: "Your account doesn't currently have portal access. Please contact Opus Care." }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      participant,
      staffMember,
    });
  } catch (err) {
    console.error('GET /api/portal/me error:', err);
    return NextResponse.json({ error: "We couldn't complete this action. Please refresh and try again." }, { status: 500 });
  }
}
