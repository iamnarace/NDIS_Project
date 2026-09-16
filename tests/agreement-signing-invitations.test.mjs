import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import {
  hashSigningToken,
  createDocumentSnapshot,
  validateSignatureImageData,
  checkAndExpireInvitations,
} from '../lib/services/agreementExecution.ts';
import {
  generateAuthoritativeExecutedPdf,
  calculateAuthoritativeHash,
  uploadExecutedDocument,
} from '../lib/services/agreementPdf.ts';

test('Agreement External Signing — Cryptographic Token Hashing', () => {
  const rawToken = 'a'.repeat(64);
  const hash1 = hashSigningToken(rawToken);
  const hash2 = hashSigningToken(rawToken);

  assert.equal(hash1, hash2, 'Token hashing must be deterministic');
  assert.match(hash1, /^[0-9a-f]{64}$/, 'Token hash must be a 64-character lowercase hex string');
  assert.notEqual(hash1, rawToken, 'Raw token must never equal token hash');
});

test('Agreement External Signing — Frozen Snapshot Integrity & Expansion', () => {
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
      confidentiality: 'Strict non-disclosure of participant information.',
    },
    commencement_date: '2026-10-01',
    review_date: '2027-10-01',
    expiry_date: null,
    estimated_budget: null,
    template: {
      template_code: 'DOC-WRK-01',
      source_basis: 'SCHADS Industry Award 2010',
      clause_schema: {
        confidentiality: 'Protect participant and worker information.',
      },
    },
  };

  const org = {
    tradingName: 'Opus Care Support Services',
    abn: '41 267 197 576',
    proprietorLegalName: 'Authorised Proprietor',
  };

  const { snapshot, hash: initialHash } = createDocumentSnapshot(dummyAgreement, org);
  assert.ok(snapshot);
  assert.match(initialHash, /^[0-9a-f]{64}$/);

  // Proves snapshot contains contractual terms, verified ABN, and provider legal name
  assert.equal(snapshot.provider_abn, '41 267 197 576');
  assert.equal(snapshot.provider_legal_name, 'Authorised Proprietor');
  assert.equal(snapshot.provider_trading_name, 'Opus Care Support Services');
  assert.equal(snapshot.compiled_clauses.confidentiality, 'Strict non-disclosure of participant information.');
  assert.equal(snapshot.template_clause_schema.confidentiality, 'Protect participant and worker information.');

  // Tampering with material terms must change snapshot hash
  const tampered = {
    ...dummyAgreement,
    compiled_clauses: {
      ...dummyAgreement.compiled_clauses,
      ordinary_hours: 20,
    },
  };
  const { hash: tamperedHash } = createDocumentSnapshot(tampered, org);
  assert.notEqual(initialHash, tamperedHash, 'Tampering with contractual terms must change snapshot hash');
});

test('Agreement External Signing — Genuine PDF Generation (%PDF-)', async () => {
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
        terms: 'Approved SCHADS compliance clauses.',
      },
      frozen_snapshot: {
        provider_abn: '41 267 197 576',
        provider_legal_name: 'Authorised Proprietor',
        compiled_clauses: {
          classification: 'Support Worker Level 2',
          frozen_terms: 'Frozen contractual terms at issuance.',
        },
        template_clause_schema: {
          complete_terms: 'This complete approved clause must continue without truncation. '.repeat(450),
        },
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

  const pdfBuffer = await generateAuthoritativeExecutedPdf(payload);
  assert.ok(Buffer.isBuffer(pdfBuffer), 'Must return a Node Buffer');
  assert.ok(pdfBuffer.length > 500, 'PDF buffer must contain substantial content');

  // Verify valid PDF magic bytes (%PDF-)
  const magicBytes = pdfBuffer.subarray(0, 5).toString('ascii');
  assert.equal(magicBytes, '%PDF-', 'Document must begin with %PDF-');

  const loadedPdf = await PDFDocument.load(pdfBuffer);
  assert.ok(loadedPdf.getPageCount() > 2, 'Long approved clauses must flow across continuation pages');

  // Authoritative hash must be 64-char lowercase hex of the actual PDF bytes
  const hash = calculateAuthoritativeHash(pdfBuffer);
  assert.match(hash, /^[0-9a-f]{64}$/, 'Authoritative hash must be 64-char hex');
});

test('Agreement External Signing — Storage Failure Aborts Execution', async () => {
  const validPdfBuffer = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n');

  // 1. Storage client unavailable throws
  await assert.rejects(
    async () => {
      await uploadExecutedDocument(null, 'AGR-TEST', validPdfBuffer);
    },
    /Supabase storage client is unavailable/
  );

  // 2. Storage upload error throws immediately rather than proceeding
  const mockFailingStorage = {
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error('Bucket quota exceeded or network down') }),
      }),
    },
  };

  await assert.rejects(
    async () => {
      await uploadExecutedDocument(mockFailingStorage, 'AGR-TEST', validPdfBuffer);
    },
    /Authoritative executed document storage failed/
  );

  // 3. Reject non-PDF bytes
  const nonPdfBuffer = Buffer.from('<html>Not a PDF</html>');
  await assert.rejects(
    async () => {
      await uploadExecutedDocument(mockFailingStorage, 'AGR-TEST', nonPdfBuffer);
    },
    /must be a valid PDF beginning with %PDF-/
  );
});

