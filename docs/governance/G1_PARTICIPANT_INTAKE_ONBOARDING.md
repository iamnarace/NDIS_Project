# Governance G1 — Participant Intake & Onboarding Governance

> **Canonical phase execution specification**
>
> This is not a proposal. Once the preceding security gate is marked complete and this phase is marked `READY TO EXECUTE`, Antigravity must implement it directly under `docs/EXECUTION_PROTOCOL.md` and return an Implementation Report rather than another plan.

## Current execution status

`BLOCKED — COMPLETE FINAL G0/G0.1/G0.2 DIRECT-ACCESS SECURITY CLOSURE FIRST`

After that evidence is accepted, change this to:

`READY TO EXECUTE`

Do not start implementation while the security gate remains blocked.

---

## 1. Objective

Replace unsafe referral-to-active conversion with a governed participant lifecycle:

`Referral`
→ `Service Suitability Assessment`
→ decision
→ `Participant Onboarding`
→ readiness review
→ `ACTIVE / PARTICIPANT-SIDE ROSTER ELIGIBLE`

No referral may silently become an active/rosterable participant.

G1 governs **participant readiness**. G2 later adds worker-readiness/competency hard gates. G1 must not pretend worker competency governance is already complete.

---

## 2. Non-negotiable business and governance rules

Preserve current authorised facts from `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`.

### Launch participant age scope

Current launch scope is:

`Adults 18+`

If a referral is for a participant under 18:

- do not silently accept;
- outcome should require management review / outside current launch scope;
- do not fabricate child-service readiness;
- do not implement child-service governance in G1.

### Funding

Current direct service scope:

- Self-Managed
- Plan-Managed

NDIA-Managed funding may be recorded as a real participant funding type, but Opus Care must not be represented as directly claiming from the NDIA while unregistered.

Do not create a loose boolean such as `ndia_billing_configured = true` that alone authorises delivery/billing.

A genuine NDIA-managed relationship must be supported by actual recorded contracting/billing-party data already present or linked in CRM records.

If genuine payer/contracting data is absent:

`Billing Configuration Required`

No invented nominee, payer, registered provider or subcontracting arrangement.

### Service scope

All requested services must be validated against the authoritative live `service_scope_registry`.

Operational decisions fail closed if governance data cannot be read.

### Conditional clinical services

Requesting:

- Community Nursing
- Complex Bowel Care
- Urinary Catheter Management

must produce a clinical-review pathway, not automatic acceptance or delivery.

These services remain unquotable/unrosterable/uninvoiceable until G6 activation prerequisites are satisfied.

### Registration-required services

Requesting a service currently marked `REGISTRATION_REQUIRED` must not proceed as an ordinary Opus service.

Return/record:

`Registered Provider Requirement`

or other appropriate governed outcome.

### Restrictive practices

Any indication of regulated restrictive practices must:

- stop automatic progression;
- flag `Management / Regulatory Review Required`;
- preserve factual source information;
- not create or authorise a restrictive-practice workflow.

### Consent

Do not pre-tick consent.

Do not bundle optional marketing consent with service/privacy consent.

---

## 3. Reuse existing architecture before adding schema

Before migration, inspect and reuse:

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
- existing consent/document structures
- existing `audit_events`
- existing region/serviceability helpers in `lib/regions.ts`
- existing agreement/referral/admin components

### Do NOT create a duplicate intake audit table

The project already has `audit_events`.

G1 must use/extend the existing audit mechanism for:

- assessment created/updated
- suitability outcome
- conversion to participant onboarding
- checklist item changes
- waivers
- readiness sign-off
- lifecycle changes

Do not create `intake_audit_log` unless repository evidence proves `audit_events` cannot safely support the required traceability and the final report documents why.

### Do NOT duplicate payer/contact identity in free-form JSON if a real contact relationship can be linked

Prefer existing `contacts` / `participant_contacts` / payer fields for actual people/organisations.

