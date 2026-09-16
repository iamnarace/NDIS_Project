import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Route Handlers
import { GET as getInvitationsHandler, POST as postInvitationHandler } from '../app/api/crm/agreements/[id]/invitations/route.ts';
import { GET as getSigningDataHandler, POST as postSigningHandler } from '../app/api/contracts/sign/[token]/route.ts';
import { POST as postHumanViewHandler } from '../app/api/contracts/sign/[token]/view/route.ts';
import { POST as postSignAgreementHandler } from '../app/api/crm/agreements/sign/route.ts';
import { generateSessionToken, ADMIN_COOKIE_NAME } from '../lib/adminAuth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env.local
const localEnvPath = path.join(rootDir, '.env.local');
const envFile = fs.existsSync(localEnvPath) ? fs.readFileSync(localEnvPath, 'utf8') : '';
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase configuration in environment.');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TEST_SIGNATURE_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const cleanup = {
  agreementIds: new Set(),
  storagePaths: new Set(),
};

async function performCleanup() {
  if (cleanup.storagePaths.size > 0) {
    const paths = Array.from(cleanup.storagePaths);
    try {
      await supabase.storage.from('crm-documents').remove(paths);
    } catch {}
    cleanup.storagePaths.clear();
  }

  if (cleanup.agreementIds.size > 0) {
    const ids = Array.from(cleanup.agreementIds);
    for (const id of ids) {
      try {
        await supabase.from('agreement_signing_invitations').delete().eq('agreement_id', id);
        await supabase.from('agreement_signatures').delete().eq('agreement_id', id);
        await supabase.from('agreement_records').delete().eq('id', id);
      } catch {}
    }
    cleanup.agreementIds.clear();
  }
}

