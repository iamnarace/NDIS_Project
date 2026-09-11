# Governance G3 — Privacy, Participant Documents & Help Centre

> Canonical autonomous execution specification. Implement directly after G2 passes.

## Status

`READY AFTER G2 PASSES`

## Objective

Make participant/legal/privacy documentation operational, version-controlled, auditable, least-privilege, and visible through the CRM/participant experience without inventing legal facts.

## Required implementation

### 1. Privacy and consent controls

Create/reuse controlled records for:

- Privacy Collection Notice acknowledgement
- participant/authorised representative service consent
- Information Sharing Authority with named purpose/recipients, scope, start/review/revocation
- optional marketing consent kept separate
- nominee/representative authority where relevant
- consent withdrawal/revocation history

No consent is pre-ticked. Consent actor/recipient identity must be factual and auditable.

### 2. Participant document pack

Create/version controlled document/template support for at least:

- Service Agreement
- Schedule of Supports
- Pricing/Travel/Cancellation terms
- Privacy Collection Notice
- Participant Rights & Responsibilities
- Complaints & Feedback information
- Incident/Safeguarding information
- Participant Handbook
- Emergency/Urgent Support information
- Exit/Transition information
- Information Sharing Authority

Do not fabricate proprietor legal name, address, bank details, insurance or registration status. Formal execution remains fail-closed when required organisation identity is incomplete.

### 3. Controlled document versions

Each controlled policy/resource/template should support equivalent metadata:

- document code
- title
- version
- effective date
- review date
- status: draft/current/superseded/archived
- owner/approver
- source/template link
- acknowledgement required or not
- change summary

Do not silently overwrite historical executed/acknowledged versions.

### 4. Agreement alignment

Verify existing Service Agreement generator and stored agreements against current Opus identity/funding/service-scope rules.

Requirements:

- no Pty Ltd fabrication
- correct ABN
- GST not registered behaviour
- no blanket GST-free legal statement
- genuine billing party only
- only operational/allowed services may be scheduled
- final executed documents preserve version/rate history
- pending legal counterparty details block execute/sign/send but not admin preview.

### 5. Help Centre

Expose the existing Operations Guide through an accessible admin/staff Help Centre UI.

Organise by operational workflows, not button descriptions. Include prerequisites, required data, downstream effect, record location, escalation, and common blockers.

At minimum cover:

- referral/suitability/onboarding
- worker onboarding/readiness
- service agreements
- roster/shifts
- progress notes/timesheets
- incidents/complaints
- documents/privacy
- invoicing
- service scope/funding boundaries

Use current Opus terminology only.

### 6. Participant portal safe resources

Where participant portal exists, expose only participant-safe/current resources. Do not expose internal notes, waivers, worker compliance data, internal service metadata, or draft policies.

### 7. Access control

Use least privilege for sensitive documents/consents.

- public: only explicitly published resources
- participant: own documents/consents/current public resources
- worker: minimum assigned operational documents needed for service
- admin/owner: document governance
- service role: server-only trusted access

Direct Supabase tests required.

### 8. Audit

Use existing audit events for:

- consent given/revoked
- information-sharing authority changes
- controlled document publication/supersession
- participant acknowledgement
- agreement execution/version linkage

Actor identity server-derived.

### 9. Tests

Verify at minimum:

- no pre-ticked consent
- marketing consent separate
- information-sharing authority can be limited/revoked
- superseded document remains historically traceable
- participant sees own safe current documents only
- worker cannot access unrelated participant documents
- public cannot access private documents
- agreement execution guard remains effective
- current service agreement contains no false Pty Ltd/GST/NDIS registration claims
- Help Centre renders and navigates current guide
- old CarePoint wording is not shown in current operational UI/docs
- version persistence survives reload

Run full test/typecheck/lint/build/security gate.

## G3 exit criteria

- privacy/consent records are controlled and auditable;
- participant document pack exists in versioned form;
- agreement/document identity rules are correct;
- historical executed versions are preserved;
- Help Centre is usable;
- participant/public/worker/admin access is least privilege;
- audit and revocation paths pass;
- no fabricated legal/business facts;
- all quality gates pass;
- committed/pushed;
- Vercel Production unchanged.

When complete, automatically start G4.