Assessment snapshots may store factual point-in-time metadata, but they must not become a second uncontrolled source of truth for payer identity.

---

## 4. Database migration

Target migration name:

`20260912xxxxxx_governance_phase_g1_intake_onboarding.sql`

Use the next safe timestamp according to repository migration history.

Migration must be additive/backwards-compatible unless a separately reviewed correction is required.

Do not delete existing participant/referral records.

### A. `public.service_suitability_assessments`

Create a formal assessment table with fields equivalent to:

- `id UUID PRIMARY KEY`
- `reference_number TEXT UNIQUE NOT NULL` such as `SSA-00001`
- `referral_id UUID NULL REFERENCES referrals(id)`
- `participant_id UUID NULL REFERENCES participants(id)`
- `assessed_by UUID NULL` linked to the existing authenticated profile/admin identity model
- `funding_type TEXT`
- linked payer/contracting identifiers where available
- point-in-time payer/contracting snapshot only where useful for audit
- `billing_relationship_status TEXT`
- `region TEXT`
- `suburb TEXT`
- `postcode TEXT`
- `requested_services JSONB/TEXT[]` containing canonical service codes
- `service_scope_validation JSONB` point-in-time result
- `risk_triage JSONB`
- `age_scope_result TEXT`
- `outcome TEXT`
- `outcome_reasons TEXT[]/JSONB`
- `conditions TEXT`
- `assessor_notes TEXT`
- `created_at`
- `updated_at`

Do not let a single stored boolean bypass live billing/governance validation.

### Required outcome values

- `Suitable`
- `Suitable With Conditions`
- `Clinical Review Required`
- `Further Information Required`
- `Registered Provider Requirement`
- `Capacity Waitlist`
- `Management / Regulatory Review Required`
- `Declined / Outside Scope`

### B. `public.participants` governance lifecycle fields

Extend participants with a governed lifecycle model. Reconcile with existing status fields rather than replacing them blindly.

Required concepts:

- `lifecycle_stage`
- `is_rosterable` or equivalent participant-side roster eligibility flag
- `suitability_assessment_id`
- `readiness_notes`

Suggested lifecycle values:

- `intake_assessment`
- `onboarding`
- `ready_for_roster`
- `active_rosterable`
- `waitlist`
- `on_hold`
- `exited`
- `declined`
- `legacy_review_required` if needed for safe existing-record migration

### Readiness percentage

Prefer computing readiness from checklist state rather than storing an independently mutable percentage that can drift.

If a cached percentage is stored for UI/performance, it must be updated server-side from canonical checklist state and must never be accepted from arbitrary client input.

### Existing participant migration safety

The live database already contains participant/test records.

Before migration:

- inventory current participants, statuses and linked shifts;
- do not silently mark historical/current records compliant;
- do not destroy existing roster/history;
- use a documented compatibility/backfill approach such as `legacy_review_required` where appropriate;
- report exact backfill impact.

### C. `public.participant_onboarding_checklists`

Create one current onboarding checklist per participant, with version/audit history provided through `audit_events`.

Required fields:

- `id`
- `participant_id UNIQUE`
- `requirements JSONB` or equivalent structured checklist state
- `is_ready_for_rostering BOOLEAN DEFAULT false`
- `signoff_by UUID NULL`
- `signoff_at TIMESTAMPTZ NULL`
- `created_at`
- `updated_at`

Each checklist requirement must support metadata equivalent to:

- `required: boolean`
- `waivable: boolean`
- `status: pending | completed | waived | not_applicable`
- `completed_at`
- `completed_by`
- `waived_at`
- `waived_by`
- `waiver_reason`
- `notes`
- `document_id` where applicable

### Non-waivable critical requirements

Do not make every checklist item admin-waivable.

Examples that should be treated as non-waivable when applicable include:

- required participant/authorised representative consent
- verified funding/payer basis sufficient for the selected service pathway
- suitability approval
- executed service agreement before service commencement where required
- critical risk/safety information required for safe delivery

