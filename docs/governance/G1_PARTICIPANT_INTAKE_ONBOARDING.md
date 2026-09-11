# Governance G1 — Participant Intake & Onboarding Governance

> **Canonical phase execution specification**
>
> This is **not a proposal**. G0/G0.1/G0.2 security closure is complete. Antigravity must implement this phase directly under `docs/EXECUTION_PROTOCOL.md` and return an Implementation Report rather than another implementation plan.

## Current execution status

`READY TO EXECUTE`

Do not create another G1 implementation plan. Perform preflight, execute this specification, verify, commit, update roadmap/status, report, and stop at the phase boundary.

---

## 1. Objective

Replace unsafe referral-to-active conversion with a governed participant lifecycle:

`Referral`
→ `Service Suitability Assessment`
→ decision
→ `Participant Onboarding`
→ readiness review
→ `ACTIVE / PARTICIPANT-SIDE ROSTER ELIGIBLE`

No referral may silently become active/rosterable.

G1 governs **participant readiness**. Governance G2 later adds worker-readiness/credential/competency hard gates. G1 must not pretend worker competency governance is already complete.

---

## 2. Business and governance boundaries

Preserve all owner-authorised facts in `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`.

### Adults 18+ launch scope

Current participant launch scope is `Adults 18+`.

A referral for a participant under 18 must not silently progress. Record a management/outside-current-scope outcome. Do not implement child-service governance in G1.

### Funding

Current direct participant scope:

- Self-Managed
- Plan-Managed

NDIA-Managed funding may be recorded truthfully, but Opus Care must not be represented as directly claiming from the NDIA while unregistered.

Do **not** create a loose `ndia_billing_configured=true` boolean that by itself authorises billing/delivery.

A genuine NDIA-managed pathway must rely on actual recorded contracting/billing-party data already linked in CRM records. If absent:

`Billing Configuration Required`

Never fabricate a nominee, payer, registered provider or subcontracting relationship.

### Service scope

Every requested service must be validated against the authoritative live `service_scope_registry`.

If governance data cannot be read, fail closed.

### Conditional clinical services

Requesting Community Nursing, Complex Bowel Care or Urinary Catheter Management must produce `Clinical Review Required` and must not activate quote/roster/invoice capability.

### Registration-required services

A current `REGISTRATION_REQUIRED` service must not progress as a normal Opus service. Use `Registered Provider Requirement` or an equivalent governed outcome.

### Restrictive practices

Any indication of regulated restrictive practices must stop automatic progression and produce:

`Management / Regulatory Review Required`

Do not create or authorise a restrictive-practice workflow in G1.

### Consent

No pre-ticked consent. Optional marketing consent remains separate from service/privacy consent.

---

## 3. Reuse existing architecture

Before adding schema, inspect and reuse:

- `referrals`
- `participants`
- `contacts`
- `participant_contacts`
- `provider_config`
- `service_scope_registry`
- `participant_support_plans`
- `risk_assessments`
- `agreement_records`
- `agreement_signatures`
- `documents`
- `audit_events`
- existing consent/document structures
- `lib/regions.ts`
- existing referral/admin/agreement components and APIs

### No duplicate audit table

Use/extend existing `audit_events` for assessment, conversion, checklist, waiver, readiness and lifecycle events.

Do not create `intake_audit_log` unless repository evidence proves the existing audit system cannot safely support G1 and the final report explains why.

### No duplicate payer identity

Prefer existing contact/payer relationships over uncontrolled free-form payer JSON. A point-in-time assessment snapshot is acceptable for audit, but must not become a second source of truth for payer identity.

---

## 4. Database migration

Create the next safe migration matching repository history, conceptually:

`20260912xxxxxx_governance_phase_g1_intake_onboarding.sql`

Migration must be additive/backwards-compatible unless an explicitly reviewed correction is unavoidable.

Do not delete existing participant/referral/shift history.

### A. `service_suitability_assessments`

Create a formal assessment record supporting:

- UUID primary key
- unique `SSA-xxxxx` reference
- referral link and/or participant link
- assessor identity using current authenticated profile/admin model
- funding type
- linked payer/contracting identity where available
- billing relationship status
- region/suburb/postcode
- requested canonical service codes
- point-in-time service-scope validation snapshot
- risk-triage snapshot
- adult age-scope result
- deterministic outcome
- outcome reasons
- conditions
- assessor notes
- timestamps

Required outcomes:

- `Suitable`
- `Suitable With Conditions`
- `Clinical Review Required`
- `Further Information Required`
- `Registered Provider Requirement`
- `Capacity Waitlist`
- `Management / Regulatory Review Required`
- `Declined / Outside Scope`

Do not let one stored boolean bypass live governance/billing validation.

### B. Participant lifecycle fields

Extend `participants` only after reconciling existing status fields.

Required concepts:

- lifecycle stage
- participant-side roster eligibility (`is_rosterable` or equivalent)
- suitability assessment link
- readiness notes

Lifecycle should cover concepts equivalent to:

- intake assessment
- onboarding
- ready for roster
- active/rosterable
- waitlist
- on hold
- exited
- declined
- legacy review required where needed for safe existing-record migration

Prefer calculating readiness percentage from checklist state. If cached, compute it server-side; never trust client-supplied percentage/readiness flags.

### Existing participant migration safety

Before applying live migration:

- inventory existing participants, statuses and linked shifts;
- preserve historical roster/service records;
- do not silently declare existing records compliant;
- use a documented compatibility/backfill state such as `legacy_review_required` where appropriate;
- report exact rows/statuses affected.

### C. `participant_onboarding_checklists`

Create one current checklist per participant, with history in `audit_events`.

Each requirement must support concepts equivalent to:

- `required`
- `waivable`
- `status: pending | completed | waived | not_applicable`
- completed timestamp/user
- waived timestamp/user/reason
- notes
- linked document/evidence where applicable

Checklist record must support participant readiness sign-off and timestamps.

### Non-waivable requirements

Do not make everything admin-waivable. When applicable, critical requirements such as participant/authorised-representative consent, suitable funding/payer basis, suitability approval, executed service agreement before commencement, and critical safety/risk information must not be bypassed through a generic waiver.

---

## 5. Dynamic onboarding requirements

Generate checklist applicability from the actual assessment and selected services.

### Identity / funding

Support as applicable:

- identity verification
- NDIS number verification
- adult age-scope confirmation
- funding method
- payer/contracting relationship
- nominee/representative authority
- emergency contact
- communication/accessibility needs

### Privacy / consent

- Privacy Collection Notice acknowledgement
- participant/authorised representative consent
- Information Sharing Authority only when external sharing authority is actually needed

Do not make information-sharing authority universally mandatory.

### Service/legal

- suitability approval
- approved services
- service agreement
- schedule of supports
- pricing/travel/cancellation acceptance where applicable

### Care/risk

- goals where relevant
- risk assessment
- support plan where required
- Home/Community WHS status where applicable to service environment
- clinical plan/review only when clinical/high-intensity needs require it
- management/regulatory review resolution where applicable

### First-service readiness

G1 may record participant-side service readiness and required worker profile/requirements.

Actual worker competency matching belongs to G2. Do not make G1 completion dependent on a worker competency engine that does not yet exist.

---

## 6. Risk triage

Capture only information necessary to determine service scope/safety pathway, for example:

- mobility/transfers
- manual handling
- medication support
- relevant allergies
- dysphagia/mealtime concerns
- seizures
- continence support
- catheter care
- bowel care
- other clinical tasks
- behaviours of concern
- behaviour support plan exists
- restrictive practices indicated
- transport required
- communication/accessibility requirements

Do not diagnose and do not author clinical plans.

Do not collect excessive detailed clinical information on the initial public referral form.

---

## 7. Core server engine

Centralise G1 decisions in a server-side module such as `lib/services/participantIntake.ts` or the closest existing architecture.

### `validateSuitability(input)`

Must:

1. verify authorised caller;
2. query live authoritative service scope;
3. fail closed on governance lookup failure;
4. enforce adult launch scope;
5. evaluate canonical service-region helpers rather than duplicate suburb lists;
6. validate funding/billing relationship;
7. validate every requested service;
8. escalate conditional clinical services;
9. escalate registration-required services;
10. escalate restrictive-practice indicators;
11. use real capacity evidence only — never invent worker availability;
12. return deterministic outcome + reasons + conditions.

### `computeOnboardingRequirements(assessment)`

Generate dynamic requirements from funding pathway, selected services, risk class, risk indicators, service environment and review requirements.

Ordinary participants must not be forced through irrelevant clinical requirements.

### `checkParticipantReadiness(participantId)`

Must load canonical checklist state server-side, validate required items and permitted waivers, fail closed on missing governance data, set participant-side roster eligibility only server-side, and emit audit events for transitions/sign-off.

Client-provided `is_rosterable=true` or readiness percentage must never be trusted.

---

## 8. API work

Use current authentication/authorisation conventions and keep service-role credentials server-only.

### Suitability API

Implement equivalent routes under `app/api/crm/suitability/...` for authorised create/read/update/reassessment operations.

Assessment approval/decline must be limited to actual management/admin/intake roles according to the current role model. Ordinary support workers must not gain governance approval rights accidentally.

### Onboarding API

Implement equivalent routes under `app/api/crm/onboarding/...` for:

- get current checklist
- update validated checklist state
- attach/link evidence
- waive only waivable items with authorised actor + required reason
- final participant-readiness sign-off

### `/api/crm/convert`

Decommission direct active conversion.

Conversion requires an acceptable completed suitability assessment and creates/preserves the participant in onboarding/non-rosterable state. Initialize the dynamic checklist.

### Roster participant guard

Audit **all** shift creation/assignment routes and UI pathways, not one guessed endpoint.

New service shifts must reject participants who have not passed participant readiness.

Canonical error:

`Participant onboarding is incomplete. Complete required intake and readiness review before rostering shifts.`

Do not break read-only visibility of historical shifts.

G2 later adds worker-side safety gates.

---

## 9. RLS/access control

Preserve G0.1 security architecture.

- anon/public: zero direct suitability/onboarding table access
- participant: own safe summary only where required; no governance mutation/waiver/signoff
- ordinary worker/support staff: minimum operational read access only if required; no approval/decline/signoff/waiver unless actual role model explicitly grants it
- admin/owner/authorised management: governed management access
- service role: trusted server operations only

Test direct Supabase access, not only API responses.

---

## 10. Admin UI

Preserve current design system and working CRM logic.

### Suitability Assessment UI

Provide a multi-step flow from Referral and, where appropriate, Participant detail:

1. age + funding/billing
2. location/serviceability
3. requested services/live scope
4. complexity/risk triage
5. deterministic outcome/reasons/conditions

Do not allow the UI to casually override registration, clinical or restrictive-practice boundaries.

### Participant Onboarding UI

Show lifecycle, grouped dynamic checklist, applicability, progress, blockers, evidence, permitted waivers, audit context and final readiness action.

Final readiness must call server-side validation rather than toggle local state.

### Referral pipeline

Replace unsafe direct `Convert`/`Enrol Active` actions with state-aware actions such as:

- Assess Suitability
- Continue Assessment
- Start Onboarding
- Continue Onboarding

### Participant views

Display lifecycle such as Intake, Onboarding, Ready for Roster, Active/Rosterable, Waitlist, On Hold, Declined and Legacy Review Required where used.

### Workforce roster UI

Do not offer non-ready participants for new shifts. Provide an explanatory status where operationally useful; keep historical records visible.

---

## 11. Serviceability/capacity

Use canonical `lib/regions.ts`/region configuration. Do not create another Northern NSW/Sydney list.

Distinguish supported region, outside current region and manual location review.

Do not automatically use `Capacity Waitlist` unless real capacity data proves it. Otherwise prefer further-information/manual review.

---

## 12. Audit events

