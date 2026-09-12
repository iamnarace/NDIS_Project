# Governance G2 — Worker Readiness & Roster Safety

> Canonical autonomous execution specification. Implement directly. Do not create another plan.

## Status

`COMPLETE`

---

## 1. Objective

Create a governed worker lifecycle and enforce worker suitability at the actual roster/shift boundary.

Target:

`Worker applicant / staff record`
→ identity + work eligibility
→ screening + required credentials
→ training/acknowledgements
→ service competencies
→ participant-specific competency where applicable
→ `WORKER READY`
→ matched to participant/service
→ roster allowed only when both participant and worker gates pass.

G2 must complement G1, not replace it.

---

## 2. Reuse before adding

Inspect and reuse existing worker/staff, training, compliance, roster, shift, agreement/document and audit structures.

Do not create parallel worker identities or duplicate training systems if existing modules can be extended safely.

Preserve historical worker/shift/timesheet records.

---

## 3. Worker lifecycle/readiness model

Support controlled states equivalent to:

- `applicant`
- `onboarding`
- `pending_verification`
- `ready_restricted`
- `ready`
- `suspended`
- `inactive`
- `terminated`
- `legacy_review_required`

Do not mark legacy workers ready without evidence.

Worker readiness must be server-derived from authoritative credential/training/competency state.

No client checkbox may directly set `is_rosterable=true`.

---

## 4. NDIS Worker Screening — Opus policy

Canonical Opus policy:

> All direct support workers must hold a current NDIS Worker Screening Clearance before independent participant support.

Model at least:

- `Clearance`
- `Pending`
- `Interim Bar`
- `Exclusion`
- `Suspension`
- `No Valid Clearance`
- `Unknown / Needs Verification`

Store verification/evidence metadata as appropriate:

- screening identifier/reference
- status
- issue/verification date
- expiry date where applicable
- verified by trusted actor
- verified at
- source/evidence document
- notes

Do not fabricate screening numbers or statuses.

Critical rule:

Only a current verified `Clearance` may satisfy the Opus independent-support screening gate.

Pending/barred/excluded/suspended/unknown must fail closed.

---

## 5. Credential registry

Create/reuse a normalized worker credential/compliance model supporting requirements such as:

- identity verification
- right to work
- NDIS Worker Screening
- police check where Opus policy/role requires it
- WWCC only where child-related work is actually in scope; current launch scope is Adults 18+
- First Aid
- CPR
- driver licence
- vehicle registration/roadworthiness evidence where relevant
- vehicle/business-use/participant-transport insurance evidence where relevant
- Ahpra/NMBA registration for nursing roles
- qualification/certificate evidence where a role/service requires it
- employment/contract agreement
- worker orientation / Code of Conduct acknowledgement
- confidentiality/privacy acknowledgement
- WHS/incident/complaints/safeguarding training/acknowledgement
- infection-control/manual-handling/medication/mealtime training where role/service requires it

Support:

- requirement type
- required/conditional/not applicable
- credential number where appropriate
- issuer
- issue date
- expiry/review date
- verification status
- verified by/at
- evidence document
- expiry warnings
- suspension/revocation

No generic `compliant=true` field may override expired/missing mandatory evidence.

---

## 6. Role and service requirement matrix

Create one authoritative mapping:

`worker role/service → required credentials/training/competencies`

Use the Service Scope Registry worker requirements where already present.

Do not scatter requirement strings across roster components.

Examples:

### Ordinary community/social/daily support

- valid worker screening under Opus policy
- identity/right-to-work as applicable
- required orientation/Code/privacy/WHS/safeguarding acknowledgements
- First Aid/CPR according to approved Opus worker standard
- service-specific competency where needed

### Transport assignment

Require as applicable:

- valid driver licence
- suitable registered vehicle
- relevant insurance configured/verified
- transport-related worker requirement

Participant transport billing remains separate from employee mileage reimbursement.

### Nursing

A nursing worker cannot be treated as clinically ready merely because they are a staff member.

Require relevant Ahpra/NMBA registration and defer clinical-service activation/participant-specific approval to G6.

---

## 7. Competency matrix

Create/reuse a competency catalogue and worker competency records.

Support:

- competency code/name
- category
- service applicability
- evidence/assessment method
- assessor
- status
- achieved date
- expiry/review date
- notes/evidence

Distinguish:

### General competency

Reusable worker capability such as manual handling knowledge or medication-assistance training.

### Participant-specific competency

Competency/authorisation for a particular participant/support task.

Participant-specific competency must link:

`worker + participant + service/task + assessor + date + review/expiry + evidence`

Do not treat generic online training as sufficient participant-specific high-intensity competency.

G2 should build the model and roster evaluation hooks; G6 owns clinical/high-intensity activation rules.

---

## 8. Training integration

Reuse the existing Training Management / My Training system.

Do not create a second LMS.

Worker readiness may depend on assigned mandatory course/acknowledgement completion.

Examples:

- NDIS Code of Conduct acknowledgement
- Opus Worker Code/Conduct
- privacy/confidentiality
- complaints
- incident/safeguarding
- WHS
- infection control
- role-specific training

Expiry/retraining must revoke readiness where the training is designated critical.

---

## 9. Roster decision engine

Create one server-side worker eligibility function/service.

Inputs should include at minimum:

- participant readiness from G1
- requested service/service code
- worker status
- current worker screening
- mandatory credentials
- mandatory training
- required general competencies
- transport requirements
- participant-specific competency/approval where applicable
- service operational status
- clinical/registration boundary

Return deterministic result such as:

- `ELIGIBLE`
- `BLOCKED_PARTICIPANT_NOT_READY`
- `BLOCKED_WORKER_NOT_READY`
- `BLOCKED_SCREENING`
- `BLOCKED_CREDENTIAL`
- `BLOCKED_TRAINING`
- `BLOCKED_COMPETENCY`
- `BLOCKED_TRANSPORT`
- `BLOCKED_CLINICAL_APPROVAL`
- `BLOCKED_SERVICE_SCOPE`
- `MANAGEMENT_REVIEW_REQUIRED`

Include safe reasons for admin UI.

The actual shift creation/update endpoint(s) must re-evaluate eligibility server-side at write time.

Filtering a dropdown is not sufficient security/governance.

---

## 10. Hard blocks and revocation

New shift creation/assignment must fail if a critical worker requirement is missing/expired/barred.

If a critical credential later expires or worker screening becomes invalid:

- future/new shift assignment must block immediately;
- surface existing future scheduled shifts requiring review;
- do not silently delete historical/completed shifts;
- provide management review queue/status if current architecture allows.

Do not automatically cancel participant supports without a controlled operational workflow.

---

## 11. Admin UI

Extend existing Staff/Worker 360 rather than create disconnected pages.

Show:

- worker lifecycle/readiness badge
- screening status
- credentials with expiry
- training status
- competency matrix
- participant-specific competencies
- driver/vehicle readiness where relevant
- Ahpra registration where relevant
- explicit blockers
- assigned/future shift review warnings

Provide controlled admin verification actions with server-derived actor identity and audit events.

Worker portal may show the worker's own requirements/training/expiry status, but must not allow self-verification of mandatory credentials.

---

## 12. RLS/privacy

Least privilege:

- public/participants: no access to worker credential registry
- worker: own safe credential/training status only as required
- unrelated worker: no other-worker credential access
- admin/authorised management: workforce governance access
- service role: trusted server operations

Sensitive identifiers/documents must not be exposed unnecessarily.

Run direct Supabase tests.

---

## 13. Audit

Use existing audit architecture for:

- credential created/verified/expired/revoked
- worker screening status change
- training readiness change where governance-critical
- competency awarded/revoked/expired
- worker readiness change
- roster block/override attempt if useful

Do not accept client-supplied audit actor IDs.

---

## 14. Migration/data compatibility

Before live migration:

- inventory worker/staff records and future shifts;
- backfill uncertain legacy worker readiness to `legacy_review_required`/equivalent rather than `ready`;
- preserve historical shifts/timesheets/payroll/service records;
- do not invent credential status.

Apply only safe additive/backwards-compatible migrations autonomously.

---

## 15. Required tests

At minimum verify:

- worker with valid required evidence can pass ordinary-service eligibility
- missing NDIS Worker Screening blocks independent support
- Pending/Interim Bar/Exclusion/Suspension/Unknown block
- expired critical credential blocks
- expired critical training blocks where designated
- missing required competency blocks
- ordinary service does not require irrelevant nursing credentials
- transport assignment requires driver/vehicle controls when applicable
- nursing service remains blocked pending G6 clinical activation even when Ahpra exists
- participant not ready from G1 blocks
- service not operational blocks
- UI cannot bypass server eligibility
- direct API/RPC cannot bypass roster gate
- worker cannot self-verify credential
- unrelated worker cannot read another worker's sensitive compliance data
- admin can verify
- revocation impacts future eligibility without deleting history
- actor identity is server-derived
- audit event created

Run full repository quality gate.

---

## 16. G2 exit criteria

G2 passes only when:

- worker readiness is authoritative/server-derived;
- Opus worker-screening policy is enforced at shift boundary;
- credential/training/competency requirements are centralized;
- participant + service + worker eligibility is evaluated together;
- critical expired/missing requirements fail closed;
- worker/participant-specific competency model exists;
- transport worker controls exist;
- Ahpra model exists without falsely activating clinical services;
- RLS least privilege passes;
- legacy records preserved safely;
- tests/typecheck/lint/build pass;
- independent bypass review passes;
- verified implementation is committed/pushed;
- Vercel Production remains unchanged.

When this gate passes in autonomous mode, mark G2 `COMPLETE` and immediately start G3. Do not ask the owner for review.
 
---

## 17. Closure Evidence & Verification Record

- **Status**: COMPLETE
- **Playwright Acceptance**: `npm run test:e2e:g2` — PASS (1 Playwright test passed)
- **Unit & Service Tests**: `npm test` — PASS (39/39 passing)
- **Typecheck**: `npm run typecheck` — PASS (0 errors)
- **Lint**: `npm run lint` — PASS (0 warnings / 0 errors)
- **Production Build**: `npm run build` — PASS (73/73 static/dynamic routes generated)
- **Git diff check**: `git diff --check` — PASS
- **Credential Scan**: PASS (ephemeral admin key absent from `.next/static`)
- **Database Boundary**:
  - Live G2 markers and migrations verified:
    - `20260912170000_governance_g2_worker_readiness.sql`
    - `20260912180000_governance_g2_atomic_assignment.sql`
    - `20260912190000_governance_g2_roster_write_guard.sql`
    - markers: `20260912085010_governance_g2_worker_readiness_live_marker.sql`, `20260912085748_governance_g2_atomic_assignment_live_marker.sql`, `20260912085939_governance_g2_roster_write_guard_live_marker.sql`
  - Atomic assignment and roster write guards enforced at DB and RPC boundaries.
  - Server-derived actor identity and RLS least-privilege compliance.
- **Untracked artifact check**: `supabase/.temp/` added to `.gitignore` and excluded from repository.
