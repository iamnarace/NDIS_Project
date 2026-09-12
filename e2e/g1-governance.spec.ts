import { expect, test } from '@playwright/test';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const adminKey = process.env.ADMIN_ACCESS_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!adminKey || !supabaseUrl || !serviceRoleKey) {
  throw new Error('G1 browser acceptance requires server-only ADMIN_ACCESS_KEY and Supabase test configuration.');
}

const runId = crypto.randomBytes(6).toString('hex');
const marker = `G1 E2E ${runId}`;
const mainName = `${marker} Lifecycle`;
const manualName = `${marker} Manual`;
let supabase: SupabaseClient;
let referralId = '';
let participantId = '';
let manualParticipantId = '';
let assessmentIds: string[] = [];
let shiftIds: string[] = [];

async function insertReferral(name: string) {
  const { data, error } = await supabase.from('referrals').insert({
    reference_number: `G1-E2E-${runId}-${name === mainName ? 'L' : 'O'}`,
    referrer_name: 'Governance Browser Harness',
    referrer_role: 'Authorised test fixture',
    phone: '0400000000',
    email: `g1-e2e-${runId}@example.invalid`,
    participant_name: name,
    suburb: 'Grafton NSW',
    funding_type: 'Self-Managed',
    services: 'Governed browser acceptance fixture',
    schedule_preference: null,
    notes: 'Disposable deterministic local browser acceptance fixture.',
    status: 'new',
  }).select('id').single();
  if (error || !data) throw new Error(`Could not create G1 referral fixture: ${error?.message || 'no row'}`);
  return data.id as string;
}

async function cleanup() {
  if (shiftIds.length) await supabase.from('shift_assignments').delete().in('shift_id', shiftIds);
  if (shiftIds.length) await supabase.from('shifts').delete().in('id', shiftIds);
  const participantIds = [participantId, manualParticipantId].filter(Boolean);
  if (participantIds.length) await supabase.from('participant_onboarding_checklists').delete().in('participant_id', participantIds);
  if (participantIds.length) await supabase.from('audit_events').delete().in('entity_id', participantIds);
  if (assessmentIds.length) await supabase.from('service_suitability_assessments').delete().in('id', assessmentIds);
  if (participantIds.length) await supabase.from('participants').delete().in('id', participantIds);
  if (referralId) await supabase.from('referrals').delete().eq('id', referralId);
}

async function cleanupInterruptedHarnessFixtures() {
  const { data: participants } = await supabase.from('participants').select('id').ilike('full_name', 'G1 E2E %');
  const participantIds = (participants || []).map(item => item.id);
  if (participantIds.length) {
    const { data: shifts } = await supabase.from('shifts').select('id').in('participant_id', participantIds);
    const ids = (shifts || []).map(item => item.id);
    if (ids.length) await supabase.from('shift_assignments').delete().in('shift_id', ids);
    if (ids.length) await supabase.from('shifts').delete().in('id', ids);
    await supabase.from('participant_onboarding_checklists').delete().in('participant_id', participantIds);
    await supabase.from('audit_events').delete().in('entity_id', participantIds);
    await supabase.from('service_suitability_assessments').delete().in('participant_id', participantIds);
    await supabase.from('participants').delete().in('id', participantIds);
  }
  const { data: referrals } = await supabase.from('referrals').select('id').ilike('email', 'g1-e2e-%@example.invalid');
  const referralIds = (referrals || []).map(item => item.id);
  if (referralIds.length) {
    await supabase.from('service_suitability_assessments').delete().in('referral_id', referralIds);
    await supabase.from('referrals').delete().in('id', referralIds);
  }
}

test.beforeAll(async () => {
  supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  await cleanupInterruptedHarnessFixtures();
  referralId = await insertReferral(mainName);
});

test.afterAll(async () => {
  await cleanup();
});

