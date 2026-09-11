# Governance G1 — Review Closure

> **This is not a new implementation plan.**
>
> Governance G1 was implemented in commit `627b844`, but independent review found several correctness, audit-integrity, privacy and fail-closed gaps. Antigravity must execute these corrections directly under `docs/EXECUTION_PROTOCOL.md`, then return a **G1 Review Closure Report**. Do not create another plan/proposal.

## Status

`REVIEW HARDENING REQUIRED — DO NOT START G2`

G1 must not be treated as accepted/closed until every item below is resolved and verified.

---

## 1. Remove unsafe invented/default participant facts

Current G1 UI/API still silently supplies facts that must be explicitly selected or sourced from an existing referral/participant record.

Remove all unsafe fallbacks, including:

- `Plan-Managed` as a default funding method
- `Yamba` / `Yamba NSW` as a default suburb
- preselected generic service codes such as Community Access + Daily Living
- `transportRequired = true` as a default
- `isAdultConfirmed = true` as a default when no trusted DOB/confirmation exists
- participant `primaryService` fallback that makes unverified service assumptions
- participant `planManager` display fallback of `Self-Managed` when no plan manager exists

Rules:

- prefill only from real existing referral/participant data;
- otherwise show an explicit unselected/unknown state;
- funding must be explicitly confirmed;
- requested services must be explicitly selected or mapped from genuine referral data;
- suburb/postcode must come from actual intake data;
- transport defaults false/unselected unless actually requested;
- adult status must be established by DOB or explicit non-default confirmation;
- do not silently substitute one funding type/service for missing data.

Add negative tests proving missing values do not silently become Plan-Managed/Yamba/active services/adult/transport-required.

---

## 2. Fix NDIA-managed contracting verification — free text is NOT verification

Current `validateSuitability()` treats a non-empty `registeredContractingProvider` string as enough to create a valid NDIA-managed funding basis.

That violates the canonical requirement that a genuine relationship must be supported by actual recorded contracting/billing-party evidence.

Do not accept an arbitrary text field as proof.

Required behaviour:

- use/reuse a real CRM contact/organisation relationship where possible;
- require an actual linked contracting provider record and/or controlled contract/reference record;
- record verification status, verifier identity and verification timestamp where appropriate;
- if a structured verified relationship does not exist, outcome remains `Further Information Required` / `Billing Configuration Required`;
- a typed provider name may be stored as an enquiry note, but must never authorise billing/delivery;
- no client boolean or free-text field may promote an NDIA-managed pathway to valid.

Also fix `billing_relationship_status`: it must never be stored as `verified` merely because the outcome is not `Registered Provider Requirement`.

Use explicit states such as:

- `not_applicable`
- `pending_verification`
- `verified_self_managed`
- `verified_plan_managed`
- `verified_registered_provider_contract`
- `billing_configuration_required`

or equivalent controlled values.

Add tests for a fake/free-text provider name and ensure it does not authorise the pathway.

---

## 3. Audit actor identity must be server-derived, never client supplied

Current G1 APIs accept strings such as:

- `assessedBy`
- `actorId`

from request bodies / hardcoded client labels and write them into assessment/checklist/audit history.

This allows audit identity to be spoofed.

Required correction:

- derive the authenticated actor from the server-side authenticated session/profile;
- ignore/reject client-supplied actor identity for governance events;
- persist stable authenticated user/profile ID where available;
- optionally store a display-name snapshot separately;
- use the same server-derived actor for assessment creation, checklist completion, waiver, conversion and final readiness sign-off;
- `completedBy`, `waivedBy`, `signoff_by`, `assessed_by` and audit-event actor fields must all originate from trusted server identity.

If the existing schema uses `TEXT`, a UUID string may be stored temporarily, but prefer a proper FK/profile identity migration if safe and compatible.

Add a negative test proving a request body containing another person's `actorId`/`assessedBy` cannot spoof the audit record.

---

## 4. Make conversion and readiness sign-off atomic / fail closed

Current referral conversion can:

1. insert a participant;
2. fail checklist creation;
3. only log the checklist error;
4. still update referral/assessment and return success.

This can create a participant in onboarding without the mandatory checklist.

Current readiness sign-off can also update the participant to rosterable before checklist sign-off/audit updates are proven successful.

Required correction:

- use a transactional PostgreSQL function/RPC or another demonstrably atomic server-side transaction for critical multi-table transitions;
- conversion must succeed only if participant + checklist + assessment link + referral lifecycle + required audit event all persist together;
- if any required write fails, no partial conversion may remain;
- final readiness sign-off must atomically validate canonical checklist state and update participant/checklist/audit together;
- checklist updates that revoke readiness must also fail closed if participant rosterability cannot be revoked;
- do not return success while a required persistence operation failed.

Add forced-failure tests for checklist insert failure, referral update failure, audit failure and sign-off partial failure.

---

## 5. Admin suitability UI must see the governed internal service catalogue

The current suitability modal loads `/api/governance/service-scope`, which is the public-sanitised service list and excludes `CONDITIONAL_CLINICAL`, `REGISTRATION_REQUIRED` and other internal/future governance items.

That means the UI cannot correctly assess a referral that requests Community Nursing, Complex Bowel Care, Catheter Management, Plan Management, Behaviour Support, SIL, SDA or another restricted/conditional item.

Required correction:

- create/reuse an authenticated admin/internal service-scope endpoint;
- include all relevant registry entries needed for suitability classification;
- expose only the internal fields necessary for authorised intake staff;
- preserve the public endpoint as sanitised/public-only;
- suitability UI must use the internal endpoint;
- restricted/conditional items must be selectable for assessment but visually marked as `Clinical Review`, `Registration Required`, `Future`, etc.;
- selecting them must never make them operationally active.

Add UI/API tests proving conditional and registration-required services can be assessed and escalate correctly.

---

## 6. Restore a complete governed Referral → Onboarding action path

The G1 UI replaced the direct conversion button with `Assess Suitability`, but assessment success currently only records the assessment and closes the modal. The message says it is "Advancing to onboarding" even though it does not actually execute the governed conversion.

Required behaviour after assessment:

- `Suitable` / `Suitable With Conditions` → show explicit `Start Onboarding` action;
- `Clinical Review Required` → show clinical review state, not onboarding activation;
- `Registered Provider Requirement` → show blocked/registered-provider pathway;
- `Further Information Required` → show missing-information state;
- `Management / Regulatory Review Required` → show management stop;
- `Declined / Outside Scope` → show declined/out-of-scope state;
- do not imply onboarding happened when only an assessment was saved.

The actual `Start Onboarding` action must call the governed atomic conversion path.

Ensure there is no alternative direct-active path through Add Participant or another admin route.

---

## 7. Manual Add Participant path must not bypass suitability

Current participant POST still contains defaults such as suburb/funding and creates a participant in `lifecycle_stage = onboarding` even when no suitability assessment exists.

Required correction:

- manual participant creation must either:
  - create an `intake_assessment` record/state and require suitability before onboarding; or
  - be explicitly limited to controlled legacy/import/admin recovery use and still remain non-rosterable with a visible governance blocker.
- it must never silently default to Plan-Managed/Yamba;
- it must never create a participant as onboarding-ready without a linked acceptable suitability assessment;
- Add Participant UI must explain the governed path.

Add tests for manual participant creation without suitability.

---

## 8. Complete the dynamic risk/checklist mapping promised by G1

The final report claims dynamic requirements for medication, mealtime/dysphagia and manual handling, but current `computeOnboardingRequirements()` does not create all of those promised conditional requirements.

Implement/verify conditional requirements for at least:

- medication support / medication authority or plan where applicable
- dysphagia/mealtime management plan where applicable
- manual handling/transfer plan where applicable
- seizure management information/plan where applicable
- transport governance requirement where transport is actually requested
- clinical/high-intensity care plan where applicable
- behaviour support plan review where applicable

Do not make ordinary Community Access participants complete irrelevant clinical documents.

Do not invent clinical plans; store/verify appropriate participant-specific documents from authorised professionals where required.

Also ensure the UI actually captures the risk fields used by the engine, including mobility/transfers and continence where required by the canonical G1 spec.

Remove unused state such as a personal-support checkbox if it is not actually submitted/used, or wire it correctly to the assessment model.

---

## 9. Tighten age verification

Current implementation may default adult status to true and uses an approximate `365.25` calculation.

Required correction:

- no default adult confirmation;
- if DOB is present, calculate age using calendar-date comparison;
- if DOB is absent, require an explicit admin confirmation sourced from intake information;
- missing/unknown age must not silently pass as adult;
- outcome should be `Further Information Required` when adult scope cannot be established;
- under-18 remains outside current launch scope.