The exact applicability remains dynamic by service/context.

---

## 5. Dynamic onboarding requirements

Checklist keys should support the following concepts where applicable:

### Identity / funding

- identity verified
- NDIS number verified where applicable
- adult age scope confirmed
- funding method confirmed
- payer/contracting relationship confirmed
- nominee/representative authority where applicable
- emergency contact recorded
- communication/accessibility needs recorded

### Privacy / consent

- Privacy Collection Notice acknowledged
- participant/authorised representative consent obtained
- Information Sharing Authority only when external information sharing is actually required

Do not make Information Sharing Authority universally mandatory if no external sharing authority is needed.

### Service/legal

- suitability assessment approved
- approved service(s) recorded
- service agreement executed
- schedule of supports confirmed
- pricing/travel/cancellation terms accepted where applicable

### Care/risk

- participant goals recorded where relevant
- participant risk assessment completed
- support plan completed where required by service/risk level
- home/community WHS assessment where applicable to service environment
- clinical plan verified only when clinical/high-intensity needs require it
- management/regulatory review resolved where restrictive-practice/other boundary issues exist

### First-service readiness

G1 may record:

- participant-side service readiness approved
- worker requirements/profile identified

Do **not** claim worker competency matching is complete until G2 provides the worker competency/readiness engine.

A G1 participant may be participant-ready while G2 still blocks assignment of an unsuitable worker.

---

## 6. Risk triage model

The suitability assessment should capture only information necessary to determine service scope/safety pathway.

Risk indicators may include:

- mobility/transfers
- manual handling
- medication support
- allergies relevant to service
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

Do not diagnose.

Do not author clinical plans.

Do not collect excessive clinical detail on the public referral form; detailed assessment belongs in authenticated intake workflow.

---

## 7. Core server engine

Create/reuse a server-side intake module such as:

`lib/services/participantIntake.ts`

Exact location/name may adapt to current code structure, but do not scatter governance decisions across components.

### `validateSuitability(input)`

Must:

1. verify authorised caller;
2. query the live authoritative `service_scope_registry`;
3. fail closed if governance cannot be read;
4. evaluate current adult launch scope;
5. evaluate region using canonical region helpers, not duplicate hardcoded suburb lists;
6. validate funding/billing relationship;
7. validate every requested service;
8. escalate conditional clinical services;
9. escalate registration-required services;
10. escalate restrictive-practice indicators;
11. evaluate capacity/waitlist only from real available capacity data where available — never invent worker availability;
12. return deterministic outcome + reasons + conditions.

### `computeOnboardingRequirements(assessment)`

Generate dynamic requirements based on:

- funding/billing pathway
- selected services
- service risk class
- assessment risk indicators
- location/service environment
- clinical/management review needs

Clinical documents must be `not_applicable` for ordinary participants when not needed.

### `checkParticipantReadiness(participantId)`

Must:

- load authoritative checklist state server-side;
- ensure all applicable non-waived/non-waivable requirements are satisfied;
- validate permitted waivers and reasons;
- fail closed if required governance data is unavailable;
- set participant-side roster eligibility only through server-side logic;
- emit an audit event for transition/sign-off.

Client-provided readiness percentage or `is_rosterable=true` must never be trusted directly.

---

## 8. API implementation

Use current authentication/authorisation conventions.

Do not expose service-role credentials client-side.

### A. Suitability API

Implement equivalent endpoints under:

`app/api/crm/suitability/...`

Required operations:

- create assessment
- retrieve assessment by referral/participant where authorised
- update/reassess if current workflow requires it

Assessment writes should be restricted to authorised admin/management/intake roles according to the actual role model.

Ordinary support workers must not approve/decline referrals unless current role architecture explicitly authorises that responsibility.

### B. Onboarding API

Implement equivalent endpoints under:

`app/api/crm/onboarding/...`

Required operations:

- get current checklist
- update one/more checklist items with server validation
- attach/link applicable document evidence
- waive only a waivable item and require reason + authorised role
- perform final participant-readiness sign-off

### C. `/api/crm/convert` refactor

Decommission direct conversion to active participant.

Conversion requires a valid acceptable suitability outcome.

Conversion should create/preserve participant in onboarding state with participant-side roster eligibility false.

Initialize dynamic checklist from the accepted assessment.

Invalid outcomes must not convert to active state.

### D. Roster guards

Audit **all** participant-shift creation/assignment routes and UI pathways, not only one guessed endpoint.

G1 must block creation/assignment of service shifts for participants who have not passed participant onboarding readiness.

Canonical error:

`Participant onboarding is incomplete. Complete required intake and readiness review before rostering shifts.`

Do not break read-only viewing of historical shifts for legacy/non-ready participants.

G2 will later add worker-side credential/competency hard blocks.

---

## 9. RLS and access control

Use the access-control model already hardened in G0.1.

### Anonymous/public

- zero direct access to suitability/onboarding tables

### Participant

- only own safe onboarding summary if/when participant portal UX requires it
- no assessment governance mutation
- no waiver/signoff rights

### Ordinary worker/support staff

- minimum operational read access only if required for service delivery
- no approval/decline/signoff/waiver authority unless actual role model explicitly grants it

### Admin/owner/authorised management

- manage suitability/onboarding according to role

### Service role

- trusted server operations only

Test direct Supabase access, not just application API behaviour.

---

## 10. Admin UI

Preserve current design system and existing functional flows.

### A. `SuitabilityAssessmentModal`

Add/reuse a multi-step assessment flow from Referral and, where appropriate, Participant detail.

Suggested steps:

1. Participant age + funding/billing
2. Location/serviceability
3. Requested services / live scope validation
4. Complexity & risk triage
5. Deterministic outcome + reasons/conditions

The UI should not allow an admin to manually override registration-required/clinical/restrictive-practice system boundaries without a separately authorised governed pathway.

### B. Participant Onboarding panel/drawer

Display:

- current lifecycle
- checklist grouped by category
- applicability
- progress
- missing blockers
- linked evidence/documents
- waiver controls only where allowed
- audit context
- readiness review/signoff button

The final readiness action must call server-side validation rather than simply toggling UI state.

### C. Referral pipeline

Replace unsafe direct `Convert` / `Enrol Active` actions with context-aware actions such as:

- `Assess Suitability`
- `Continue Assessment`
- `Start Onboarding`
- `Continue Onboarding`

according to actual state.

### D. Participant list/detail

Show lifecycle such as:

- Intake
- Onboarding
- Ready for Roster
- Active / Rosterable
- Waitlist
- On Hold
- Declined
- Legacy Review Required where used

Readiness percentage shown in UI should be derived from canonical checklist state.

### E. Workforce roster UI

Participant selectors should not offer non-ready participants for new shifts.

Provide a clear explanation rather than silently hiding every record where operationally useful.

Historical records remain visible.

---

## 11. Serviceability and capacity

Use existing `lib/regions.ts` / canonical service-region configuration.

Do not create a second independent Northern NSW/Sydney list inside G1.

Serviceability outcome should distinguish:

- supported region
- outside current region
- requires manual location review

Capacity waitlist must not be selected automatically unless the system has real capacity evidence.

If capacity cannot be determined:

`Further Information Required` or management review is preferable to fabricated availability.

---

## 12. Audit events

Use existing `audit_events` to record important governance transitions such as:

- suitability assessment created
- assessment outcome set/changed
- referral converted to onboarding
- checklist requirement completed
- item waived + reason
- participant readiness approved
- roster eligibility changed
- participant declined/waitlisted/on hold

Capture actor, entity, event type, relevant before/after state, timestamp and reason where meaningful.

Avoid logging unnecessary health detail into generic audit payloads.

---

## 13. Compatibility / existing data strategy

Before applying G1 migration to live Supabase:

1. inspect current participants/referrals/shifts;
2. identify existing active participants with historical shifts;
3. define a non-destructive backfill;
4. preserve historical service records and roster visibility;
5. do not declare existing records compliant without evidence;
6. document exact rows/statuses affected.

Any destructive migration or irreversible status rewrite is a blocker under `docs/EXECUTION_PROTOCOL.md`.

---

## 14. Automated verification

Create/update a dedicated G1 test suite, for example:

`tests/governance-g1-onboarding.test.mjs`

At minimum cover:

### Funding

- Self-Managed valid ordinary service can proceed to suitability when other checks pass
- Plan-Managed valid ordinary service can proceed
- NDIA-Managed without genuine contracting/billing relationship is blocked/further configuration required
- a client-provided boolean cannot fabricate NDIA billing authority

### Service scope

- ACTIVE service can be assessed
- ACTIVE_WITH_CONTROLS creates required control items
- REGISTRATION_REQUIRED service returns registered-provider requirement
- CONDITIONAL_CLINICAL service returns clinical review required and does not become operational
- governance lookup failure fails closed

### Age

- under-18 referral does not auto-progress under current Adults 18+ launch scope

### Restrictive practices

- restrictive-practice indicator blocks automatic standard onboarding and requires management/regulatory review

### Dynamic checklist

- ordinary Community Access participant does not require clinical plan
- relevant clinical/high-intensity participant does require appropriate clinical plan/review status
- Information Sharing Authority is conditional where appropriate
- non-waivable critical requirement cannot be waived
- authorised waiver requires reason for waivable item

### Conversion

- conversion without accepted suitability assessment fails
- accepted conversion creates onboarding/non-rosterable participant
- no direct referral-to-active path remains

### Readiness

- incomplete checklist cannot become participant-side roster eligible
- final readiness recomputes canonical checklist server-side
- client cannot force `is_rosterable=true`

### Roster

- non-ready participant cannot be used for a new shift
- ready participant passes participant-side gate
- historical shifts remain readable

### RLS

- anon blocked
- participant cannot mutate governance
- worker cannot approve/waive/sign off unless explicitly authorised
- admin/owner path works

### Audit

- outcome/lifecycle/readiness changes emit audit events

---

## 15. Required quality gates

Run and pass:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- migration/schema verification
- RLS direct-access tests
- negative-path API tests
- rendered/browser workflow test for referral → assessment → onboarding → readiness
- reload/persistence verification
- responsive check for modified admin UI
- git diff review
- secret/dummy-data scan

If applying migration to live Supabase, explicitly report that separately from Vercel deployment.

Do not deploy Vercel Production unless separately authorised.

---

## 16. G1 exit criteria

G1 is complete only when all are true:

- referral cannot silently become active/rosterable;
- every suitability decision is persisted and auditable;
- adult launch scope is enforced;
- requested services are validated against live service scope;
- NDIA-managed relationship cannot be fabricated;
- registration-required requests are blocked/escalated correctly;
- conditional clinical requests escalate correctly and remain unavailable operationally;
- restrictive-practice indicators trigger management/regulatory review;
- onboarding requirements are dynamic, not one-size-fits-all;
- non-waivable critical requirements cannot be bypassed;
- consent/privacy requirements are represented correctly;
- participant-side roster eligibility is server-derived;
- new shifts cannot be created for non-ready participants;
- existing/historical data remains intact;
- RLS role boundaries pass;
- audit trail passes;
- all tests/typecheck/lint/build pass;
- implementation is committed locally;
- roadmap + this phase document are updated with actual completion evidence;
- no Vercel Production deployment occurred unless separately authorised.

---

## 17. Required implementation report — NO NEW PLAN

When G1 is executable, do not return another implementation plan.

Execute it.

At completion return:

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

Do not produce a G2 implementation plan unless explicitly requested. G2 already belongs in the canonical roadmap and will receive its own execution specification before execution.