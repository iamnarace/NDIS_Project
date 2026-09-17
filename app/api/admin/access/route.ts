import { NextResponse } from 'next/server';
import {
  getAuthenticatedAdminIdentity,
  hashAdminAccessKey,
  validateChosenAdminKey,
} from '@/lib/adminAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAuditEvent } from '@/lib/audit';

async function requireOwner(req: Request) {
  const identity = await getAuthenticatedAdminIdentity(req);
  if (!identity) return { error: 'Unauthorised', status: 401 } as const;
  if (identity.role !== 'owner') return { error: 'Owner access is required.', status: 403 } as const;
  return { identity } as const;
}

function cleanEmail(value: unknown) {
  const email = String(value || '').trim().toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
}

export async function GET(req: Request) {
  const auth = await requireOwner(req);
  if ('error' in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database configuration unavailable.' }, { status: 503 });

  const { data, error } = await supabase
    .from('crm_admin_users')
    .select('id, display_name, email, role, active, last_login_at, created_at, locked_at')
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ profiles: data || [], currentProfile: auth.identity });
}

export async function POST(req: Request) {
  const auth = await requireOwner(req);
  if ('error' in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const body = await req.json();
  const displayName = String(body.displayName || '').trim();
  const email = cleanEmail(body.email);
  const role = 'admin';
  const accessKey = String(body.accessKey || '').trim();
  if (displayName.length < 2 || displayName.length > 100) {
    return NextResponse.json({ message: 'Enter a name between 2 and 100 characters.' }, { status: 400 });
  }
  if (email === undefined) return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 });
  const keyError = validateChosenAdminKey(accessKey);
  if (keyError) return NextResponse.json({ message: keyError }, { status: 400 });

  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database configuration unavailable.' }, { status: 503 });
  const { data, error } = await supabase
    .from('crm_admin_users')
    .insert({
      display_name: displayName,
      email,
      role,
      access_key_hash: hashAdminAccessKey(accessKey),
      created_by: auth.identity.id,
    })
    .select('id, display_name, email, role, active, last_login_at, created_at, locked_at')
    .single();
  if (error) {
    const duplicate = error.code === '23505';
    return NextResponse.json(
      { message: duplicate ? 'That access key is already assigned. Choose another key.' : error.message },
      { status: duplicate ? 409 : 500 }
    );
  }
  await logAuditEvent({
    entity_type: 'crm_admin_user',
    entity_id: data.id,
    actor_type: 'crm_admin',
    actor_id: auth.identity.id,
    action: 'admin_profile_created',
    changes: { display_name: displayName, email, role },
  });
  return NextResponse.json({ ok: true, profile: data }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = await requireOwner(req);
  if ('error' in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });
  const body = await req.json();
  const id = String(body.id || '');
  const action = String(body.action || '');
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ message: 'Database configuration unavailable.' }, { status: 503 });

  const { data: target } = await supabase
    .from('crm_admin_users')
    .select('id, display_name, role, active')
    .eq('id', id)
    .maybeSingle();
  if (!target) return NextResponse.json({ message: 'Administrator profile not found.' }, { status: 404 });

  if (action === 'reset_key') {
    const accessKey = String(body.accessKey || '').trim();
    const keyError = validateChosenAdminKey(accessKey);
    if (keyError) return NextResponse.json({ message: keyError }, { status: 400 });
    const { error } = await supabase
      .from('crm_admin_users')
      .update({ access_key_hash: hashAdminAccessKey(accessKey), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      return NextResponse.json(
        { message: error.code === '23505' ? 'That access key is already assigned.' : error.message },
        { status: error.code === '23505' ? 409 : 500 }
      );
    }
    await supabase
      .from('crm_admin_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('admin_user_id', id)
      .is('revoked_at', null);
  } else if (action === 'lock') {
    if (id === auth.identity.id) {
      return NextResponse.json({ message: 'You cannot lock the profile currently signed in.' }, { status: 400 });
    }
    if (target.role === 'owner' && target.active) {
      const { count } = await supabase
        .from('crm_admin_users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'owner')
        .eq('active', true);
      if ((count || 0) <= 1) {
        return NextResponse.json({ message: 'The final active owner cannot be locked.' }, { status: 400 });
      }
    }
    await supabase
      .from('crm_admin_users')
      .update({ active: false, locked_at: new Date().toISOString(), locked_by: auth.identity.id, updated_at: new Date().toISOString() })
      .eq('id', id);
    await supabase
      .from('crm_admin_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('admin_user_id', id)
      .is('revoked_at', null);
  } else if (action === 'unlock') {
    await supabase
      .from('crm_admin_users')
      .update({ active: true, locked_at: null, locked_by: null, updated_at: new Date().toISOString() })
      .eq('id', id);
  } else if (action === 'revoke_sessions') {
    await supabase
      .from('crm_admin_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('admin_user_id', id)
      .is('revoked_at', null);
  } else {
    return NextResponse.json({ message: 'Unsupported administrator action.' }, { status: 400 });
  }

  await logAuditEvent({
    entity_type: 'crm_admin_user',
    entity_id: target.id,
    actor_type: 'crm_admin',
    actor_id: auth.identity.id,
    action: `admin_profile_${action}`,
    changes: { target_name: target.display_name },
  });
  return NextResponse.json({ ok: true });
}