Use existing `audit_events` for:

- assessment creation/change
- suitability outcome
- conversion to onboarding
- checklist completion/change
- waiver + reason
- readiness approval
- roster-eligibility change
- decline/waitlist/on-hold transitions

Capture actor, entity, event type, before/after state where useful, timestamp and reason. Avoid dumping unnecessary health detail into generic audit payloads.

---

## 13. Compatibility strategy

Before live migration:

1. inspect current participants/referrals/shifts;
2. identify existing active/historical data;
3. define non-destructive backfill;
4. preserve history and read access;
5. do not declare legacy records compliant without evidence;
6. report exact affected rows/statuses.

A destructive migration or irreversible rewrite is a blocker under `docs/EXECUTION_PROTOCOL.md`.

---

## 14. Automated verification

Create/update a dedicated suite such as `tests/governance-g1-onboarding.test.mjs` covering at minimum:

- valid Self-Managed ordinary support pathway
- valid Plan-Managed ordinary support pathway
- NDIA-Managed without genuine contracting/billing relationship blocked
- client boolean cannot fabricate NDIA authority
- ACTIVE service accepted for assessment
- ACTIVE_WITH_CONTROLS produces controls
- REGISTRATION_REQUIRED service escalates/blocks
- CONDITIONAL_CLINICAL service escalates and remains operationally unavailable
- governance lookup failure fails closed
- under-18 does not auto-progress
- restrictive-practice indicator requires management/regulatory review
- ordinary Community Access participant does not require clinical plan
- clinical/high-intensity participant receives appropriate conditional requirement
- Information Sharing Authority conditionality
- non-waivable item cannot be waived
- waivable item requires authorised actor + reason
- conversion without suitable assessment fails
- accepted conversion creates onboarding/non-rosterable participant
- no direct referral-to-active path remains
- incomplete checklist cannot become roster eligible
- client cannot force readiness/rosterability
- non-ready participant cannot be newly rostered
- historical shifts remain readable
- anon/participant/worker/admin RLS boundaries
- audit events emitted for critical transitions

---

## 15. Quality gates

Run and pass:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- migration/schema verification
- direct RLS tests
- negative-path API tests
- rendered/browser referral → suitability → onboarding → readiness test
- reload/persistence verification
- responsive check for changed admin UI
- git diff review
- secret/dummy-data scan

Report live Supabase changes separately from Git/Vercel state.

Do not deploy Vercel Production unless separately authorised.

---

## 16. Exit criteria

G1 is complete only when:

- referral cannot silently become active/rosterable;
- suitability decisions are persisted/auditable;
- Adults 18+ launch scope is enforced;
- requested services use live service scope;
- NDIA-managed relationships cannot be fabricated;
- registration-required/clinical/restrictive-practice pathways escalate correctly;
- onboarding requirements are dynamic;
- non-waivable critical requirements cannot be bypassed;
- consent/privacy requirements are correctly represented;
- participant-side roster eligibility is server-derived;
- new shifts block non-ready participants;
- historical data remains intact;
- RLS and audit tests pass;
- tests/typecheck/lint/build pass;
- verified work is committed locally;
- this phase doc + roadmap are updated with actual results;
- no Vercel Production deploy occurs unless separately authorised.

---

## 17. Required completion response — IMPLEMENT, DO NOT RE-PLAN

Do not return another implementation plan.

Execute this phase and then return:

# Governance G1 Implementation Report

## Starting repository/database state
## Migration and compatibility/backfill
## Service Suitability Assessment
## Funding/billing safeguards
## Age/service-region controls
## Dynamic Participant Onboarding
## Consent/privacy controls
## Participant lifecycle/readiness
## Roster participant gate
## RLS access matrix
## Audit events
## UI implementation
## Automated tests
## Browser/persistence validation
## Live Supabase status
## Git status / commit SHA
## Vercel status
## Remaining G2 dependencies

Then STOP.

Do not produce a G2 implementation plan unless explicitly requested. G2 belongs in the canonical roadmap and will receive its own execution specification before execution.