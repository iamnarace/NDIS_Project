import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  hashSigningToken,
  createDocumentSnapshot,
  validateSignatureImageData,
  sortKeys,
} from '../lib/services/agreementExecution.ts';
import {
  generateAuthoritativeExecutedBytes,
  calculateAuthoritativeHash,
  renderAuthoritativeExecutedDocumentHtml,
} from '../lib/services/agreementPdf.ts';

test('Agreement External Signing — Cryptographic Token Hashing', () => {
  const rawToken = 'a'.repeat(64);
  const hash1 = hashSigningToken(rawToken);
  const hash2 = hashSigningToken(rawToken);

  assert.equal(hash1, hash2, 'Token hashing must be deterministic');
  assert.match(hash1, /^[0-9a-f]{64}$/, 'Token hash must be a 64-character lowercase hex string');
  assert.notEqual(hash1, rawToken, 'Raw token must never equal token hash');
});

test('Agreement External Signing — Frozen Snapshot Integrity', () => {
  const dummyAgreement = {
    agreement_reference: 'AGR-2026-0001',
    template_id: '11111111-1111-1111-1111-111111111111',
    template_version: '2026.1',
    owner_type: 'staff',
    owner_id: '22222222-2222-2222-2222-222222222222',
    title: 'Support Worker Employment Agreement',
    version_number: 1,
    questionnaire_data: {
      worker_name: 'Jane Doe',
      hourly_rate: 42.50,
      worker_classification: 'Home Care Level 3',
    },
    compiled_clauses: {
      basis: 'Permanent Part-Time',
      ordinary_hours: 25,
    },
    commencement_date: '2026-10-01',
    review_date: '2027-10-01',
    expiry_date: null,
    estimated_budget: null,
  };

  const { snapshot, hash: initialHash } = createDocumentSnapshot(dummyAgreement);
  assert.ok(snapshot);
  assert.match(initialHash, /^[0-9a-f]{64}$/);

  // Key sorting guarantee: different insertion order must yield the exact same hash
  const shuffledAgreement = {
    ...dummyAgreement,
    questionnaire_data: {
      hourly_rate: 42.50,
      worker_classification: 'Home Care Level 3',
      worker_name: 'Jane Doe',
    },
  };
  const { hash: shuffledHash } = createDocumentSnapshot(shuffledAgreement);
  assert.equal(initialHash, shuffledHash, 'Deterministic key sorting must yield identical hashes for identical data');

  // Tampering with hourly rate must fail hash equality
  const tamperedAgreement = {
    ...dummyAgreement,
    questionnaire_data: {
      ...dummyAgreement.questionnaire_data,
      hourly_rate: 35.00,
    },
  };
  const { hash: tamperedHash } = createDocumentSnapshot(tamperedAgreement);
  assert.notEqual(initialHash, tamperedHash, 'Tampering with material terms must change the snapshot hash');
});

test('Agreement External Signing — Signature Image Validation', () => {
  // 1. Valid PNG data URL
  const validPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const val1 = validateSignatureImageData(validPng);
  assert.ok(val1.ok, 'Valid PNG data URL should be accepted');

  // 2. Reject missing / null
  const val2 = validateSignatureImageData(null);
  assert.equal(val2.ok, false);

  // 3. Reject non-image scheme
  const val3 = validateSignatureImageData('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==');
  assert.equal(val3.ok, false, 'Non-image MIME types must be rejected');

  // 4. Reject oversized payload (> 512 KB)
  const hugePayload = 'data:image/png;base64,' + 'A'.repeat(600 * 1024);
  const val4 = validateSignatureImageData(hugePayload);
  assert.equal(val4.ok, false, 'Payloads exceeding 512 KB must be rejected');
});

test('Agreement External Signing — Authoritative Document Rendering & Byte Hash', () => {
  const payload = {
    agreement: {
      id: '33333333-3333-3333-3333-333333333333',
      agreement_reference: 'AGR-2026-0005',
      title: 'Disability Support Worker Employment Contract',
      owner_type: 'staff',
      commencement_date: '2026-10-01',
      questionnaire_data: {
        worker_name: 'John Smith',
        hourly_rate: 45.00,
        agreed_weekly_hours: 30,
      },
      compiled_clauses: {
        classification: 'Support Worker Level 2',
      },
      template: {
        template_code: 'DOC-WRK-01',
        source_basis: 'SCHADS Award 2010',
      },
    },
    signatures: [
      {
        party_role: 'provider_rep',
        signer_name: 'Naresh Admin',
        signer_title: 'Managing Director',
        signed_at: '2026-09-16T10:00:00.000Z',
        signing_method: 'digital_canvas',
      },
      {
        party_role: 'worker',
        signer_name: 'John Smith',
        signer_title: 'Support Worker / Employee',
        signer_email: 'john@example.com',
        signed_at: '2026-09-16T12:00:00.000Z',
        signing_method: 'email_link',
      },
    ],
    org: {
      tradingName: 'Opus Care Support Services',
      abn: '41 267 197 576',
    },
  };

  const html = renderAuthoritativeExecutedDocumentHtml(payload);
  assert.ok(html.includes('Opus Care Support Services'), 'Must contain trading name');
  assert.ok(html.includes('41 267 197 576'), 'Must contain verified ABN');
  assert.ok(html.includes('AGR-2026-0005'), 'Must contain reference');
  assert.ok(html.includes('Naresh Admin'), 'Must contain provider representative name');
  assert.ok(html.includes('John Smith'), 'Must contain worker name');
  assert.ok(html.includes('FULLY EXECUTED'), 'Must state fully executed status');

  const bytes = generateAuthoritativeExecutedBytes(payload);
  const hash = calculateAuthoritativeHash(bytes);
  assert.match(hash, /^[0-9a-f]{64}$/, 'Authoritative hash must be 64-char lowercase hex');
});

test('Agreement External Signing — Public Signing Route & Security Definer Permissions', () => {
  const migration = readFileSync('supabase/migrations/20260916210000_agreement_signing_invitations.sql', 'utf8');

  // Verify Security Definer lockdown
  assert.match(migration, /revoke all on function public\.execute_external_agreement_signature/i);
  assert.match(migration, /grant execute on function public\.execute_external_agreement_signature.*to service_role/i);
  assert.match(migration, /revoke all on function public\.execute_provider_agreement_signature/i);
  assert.match(migration, /grant execute on function public\.execute_provider_agreement_signature.*to service_role/i);

  // Verify partial unique index enforcing single active invitation per agreement and role
  assert.match(migration, /create unique index if not exists uq_agreement_active_invitation/i);
  assert.match(migration, /where status in \('pending', 'viewed'\)/i);

  // Verify neutral statutory declaration in the public signing page
  const signingPage = readFileSync('app/contracts/sign/[token]/page.tsx', 'utf8');
  assert.match(signingPage, /I confirm my identity, consent to signing this agreement electronically, and intend my electronic signature to indicate my agreement to its terms/);

  // Verify privacy headers in signing API
  const apiRoute = readFileSync('app/api/contracts/sign/[token]/route.ts', 'utf8');
  assert.match(apiRoute, /no-store, no-cache, must-revalidate/);
  assert.match(apiRoute, /noindex, nofollow, noarchive/);
  assert.match(apiRoute, /no-referrer/);
});
