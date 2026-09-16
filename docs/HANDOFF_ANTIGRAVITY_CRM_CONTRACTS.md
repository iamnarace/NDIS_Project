# Opus Care Support Services — Antigravity Handoff: CRM Workspaces & Employment Contract Workflows

**Date:** 16 September 2026  
**Repository:** `iamnarace/NDIS_Project`  
**Active Working Branch:** `careers/recruitment-review`  
**Base Commit:** `8e08d26` (Center portal login layout)  
**Status:** Clean test suite (246/246 passing), typecheck passing (0 errors), 6 uncommitted files ready for staging/commit.  
**Target Document Path:** `docs/HANDOFF_ANTIGRAVITY_CRM_CONTRACTS.md`

---

## 1. Executive Summary & Context

This handoff captures the state of the Opus Care application following work on:
1. **Portal Login & Admin Access Key**:
   - The portal login layout has been centered (`app/globals.css`, committed in `8e08d26`).
   - A fresh admin access key was generated and stored securely on the local machine at `C:/Users/NareshAdmin/.opus-care/admin-access-key.txt` and `.env.local`. **It must never be committed to Git or exposed in chat logs.**
   - The Vercel Preview deployment was updated and verified.

2. **CRM Form Usability & Full-Page Workspace**:
   - The user noted that CRM forms felt cramped / drawer-bound, and requested full-page workspaces for records and agreements.
   - The user also requested a clear, authentic workflow for generating **employee contracts** (full document layout, clauses, terms, and external send-and-sign capability with PDF output).

