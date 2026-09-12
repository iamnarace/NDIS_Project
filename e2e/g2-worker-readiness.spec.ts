import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const adminKey = process.env.ADMIN_ACCESS_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!adminKey || !supabaseUrl || !serviceRoleKey) throw new Error('G2 browser acceptance configuration is unavailable.');

const runId = crypto.randomBytes(6).toString('hex');
const workerName = `G2 E2E ${runId} Worker`;
const workerEmail = `g2-e2e-${runId}@example.invalid`;
let supabase: SupabaseClient;
let staffId = '';

async function cleanup() {
  if (!staffId) return;
  await supabase.from('audit_events').delete().eq('entity_id', staffId);
  await supabase.from('worker_competencies').delete().eq('staff_id', staffId);
  await supabase.from('worker_credentials').delete().eq('staff_id', staffId);
  await supabase.from('staff').delete().eq('id', staffId);
}

test.beforeAll(async () => {
  supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: interrupted } = await supabase.from('staff').select('id').ilike('email', 'g2-e2e-%@example.invalid');
  for (const row of interrupted || []) {
    await supabase.from('audit_events').delete().eq('entity_id', row.id);
    await supabase.from('worker_competencies').delete().eq('staff_id', row.id);
    await supabase.from('worker_credentials').delete().eq('staff_id', row.id);
    await supabase.from('staff').delete().eq('id', row.id);
  }
});
test.afterAll(cleanup);

test('G2 real admin workflow keeps worker blocked until controlled evidence is verified', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('Admin Access Key').fill(adminKey);
  await page.getByRole('button', { name: 'Unlock Admin CRM' }).click();
  await expect(page.getByRole('button', { name: 'Referrals', exact: true })).toBeVisible();

  const created = await page.evaluate(async ({ workerName, workerEmail }) => {
    const response = await fetch('/api/crm/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      name: workerName, email: workerEmail, phone: '0400000000', role: 'Disability Support Worker', engagementType: 'employee', suburbs: ['Grafton'],
    }) });
    return { status: response.status, body: await response.json() };
  }, { workerName, workerEmail });
  expect(created.status).toBe(200);
  staffId = created.body.staff.id;
  expect(created.body.staff.lifecycle_stage).toBe('applicant');
  expect(created.body.staff.is_rosterable).toBe(false);

  await page.reload();
  await page.getByRole('button', { name: /Workers & Credentials/ }).click();
  await page.getByLabel('Search operations').fill(workerName);
  await expect(page.getByText(workerName, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clearances' }).click();
  const panel = page.getByTestId('worker-readiness-panel');
  await expect(panel).toContainText('Rostering blocked');
  await expect(panel.getByLabel('Screening status')).toHaveValue('Unknown / Needs Verification');

  await panel.getByLabel('Verification status').selectOption('verified');
  await panel.getByLabel('Screening status').selectOption('Pending');
  await panel.getByLabel('Credential or evidence reference').fill(`G2-PENDING-${runId}`);
  await panel.getByRole('button', { name: 'Record controlled evidence' }).click();
  await expect(panel.getByRole('alert')).toContainText('Only a verified Clearance can satisfy worker screening.');
  await panel.getByLabel('Verification status').selectOption('pending');
  await panel.getByRole('button', { name: 'Record controlled evidence' }).click();
  await expect(panel).toContainText('pending_verification');
  await expect(panel).toContainText('Pending');

  const required = ['identity_verified','right_to_work','first_aid','cpr','code_of_conduct','privacy_confidentiality','whs_induction','safeguarding'];
  for (const requirementCode of required) {
    const result = await page.evaluate(async ({ staffId, requirementCode, runId }) => {
      const response = await fetch('/api/workforce/readiness', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        kind: 'credential', staffId, requirementCode, requirementType: requirementCode === 'identity_verified' ? 'identity' : requirementCode === 'right_to_work' ? 'work_eligibility' : 'credential',
        verificationStatus: 'verified', credentialNumber: `G2-EVIDENCE-${runId}-${requirementCode}`,
      }) });
      return response.status;
    }, { staffId, requirementCode, runId });
    expect(result).toBe(200);
  }
  const clearance = await page.evaluate(async ({ staffId, runId }) => {
    const response = await fetch('/api/workforce/readiness', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      kind: 'credential', staffId, requirementCode: 'ndis_worker_screening', requirementType: 'screening', verificationStatus: 'verified',
      screeningStatus: 'Clearance', credentialNumber: `G2-CLEARANCE-${runId}`, expiryDate: new Date(Date.now() + 86_400_000 * 30).toISOString().slice(0, 10),
    }) });
    return response.status;
  }, { staffId, runId });
  expect(clearance).toBe(200);

  await page.reload();
  await page.getByRole('button', { name: /Workers & Credentials/ }).click();
  await page.getByLabel('Search operations').fill(workerName);
  await page.getByRole('button', { name: 'Clearances' }).click();
  await expect(page.getByTestId('worker-readiness-panel')).toContainText('Roster ready');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId('worker-readiness-panel')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });

  const { data: audits } = await supabase.from('audit_events').select('actor_id,action').eq('entity_id', staffId);
  expect(audits?.some((event) => event.action === 'credential_verified' && event.actor_id !== 'client')).toBe(true);
});