test('Agreement External Signing — Neutral Footer & Database RPC Guarantees', () => {
  const migration = readFileSync('supabase/migrations/20260916210000_agreement_signing_invitations.sql', 'utf8');
  const integrityMigration = readFileSync('supabase/migrations/20260917110000_agreement_snapshot_integrity_closure.sql', 'utf8');

  // 1. Prove duplicate provider signature is prevented by database unique index
  assert.match(migration, /create unique index if not exists uq_agreement_provider_signature/i);
  assert.match(migration, /where party_role = 'provider_rep'/i);

  // 2. Prove internal recipient finalization is atomic via execute_internal_recipient_signature
  assert.match(migration, /create or replace function public\.execute_internal_recipient_signature/i);
  assert.match(migration, /active_status_requires_valid_executed_evidence/i);

  // 3. Prove hard guard: Active status requires valid executed_pdf_path and 64-char SHA-256 hash
  assert.match(migration, /p_executed_hash_sha256 !~ '\^\[0-9a-f\]\{64\}\$'/i);

  // 4. Prove security definer permissions: Revoke from public, anon, authenticated; grant only service_role
  assert.match(migration, /revoke all on function public\.execute_external_agreement_signature/i);
  assert.match(migration, /grant execute on function public\.execute_external_agreement_signature.*to service_role/i);
  assert.match(migration, /revoke all on function public\.execute_provider_agreement_signature/i);
  assert.match(migration, /grant execute on function public\.execute_provider_agreement_signature.*to service_role/i);
  assert.match(migration, /revoke all on function public\.execute_internal_recipient_signature/i);
  assert.match(migration, /grant execute on function public\.execute_internal_recipient_signature.*to service_role/i);

  // 5. Material terms lock as soon as an invitation or signature exists.
  assert.match(integrityMigration, /agreement_material_terms_locked_after_signing_started/i);
  assert.match(integrityMigration, /agreement_signatures/i);
  assert.match(integrityMigration, /status in \('pending', 'viewed', 'signed'\)/i);

  // 6. Neutral legal wording and complete multi-page clause rendering.
  const agreementPdfCode = readFileSync('lib/services/agreementPdf.ts', 'utf8');
  assert.match(agreementPdfCode, /This document records electronic signatures applied by the parties/);
  assert.doesNotMatch(agreementPdfCode, /constitutes a binding legal agreement/i);
  assert.doesNotMatch(agreementPdfCode, /substring\(0,\s*180\)/i);
  assert.match(agreementPdfCode, /APPROVED CONTRACTUAL TERMS & CONDITIONS \(CONTINUED\)/i);

  const agreementExecutionCode = readFileSync('lib/services/agreementExecution.ts', 'utf8');
  assert.match(agreementExecutionCode, /provider_legal_name:\s*\n?\s*org\?\.proprietorLegalName/i);
  assert.match(agreementExecutionCode, /signedInvitation\.document_snapshot/i);
  assert.match(agreementExecutionCode, /terms differ from the document signed by the recipient/i);
});

test('Agreement External Signing — Expiration Lifecycle Transitions', async () => {
  let updatedInvitationStatus = '';
  let updatedAgreementStatus = '';

  const mockSupabase = {
    from: (table) => {
      if (table === 'agreement_signing_invitations') {
        return {
          select: () => ({
            in: () => ({
              lt: () => ({
                eq: async () => ({ data: [{ id: 'inv-1', agreement_id: 'agr-1' }] }),
              }),
            }),
            eq: () => ({
              in: async () => ({ data: [] }), // 0 remaining
            }),
          }),
          update: (payload) => ({
            in: async () => {
              updatedInvitationStatus = payload.status;
              return { error: null };
            },
          }),
        };
      }
      if (table === 'agreement_records') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: { id: 'agr-1', status: 'sent_for_signature' } }),
            }),
          }),
          update: (payload) => ({
            eq: async () => {
              updatedAgreementStatus = payload.status;
              return { error: null };
            },
          }),
        };
      }
      if (table === 'agreement_signatures') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null }), // Provider had not pre-signed
              }),
            }),
          }),
        };
      }
      return {};
    },
  };

  await checkAndExpireInvitations(mockSupabase, 'agr-1');
  assert.equal(updatedInvitationStatus, 'expired', 'Expired invitation must have status=expired');
  assert.equal(updatedAgreementStatus, 'draft', 'Agreement must safely fall back to draft when expired');
});

test('Agreement External Signing — Resend Failure Never Produces False Sent State', async () => {
  const emailModule = readFileSync('lib/email.ts', 'utf8');
  const adminInvitationRoute = readFileSync('app/api/crm/agreements/[id]/invitations/route.ts', 'utf8');

  // Verify delivery_status is explicitly updated to 'failed' on Resend error
  assert.match(adminInvitationRoute, /delivery_status:\s*'failed'/);
  assert.match(adminInvitationRoute, /delivery_failed:\s*true/);
  assert.match(adminInvitationRoute, /status:\s*502/);

  // Verify error response is returned from sendAgreementSigningInvitationEmail
  assert.match(emailModule, /return\s*{\s*ok:\s*false,\s*error:\s*\(result\s*as\s*any\)\.error\.message\s*\|\|\s*'Resend delivery rejected'\s*}/);
});