---

## 10. Tighten privacy/RLS to minimum necessary access

Current RLS gives any `is_opus_staff()` account direct SELECT access to all suitability assessments and all onboarding checklists.

These records contain sensitive health/risk information and should use least privilege.

Required review/correction:

- suitability assessments: admin/authorised intake/management only unless a specific operational need is demonstrated;
- ordinary support workers should not read every participant's suitability assessment;
- onboarding checklists: ordinary workers should not read every participant's governance checklist;
- if worker access is required, restrict to assigned/rostered participants and expose only fields required for service delivery;
- participant portal should not receive raw internal checklist JSON including internal notes, waiver rationale, staff identity or document references by direct base-table access;
- prefer a participant-safe summary view/API for participant portal if onboarding visibility is needed;
- preserve admin/service-role management access;
- direct Supabase role tests required for anon, participant, unrelated worker, assigned worker where applicable, admin and service role.

Do not rely only on API auth when base-table RLS is broader.

---

## 11. Add schema integrity constraints and align documentation with the real schema

The G1 report contains claims not matching the committed migration/code, including:

- report says `SSA-YYYY-XXXXX`, while the migration currently creates `SSA-00001` style references;
- report describes participant lifecycle CHECK values that are not present in the committed migration;
- report describes some outcomes/status names differently from current code;
- report describes worker RLS as "for rostered participants", while the committed policy uses broad `is_opus_staff()`;
- report says dynamic checklist items exist that are not all present in current generator.

Required correction:

- choose one canonical SSA reference format and make code/schema/docs/tests agree;
- add safe CHECK constraints or controlled enums for lifecycle/outcome/billing relationship/checklist statuses where appropriate and compatible with existing rows;
- update roadmap/phase documentation to describe actual implemented behaviour only;
- do not claim a browser test if only SQL/API persistence was tested;
- do not claim a build passed unless the command completion/result is captured;
- implementation report must be evidence-based and match committed/live state.

---

## 12. Fix inaccurate billing relationship propagation

Conversion currently uses referral funding data and can fall back to `Plan-Managed` instead of using the accepted suitability assessment's governed funding result.

Required correction:

- participant funding at conversion must come from the accepted suitability assessment / verified payer configuration, not a stale referral default;
- referral values may seed the assessment but must not override accepted assessment state;
- plan-manager details must not default to `Self-Managed` merely because a manager name is absent;
- `billing_relationship_status` must reflect actual verification state.

---

## 13. Persistence/error handling must check every required write

Several G1 routes currently ignore errors from referral updates, assessment links, audit inserts, checklist sign-off updates and rosterability revocation writes.

Required correction:

- every critical governance write must have checked error handling;
- use transaction/RPC for state transitions where multiple writes must succeed together;
- no false-success response;
- audit failure on a governance decision must either fail the transition atomically or be handled through a documented durable outbox pattern — do not silently ignore it.

---

## 14. Verification required before G1 acceptance

Add/extend tests to cover all review findings above.

Minimum gates:

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build` with captured successful completion
- live migration verification
- direct RLS tests
- UI/browser flow: referral → assess → outcome → Start Onboarding → checklist → signoff
- persistence/reload verification
- forced-failure transaction tests
- no unsafe defaults test
- NDIA free-text spoof test
- audit actor spoof test
- public/internal service-scope separation test
- manual Add Participant bypass test
- unready participant shift rejection test
- legacy/historical shift visibility test
- responsive UI check
- git diff review
- secret/dummy-data scan

Do not deploy Vercel Production unless separately authorised.

---

## Required completion response

Do not return another implementation plan.

Execute this closure directly and return:

# Governance G1 Review Closure Report

## Starting commit / live DB state
## Unsafe defaults removed
## NDIA contracting verification
## Trusted audit actor identity
## Atomic conversion/signoff
## Internal service-scope intake path
## Referral → onboarding UX closure
## Manual participant path
## Dynamic checklist/risk mapping
## Age verification
## RLS/privacy access matrix
## Schema/documentation alignment
## Error-handling / fail-closed evidence
## Automated tests
## Browser/persistence tests
## Live Supabase migration status
## Git commit/push status
## Vercel status
## G1 acceptance recommendation

Then STOP.

**Do not start G2 until this review closure is accepted.**