3. **Current Code Assessment (Antigravity's previous implementation vs. requirements)**:
   - **What was built:** Agreement Generator wizard (`AgreementGeneratorModal.tsx`), Agreement Viewer (`AgreementViewerModal.tsx`), immutability enforcement, versions/variations, internal canvas signature persistence, print-to-PDF styles, and template metadata.
   - **What was identified as missing:**
     - The contract viewer previously only rendered short summary metadata, rather than full approved clause text.
     - Direct button in Worker/Staff CRM view to launch contract creation with preselected worker context.
     - Bug in `AgreementGeneratorModal.tsx` where internal signature requests submitted `signer_type` instead of the API-expected `party_role`.
     - External secure signing link workflow: recipient token page, email notification endpoint, audit trail, viewed/opened tracking, and final executed locked PDF storage.

---

## 2. Current Working Directory Changes (Uncommitted)

The following 6 files have been modified locally and fully tested:

### 1. `components/admin/forms/FormDrawer.tsx`
- Added optional `fullPage?: boolean` prop.
- Applies the `.drawer-container-full-page` CSS class when `fullPage` is true, transforming cramped sliding drawers into expansive desktop-centered modal workspaces.

### 2. `app/opus.css`
- Added styles for `.drawer-overlay:has(.drawer-container-full-page)` and `.drawer-container-full-page` (centered 1280px container, 100dvh viewport-fitted with 20px padding).
- Added full-page record layouts: `.ocRecordOverlay`, `.ocRecordDrawer`, `.ocRecordTabs`, `.ocRecordActionBar`.
- Added high-fidelity A4 document presentation styles: `.agreementDocumentPage`, `.agreementDocumentHeader`, `.agreementDocumentReference`, `.agreementParticularsGrid`, `.agreementClauseSection`, and `.agreementMissingClauses`.
- Added clean `@media print` rules isolating `.agreementDocumentPage` to produce clean, professional printed/saved PDFs without CRM UI chrome.
- Added responsive overrides for mobile viewports.

### 3. `components/admin/AgreementViewerModal.tsx`
- Upgraded `FormDrawer` invocation to use `fullPage`.
- Added recursive clause renderer `renderClauseContent()` to walk template schemas and output structured headings, paragraphs, and unordered lists.
- Rendered full formal document view: Parties and commencement, Employment particulars (classification, basis, hourly rate, hours, superannuation %, source basis), and Approved terms & conditions from `template.clause_schema`.
- Added fallback warning if template clauses have not yet been approved.

### 4. `components/admin/AgreementGeneratorModal.tsx`
- Upgraded `FormDrawer` invocation to use `fullPage`.
- Added `initialOwnerId?: string` prop and `useEffect` to preselect a worker or participant when launching directly from a record action button.
- **Fixed signing request bug**: changed payload fields from `signer_type` to `party_role: ownerType === 'staff' ? 'worker' : ownerType` and `party_role: 'provider_rep'`, satisfying the signing API contract.

### 5. `app/admin/page.tsx`
- Added `agreementInitialOwnerId` state.
- In Worker CRM detail panel, added an **Employment documents** action bar (`.ocRecordActionBar`) with a **"Create Employment Contract"** button.
- Configured button to launch `AgreementGeneratorModal` with `initialTemplateCode="DOC-WRK-01"` and `initialOwnerId=selectedStaff.id`.

### 6. `tests/governance-g3-privacy-documents.test.mjs`
- Added automated governance assertions verifying:
  - `party_role` is sent instead of `signer_type` in `AgreementGeneratorModal`.
  - Full-page drawer usage (`fullPage` prop) in both agreement generator and viewer.
  - `template.clause_schema` rendering in `AgreementViewerModal`.
  - `.drawer-container-full-page` class presence in `FormDrawer`.

---

## 3. Verification & Test Evidence

All checks have been run against the working tree:
- **TypeScript Compilation:** `npm run typecheck` (`tsc --noEmit`) -> **0 errors**.
- **Node Test Suite:** `npm test` (`tests/**/*.test.mjs`) -> **246/246 tests passing across 11 test suites**.
- **Targeted Governance Suite:** `node --loader ./tests/loader.mjs --test tests/governance-g3-privacy-documents.test.mjs` -> **16/16 tests passing**.

---

## 4. Architectural Roadmap for External Send-and-Sign

To deliver the complete "send contract to someone who can sign and send it back" capability requested by the user, the following components must be built in subsequent steps:

### Phase A: Secure Signing Token & Recipient Link Architecture
1. **Database Additions (Additive Supabase Migration)**:
   - Add signing invitation table (e.g. `agreement_signing_invitations`):
     - `id`: UUID (primary key)
     - `agreement_id`: UUID (references `agreements.id`)
     - `party_role`: `'worker'` | `'participant'` | `'provider_rep'`
     - `recipient_email`: text
     - `recipient_name`: text
     - `secure_token`: text (cryptographically random hex or UUID)
     - `status`: `'pending'` | `'viewed'` | `'signed'` | `'expired'` | `'revoked'`
     - `expires_at`: timestamptz (e.g., 7 or 14 days)
     - `viewed_at`: timestamptz (nullable)
     - `signed_at`: timestamptz (nullable)
     - `ip_address`: text (for audit trail)
     - `user_agent`: text (for audit trail)

2. **Recipient Signing Route (Public / Auth-Bypassed via Token)**:
   - Public route: `/contracts/sign/[token]` or `/portal/sign/[token]`.
   - Security:
     - Validates token exists, is not expired, and agreement is in a signable state (`status = 'published'` or `'awaiting_signature'`).
     - Logs `viewed_at`, IP, and user agent upon first load.
     - Displays full legal document read-only preview.
     - Displays signature canvas or typed signature with legal declaration: *"I, [Name], agree that my electronic signature constitutes a legally binding agreement under the Electronic Transactions Act 1999 (Cth)."*
   - Submission:
     - Calls an authenticated API endpoint that accepts the token, signature data URL, and legal acceptance.
     - Updates `agreement_signatures` and sets invitation status to `'signed'`.
     - When all required parties have signed, automatically updates agreement status to `'executed'`.

### Phase B: Email Dispatch & Notifications
1. **Send Contract Action in Agreement Workspace**:
   - Add a "Send for External Signature" button in `AgreementViewerModal.tsx`.
   - Admin verifies recipient email and clicks Send.
   - Endpoint `/api/agreements/[id]/send-invitation` creates token and triggers email via Resend (`resend.emails.send()`).
   - Email includes provider branding (Opus Care Support Services), document title, expiration notice, and direct link `https://<domain>/contracts/sign/<token>`.

### Phase C: Executed Document Archiving & Storage
1. **Executed PDF Storage**:
   - Once all signatures are collected, freeze and lock the document.
   - Generate final tamper-evident PDF representation or store signature audit certificate.
   - Link stored PDF in Supabase Storage (`agreements` bucket).

### Phase D: Employment Contract Content & Template Integrity
1. **Approved Clause Texts (`DOC-WRK-01`)**:
   - The document generator references template `DOC-WRK-01` (Worker Employment Contract).
   - Ensure the template in the database contains comprehensive, legally vetted clauses (e.g. Fair Work National Employment Standards, SCHADS Award classification, superannuation, probationary period, confidentiality, and work health & safety).
   - Maintain the governance rule: **never silently invent binding legal clauses without review.**

---

## 5. Next Recommended Steps for Antigravity

1. **Commit and Push Current Changes**:
   ```bash
   git add app/admin/page.tsx app/opus.css components/admin/AgreementGeneratorModal.tsx components/admin/AgreementViewerModal.tsx components/admin/forms/FormDrawer.tsx tests/governance-g3-privacy-documents.test.mjs docs/HANDOFF_ANTIGRAVITY_CRM_CONTRACTS.md
   git commit -m "feat(contracts): add full-page agreement workspace, clause renderer, and worker contract entry"
   git push origin careers/recruitment-review
   ```
2. **Review with User**:
   - Present the improved full-page CRM record view and agreement workspace layout.
   - Demonstrate the worker "Create Employment Contract" action button.
   - Discuss whether to proceed immediately with the Phase A & B external tokenized signing link implementation.
