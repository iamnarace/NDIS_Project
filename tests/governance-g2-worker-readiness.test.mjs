import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

describe('Governance G2 worker readiness and roster safety', () => {
  it('returns the deterministic server eligibility decision', async () => {
    const { evaluateWorkerEligibility } = await import('../lib/services/workerReadiness.ts');
    const calls = [];
    const client = { rpc: async (name, args) => {
      calls.push({ name, args });
      return { data: { decision: 'BLOCKED_SCREENING', reasons: ['clearance required'] }, error: null };
    } };
    const result = await evaluateWorkerEligibility(client, 'participant', 'worker', 'service');
    assert.equal(result.decision, 'BLOCKED_SCREENING');
    assert.deepEqual(calls, [{ name: 'governance_g2_worker_eligibility', args: {
      p_participant_id: 'participant', p_staff_id: 'worker', p_service_code: 'service',
    } }]);
  });

  it('fails closed when the eligibility RPC cannot be read', async () => {
    const { evaluateWorkerEligibility } = await import('../lib/services/workerReadiness.ts');
    await assert.rejects(
      () => evaluateWorkerEligibility({ rpc: async () => ({ data: null, error: { message: 'unavailable' } }) }, 'p', 'w', 's'),
      /unavailable/,
    );
  });

  it('models all screening outcomes and checks base evidence plus service requirements', async () => {
    const migration = await readFile(new URL('../supabase/migrations/20260912170000_governance_g2_worker_readiness.sql', import.meta.url), 'utf8');
    for (const status of ['Clearance','Pending','Interim Bar','Exclusion','Suspension','No Valid Clearance','Unknown / Needs Verification']) {
      assert.match(migration, new RegExp(status.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    for (const requirement of ['identity_verified','right_to_work','first_aid','cpr','code_of_conduct','privacy_confidentiality','whs_induction','safeguarding']) {
      assert.match(migration, new RegExp(requirement));
    }
    assert.match(migration, /required_worker_credentials/);
    assert.match(migration, /required_competencies/);
    assert.match(migration, /training_assignments/);
  });

  it('guards the database write boundary and keeps assignment replacement atomic', async () => {
    const guard = await readFile(new URL('../supabase/migrations/20260912190000_governance_g2_roster_write_guard.sql', import.meta.url), 'utf8');
    const atomic = await readFile(new URL('../supabase/migrations/20260912180000_governance_g2_atomic_assignment.sql', import.meta.url), 'utf8');
    assert.match(guard, /BEFORE INSERT OR UPDATE OF shift_id,staff_id,status/);
    assert.match(guard, /worker eligibility blocked/);
    assert.match(guard, /assigned shift requires governed worker assignment/);
    assert.match(atomic, /pg_advisory_xact_lock/);
    assert.ok(atomic.indexOf('governance_g2_worker_eligibility') < atomic.indexOf('DELETE FROM public.shift_assignments'));
    assert.match(atomic, /worker_assigned_after_g2_eligibility/);
  });

  it('keeps client and generic staff APIs from setting authoritative readiness', async () => {
    const [staffRoute, shiftsRoute, assignmentsRoute] = await Promise.all([
      readFile(new URL('../app/api/crm/staff/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/workforce/shifts/route.ts', import.meta.url), 'utf8'),
      readFile(new URL('../app/api/workforce/assignments/route.ts', import.meta.url), 'utf8'),
    ]);
    assert.match(staffRoute, /Credential verification and worker readiness require the governed workforce evidence workflow/);
    assert.match(shiftsRoute, /Create the shift unassigned, then use the governed worker assignment workflow/);
    assert.match(assignmentsRoute, /governance_g2_assign_worker/);
    assert.doesNotMatch(assignmentsRoute, /assigned_by:\s*body/);
  });
});