function createAdminMockRequest(url, method = 'GET', body = null) {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  headers.set('x-forwarded-for', '127.0.0.1');
  headers.set('user-agent', 'Playwright-Acceptance-Runner/1.0');

  const sessionToken = generateSessionToken();
  headers.set('authorization', `Bearer ${sessionToken}`);
  headers.set('cookie', `${ADMIN_COOKIE_NAME}=${sessionToken}`);

  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function createPublicMockRequest(url, method = 'GET', body = null, extraHeaders = {}) {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  headers.set('x-forwarded-for', '203.0.113.42');
  headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RecipientBrowser/1.0');

  for (const [k, v] of Object.entries(extraHeaders)) {
    headers.set(k, v);
  }

  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

test('Controlled E2E Acceptance — Complete External Send-and-Sign Lifecycle', async (t) => {
  t.after(async () => {
    await performCleanup();
  });

  const { data: staffList } = await supabase
    .from('staff')
    .select('id, full_name')
    .limit(1);

  const ownerId = staffList?.[0]?.id;
  assert.ok(ownerId, 'At least one staff member must exist to attach agreement');

  const { data: templates } = await supabase
    .from('document_templates')
    .select('id, template_code')
    .limit(1);

  const templateId = templates?.[0]?.id || null;

  const testRef = `AGR-TEST-${Date.now().toString(36).toUpperCase()}`;
  const { data: agreement, error: agrErr } = await supabase
    .from('agreement_records')
    .insert({
      agreement_reference: testRef,
      template_id: templateId,
      template_version: '2026.1',
      owner_type: 'staff',
      owner_id: ownerId,
      title: 'Support Worker Employment Contract (E2E Test)',
      status: 'draft',
      version_number: 1,
      questionnaire_data: {
        worker_name: 'Sarah Connor',
        hourly_rate: 45.0,
        position_title: 'Disability Support Worker',
      },
      compiled_clauses: {
        basis: 'Casual',
        ordinary_hours: 20,
        confidentiality: 'Strict non-disclosure of participant information.',
      },
      commencement_date: '2026-10-01',
      review_date: '2027-10-01',
    })
    .select()
    .single();

  assert.ok(!agrErr, `Failed to create test agreement: ${agrErr?.message}`);
  assert.ok(agreement);
  cleanup.agreementIds.add(agreement.id);

  // 1. Admin dispatches invitation with provider pre-signing
  const invReq = createAdminMockRequest(
    `http://localhost:3000/api/crm/agreements/${agreement.id}/invitations`,
    'POST',
    {
      party_role: 'worker',
      recipient_name: 'Sarah Connor',
      recipient_email: 'sarah.connor.ndis.test@example.com',
      sign_as_provider: true,
      provider_signer_name: 'Naresh Admin',
      provider_signature_data: TEST_SIGNATURE_PNG,
    }
  );

  const invRes = await postInvitationHandler(invReq, { params: Promise.resolve({ id: agreement.id }) });
  const invJson = await invRes.json();

  assert.equal(invRes.status, 200, `Expected 200 but got ${invRes.status}: ${JSON.stringify(invJson)}`);
  assert.ok(invJson.ok, 'Invitation dispatch must return ok: true');
  assert.ok(invJson.invitation_id, 'Invitation ID must be returned');

  // Verify provider signature was recorded
  const { data: provSig } = await supabase
    .from('agreement_signatures')
    .select('*')
    .eq('agreement_id', agreement.id)
    .eq('party_role', 'provider_rep')
    .single();

  assert.ok(provSig, 'Provider signature must exist in database');
  assert.equal(provSig.signer_name, 'Naresh Admin');
  assert.equal(provSig.signing_method, 'digital_canvas');

  // 2. Idempotency Guard: Verify re-signing as provider before execution succeeds idempotently without duplicating
  const reProvReq = createAdminMockRequest(
    'http://localhost:3000/api/crm/agreements/sign',
    'POST',
    {
      agreement_id: agreement.id,
      party_role: 'provider_rep',
      signer_name: 'Naresh Admin',
      signer_title: 'Managing Director',
      signer_email: 'support@opuscare.com.au',
      signing_method: 'digital_canvas',
      signature_image_data: TEST_SIGNATURE_PNG,
    }
  );

  const reProvRes = await postSignAgreementHandler(reProvReq);
  const reProvJson = await reProvRes.json();
  assert.equal(reProvRes.status, 200, `Idempotent provider sign should succeed: ${JSON.stringify(reProvJson)}`);

  const { count: provSigCount } = await supabase
    .from('agreement_signatures')
    .select('id', { count: 'exact', head: true })
    .eq('agreement_id', agreement.id)
    .eq('party_role', 'provider_rep');

  assert.equal(provSigCount, 1, 'Provider signature count must remain strictly 1 (no duplicate)');

  // 3. Fetch created invitation from database
  const { data: invDb } = await supabase
    .from('agreement_signing_invitations')
    .select('*')
    .eq('id', invJson.invitation_id)
    .single();

  assert.ok(invDb, 'Invitation record must exist in database');
  assert.equal(invDb.status, 'pending');
  assert.ok(['sent', 'simulated'].includes(invDb.delivery_status), `Delivery status was ${invDb.delivery_status}`);
  assert.match(invDb.token_hash, /^[0-9a-f]{64}$/, 'Token hash must be 64-char hex');
  assert.ok(invDb.document_snapshot, 'Document snapshot must be frozen in DB');
  assert.equal(invDb.document_snapshot.questionnaire_data.worker_name, 'Sarah Connor');

  // 4. Verify partial UNIQUE index: Direct insertion of duplicate active invitation must fail at DB level
  const { error: dupDbErr } = await supabase
    .from('agreement_signing_invitations')
    .insert({
      agreement_id: agreement.id,
      token_hash: crypto.randomBytes(32).toString('hex'),
      party_role: 'worker',
      recipient_name: 'Sarah Connor',
      recipient_email: 'sarah.connor.ndis.test@example.com',
      document_snapshot: invDb.document_snapshot,
      document_hash_sha256: invDb.document_hash_sha256,
      status: 'pending',
    });

  assert.ok(dupDbErr, 'Database partial UNIQUE index must reject duplicate active invitation for same agreement and role');
  assert.match(dupDbErr.message, /uq_agreement_active_invitation|unique constraint/i);

  // 5. Extract raw token from dispatch response preview URL
  const signingUrl = invJson.signing_url_preview || invJson.signing_url;
  const rawToken = signingUrl?.split('/contracts/sign/')?.[1];
  assert.ok(rawToken && rawToken.length >= 32, `Raw token must be present in preview URL: ${signingUrl}`);

  // 6. Recipient loads the page via GET: purely read-only (does not mark viewed)
  const getReq = createPublicMockRequest(`http://localhost:3000/api/contracts/sign/${rawToken}`, 'GET');
  const getRes = await getSigningDataHandler(getReq, { params: Promise.resolve({ token: rawToken }) });
  const getJson = await getRes.json();

  assert.equal(getRes.status, 200, `Expected 200 for token GET: ${JSON.stringify(getJson)}`);
  assert.ok(getJson.ok);
  assert.equal(getJson.invitation.status, 'pending');
  assert.equal(getJson.provider_signed, true, 'Provider pre-signature must be indicated');
  assert.equal(getRes.headers.get('cache-control'), 'no-store, no-cache, must-revalidate, proxy-revalidate');
  assert.equal(getRes.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');

  const { data: invStillPending } = await supabase
    .from('agreement_signing_invitations')
    .select('status, viewed_at')
    .eq('id', invDb.id)
    .single();

  assert.equal(invStillPending.status, 'pending', 'GET must not advance status to viewed');
  assert.equal(invStillPending.viewed_at, null, 'GET must not set viewed_at');

  // 7. Human interaction triggers view event
  const viewReq = createPublicMockRequest(`http://localhost:3000/api/contracts/sign/${rawToken}/view`, 'POST');
  const viewRes = await postHumanViewHandler(viewReq, { params: Promise.resolve({ token: rawToken }) });
  const viewJson = await viewRes.json();

  assert.equal(viewRes.status, 200);
  assert.ok(viewJson.viewed);

  const { data: invNowViewed } = await supabase
    .from('agreement_signing_invitations')
    .select('status, viewed_at, human_view_ip, human_view_user_agent')
    .eq('id', invDb.id)
    .single();

  assert.equal(invNowViewed.status, 'viewed', 'Human interaction must set status to viewed');
  assert.ok(invNowViewed.viewed_at, 'viewed_at timestamp must be populated');
  assert.equal(invNowViewed.human_view_ip, '203.0.113.42');

  // 8. Recipient signs electronically
  const signReq = createPublicMockRequest(
    `http://localhost:3000/api/contracts/sign/${rawToken}`,
    'POST',
    {
      signer_name: 'Sarah Connor',
      signer_title: 'Support Worker',
      signature_image_data: TEST_SIGNATURE_PNG,
      legal_intent_accepted: true,
    }
  );

  const signRes = await postSigningHandler(signReq, { params: Promise.resolve({ token: rawToken }) });
  const signJson = await signRes.json();

  assert.equal(signRes.status, 200, `Signing submission failed: ${JSON.stringify(signJson)}`);
  assert.ok(signJson.ok, 'Signing must succeed');
  assert.equal(signJson.is_fully_signed, true, 'Both parties have signed, must be fully signed');

  // 9. Verify Database Execution State
  const { data: activeAgr } = await supabase
    .from('agreement_records')
    .select('*')
    .eq('id', agreement.id)
    .single();

  assert.equal(activeAgr.status, 'active', 'Agreement status must transition to active');
  assert.ok(activeAgr.executed_at, 'executed_at must be populated');
  assert.ok(activeAgr.executed_pdf_path, 'executed_pdf_path must be populated');
  assert.match(activeAgr.executed_pdf_path, /\.pdf$/, 'Executed document path must end with .pdf');
  assert.match(activeAgr.executed_hash_sha256, /^[0-9a-f]{64}$/, 'executed_hash_sha256 must be 64-char hex');

  cleanup.storagePaths.add(activeAgr.executed_pdf_path);

  // 10. Verify Storage Integrity: Download actual PDF bytes and verify SHA-256 matches
  const { data: downloadedBlob, error: downloadErr } = await supabase
    .storage
    .from('crm-documents')
    .download(activeAgr.executed_pdf_path);

  assert.ok(!downloadErr, `Failed to download executed PDF: ${downloadErr?.message}`);
  assert.ok(downloadedBlob, 'Downloaded PDF blob must exist');

  const arrayBuffer = await downloadedBlob.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);

  const magic = pdfBuffer.subarray(0, 5).toString('ascii');
  assert.equal(magic, '%PDF-', 'Stored document must be genuine PDF with %PDF- header');

  const computedHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  assert.equal(
    computedHash,
    activeAgr.executed_hash_sha256,
    'Database executed_hash_sha256 must match EXACT SHA-256 hash of the stored PDF file'
  );

  // 11. Database Immutability Guard: Executed active agreement cannot be modified
  const postExecReq = createAdminMockRequest(
    'http://localhost:3000/api/crm/agreements/sign',
    'POST',
    {
      agreement_id: agreement.id,
      party_role: 'provider_rep',
      signer_name: 'Naresh Admin',
      signer_title: 'Managing Director',
      signer_email: 'support@opuscare.com.au',
      signing_method: 'digital_canvas',
      signature_image_data: TEST_SIGNATURE_PNG,
    }
  );

  const postExecRes = await postSignAgreementHandler(postExecReq);
  assert.ok(
    postExecRes.status >= 400,
    'Attempting to sign an already executed agreement must be rejected by database immutability guard'
  );
});