test('G1 authenticated governance lifecycle, persistence, safety and responsive acceptance', async ({ page }) => {
  await page.goto('/referral');
  await expect(page.getByPlaceholder('e.g. Yamba, Maclean, Grafton, New Italy...')).toHaveValue('');
  await page.getByPlaceholder('e.g. Sarah Jenkins').fill('Browser Defaults Probe');
  await page.getByPlaceholder('04xx xxx xxx').fill('0400000000');
  await page.getByPlaceholder('name@example.com.au').fill('defaults-probe@example.invalid');
  await page.getByPlaceholder('e.g. Yamba, Maclean, Grafton, New Italy...').fill('Grafton NSW');
  await page.getByRole('button', { name: /Continue to Step 2/ }).click();
  await expect(page.locator('.serviceSelectCard.selected')).toHaveCount(0);
  await expect(page.locator('.fundingSelectCard.selected')).toHaveCount(0);

  await page.goto('/admin');
  await expect(page.getByLabel('Admin Access Key')).toBeVisible();
  const unauthenticated = await page.request.get('/api/referral');
  expect(unauthenticated.status()).toBe(401);

  await page.getByLabel('Admin Access Key').fill(adminKey);
  await page.getByRole('button', { name: 'Unlock Admin CRM' }).click();
  await expect(page.getByRole('button', { name: 'Referrals', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Referrals', exact: true }).click();
  await page.getByText(mainName, { exact: true }).click();
  await page.getByRole('button', { name: 'Assess Suitability' }).click();
  const suitability = page.getByRole('dialog').filter({ hasText: 'Service Suitability Assessment' });
  await suitability.getByText('Adults 18+ Confirmation:').click();
  await suitability.getByRole('button', { name: /Next: Location/ }).click();
  await suitability.getByRole('button', { name: /Next: Funding/ }).click();
  await suitability.locator('#pFunding').selectOption('Self-Managed');
  await suitability.getByRole('button', { name: /Next: Service Scope/ }).click();

  const catalogue = await page.evaluate(async () => {
    const response = await fetch('/api/governance/service-scope?view=internal');
    return response.json();
  });
  const activeService = catalogue.services.find((service: any) =>
    service.operationalStatus === 'ACTIVE' && service.rosterEligible === true
  );
  expect(activeService, 'An active roster-eligible governed service must exist').toBeTruthy();
  for (const expected of [
    { status: 'REGISTRATION_REQUIRED', outcome: 'Registered Provider Requirement' },
    { status: 'CONDITIONAL_CLINICAL', outcome: 'Clinical Review Required' },
  ]) {
    const governedService = catalogue.services.find((service: any) => service.operationalStatus === expected.status);
    expect(governedService, `${expected.status} service must be visible to authenticated intake`).toBeTruthy();
    const result = await page.evaluate(async ({ participantName, serviceCode, clinical }) => {
      const response = await fetch('/api/crm/suitability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantName, isAdult: true, fundingType: 'Self-Managed', suburb: 'Grafton NSW',
          requestedServices: [serviceCode], riskTriage: clinical ? { clinicalTasks: true } : {},
        }),
      });
      return { status: response.status, body: await response.json() };
    }, { participantName: `${marker} ${expected.status}`, serviceCode: governedService.serviceCode, clinical: expected.status === 'CONDITIONAL_CLINICAL' });
    expect(result.status).toBe(200);
    expect(result.body.assessment.outcome).toBe(expected.outcome);
    assessmentIds.push(result.body.assessment.id);
  }
  await suitability.getByText(activeService.publicName, { exact: true }).click();
  await suitability.getByRole('button', { name: /Next: Risk/ }).click();
  await suitability.getByText('Medication prompting or assistance with self-administration', { exact: true }).click();
  await suitability.getByText('Participant transport is requested as part of service delivery', { exact: true }).click();
  await suitability.getByRole('button', { name: /Next: Outcome Review/ }).click();
  await suitability.getByRole('button', { name: 'Finalise Suitability Assessment' }).click();
  await expect(page.getByText('Suitability accepted — Start Onboarding')).toBeVisible();

  const assessmentResponse = await page.evaluate(async (id) => {
    const response = await fetch(`/api/crm/suitability?referral_id=${encodeURIComponent(id)}`);
    return response.json();
  }, referralId);
  assessmentIds.push(...assessmentResponse.assessments.map((item: any) => item.id));
  expect(assessmentResponse.assessments[0].outcome).toMatch(/^Suitable/);

  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Start Onboarding' }).click();
  await expect.poll(async () => {
    const { data } = await supabase.from('participants').select('id').eq('referral_id', referralId).maybeSingle();
    participantId = data?.id || '';
    return participantId;
  }).not.toBe('');

  await page.reload();
  await expect(page.getByRole('button', { name: 'Referrals', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Participants', exact: true }).click();
  const participantRow = page.getByRole('row').filter({ hasText: mainName });
  await expect(participantRow.getByText('onboarding', { exact: true })).toBeVisible();
  await participantRow.getByRole('button', { name: 'Readiness checklist' }).click();
  const checklist = page.getByRole('dialog').filter({ hasText: `Onboarding Governance: ${mainName}` });
  await expect(checklist.getByText('Medication Authority / Support Plan Verified')).toBeVisible();
  await expect(checklist.getByText('Participant Transport Governance Confirmed')).toBeVisible();
  await expect(checklist.getByRole('button', { name: 'Readiness Review Incomplete' })).toBeDisabled();

  const illegalWaiver = await page.evaluate(async (id) => {
    const response = await fetch('/api/crm/onboarding', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: id, code: 'identity_verified', status: 'waived', waiverReason: 'test' }),
    });
    return { status: response.status, body: await response.json() };
  }, participantId);
  expect(illegalWaiver.status).toBeGreaterThanOrEqual(400);
  expect(illegalWaiver.body.error).toBeTruthy();
  await expect(checklist.getByText('Non-Waivable').first()).toBeVisible();

  const ndisItem = checklist.getByTestId('checklist-item-ndis_number_verified');
  await ndisItem.getByRole('button', { name: 'Waive' }).click();
  await expect(page.getByRole('button', { name: 'Confirm Waiver' })).toBeDisabled();
  await page.getByLabel('Waiver rationale').fill('Participant is privately self-funding while NDIS access is pending.');
  await page.getByRole('button', { name: 'Confirm Waiver' }).click();
  await expect(checklist.getByText('Waived', { exact: true }).first()).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Participants', exact: true }).click();
  await page.getByRole('row').filter({ hasText: mainName }).getByRole('button', { name: 'Readiness checklist' }).click();
  const reloadedChecklist = page.getByRole('dialog').filter({ hasText: `Onboarding Governance: ${mainName}` });
  await expect(reloadedChecklist.getByText('Participant is privately self-funding while NDIS access is pending.')).toBeVisible();

  while (await reloadedChecklist.getByRole('button', { name: 'Verify' }).count()) {
    const verifyButtons = reloadedChecklist.getByRole('button', { name: 'Verify' });
    const previousCount = await verifyButtons.count();
    const verifyButton = verifyButtons.first();
    const [updateResponse] = await Promise.all([
      page.waitForResponse(response => response.url().endsWith('/api/crm/onboarding') && response.request().method() === 'PATCH'),
      verifyButton.click(),
    ]);
    expect(updateResponse.status(), await updateResponse.text()).toBe(200);
    await expect(verifyButtons).toHaveCount(previousCount - 1);
  }
  await expect(reloadedChecklist.getByRole('button', { name: 'Approve for Active Rostering' })).toBeEnabled();
  const [signoffResponse] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/crm/onboarding') && response.request().method() === 'POST'),
    reloadedChecklist.getByRole('button', { name: 'Approve for Active Rostering' }).click(),
  ]);
  expect(signoffResponse.status(), await signoffResponse.text()).toBe(200);
  await expect(reloadedChecklist).toHaveCount(0);
  await expect.poll(async () => {
    const { data } = await supabase.from('participants').select('is_rosterable').eq('id', participantId).single();
    return data?.is_rosterable;
  }).toBe(true);

  await page.reload();
  await page.getByRole('button', { name: 'Participants', exact: true }).click();
  const readyRow = page.getByRole('row').filter({ hasText: mainName });
  await expect(readyRow.getByText('Roster ready', { exact: true })).toBeVisible();

  const shiftPayload = {
    participant_id: participantId,
    service_type: 'G1 browser acceptance historical shift',
    start_time: new Date(Date.now() + 86_400_000).toISOString(),
    end_time: new Date(Date.now() + 90_000_000).toISOString(),
    location_suburb: 'Grafton NSW',
  };
  const createdShift = await page.evaluate(async (payload) => {
    const response = await fetch('/api/workforce/shifts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return { status: response.status, body: await response.json() };
  }, shiftPayload);
  expect(createdShift.status).toBe(200);
  shiftIds = createdShift.body.shifts.map((item: any) => item.id);

  const revoke = await page.evaluate(async (id) => {
    const response = await fetch('/api/crm/onboarding', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: id, code: 'identity_verified', status: 'pending' }),
    });
    return response.status;
  }, participantId);
  expect(revoke).toBe(200);
  const rejectedShift = await page.evaluate(async (payload) => {
    const response = await fetch('/api/workforce/shifts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return { status: response.status, body: await response.json() };
  }, { ...shiftPayload, start_time: new Date(Date.now() + 172_800_000).toISOString(), end_time: new Date(Date.now() + 176_400_000).toISOString() });
  expect(rejectedShift.status).toBe(400);
  expect(rejectedShift.body.message).toMatch(/onboarding is incomplete/i);
  const historical = await page.evaluate(async (id) => {
    const response = await fetch(`/api/workforce/shifts?participant_id=${encodeURIComponent(id)}`);
    return response.json();
  }, participantId);
  expect(historical.some((item: any) => shiftIds.includes(item.id))).toBe(true);

  await page.getByRole('button', { name: 'Add Participant' }).first().click();
  const manual = page.getByRole('dialog').filter({ hasText: 'Add NDIS Participant' });
  await manual.locator('#pName').fill(manualName);
  await manual.getByRole('button', { name: 'Continue' }).click();
  await manual.locator('#pSuburb').selectOption('Grafton NSW');
  await manual.getByRole('button', { name: 'Continue' }).click();
  await manual.locator('#pFunding').selectOption('Self-Managed');
  await manual.getByRole('button', { name: 'Continue' }).click();
  await manual.getByRole('button', { name: 'Continue' }).click();
  const [manualResponse] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith('/api/crm/participants') && response.request().method() === 'POST'),
    manual.getByRole('button', { name: 'Create Participant' }).click(),
  ]);
  expect(manualResponse.status(), await manualResponse.text()).toBe(200);
  const { data: manualRow } = await supabase.from('participants').select('id,lifecycle_stage,is_rosterable,suitability_assessment_id').eq('full_name', manualName).single();
  manualParticipantId = manualRow!.id;
  expect(manualRow!.lifecycle_stage).toBe('intake_assessment');
  expect(manualRow!.is_rosterable).toBe(false);
  expect(manualRow!.suitability_assessment_id).toBeNull();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByLabel('Admin Access Key')).toHaveCount(0);
  const viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(viewport.scrollWidth).toBeLessThanOrEqual(viewport.width + 2);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByText('Sign Out', { exact: true }).click();
  await expect(page.getByLabel('Admin Access Key')).toBeVisible();
  expect((await page.request.get('/api/referral')).status()).toBe(401);
});
