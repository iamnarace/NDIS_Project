import { createAdminClient } from '@/lib/supabase/admin';

export async function logAuditEvent(params: {
  entity_type: string;
  entity_id: string;
  actor_type: string;
  actor_id: string;
  action: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
}) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return;
    await supabase.from('audit_events').insert({
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      actor_type: params.actor_type,
      actor_id: params.actor_id,
      action: params.action,
      changes: params.changes || {},
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error('Audit event log error:', err);
  }
}
