# Governance G6 — Clinical / High-Intensity Governance

> Canonical autonomous execution specification. Implement directly after G5 passes.

## Status

`READY AFTER G5 PASSES — REQUIRED BEFORE ANY CLINICAL SERVICE ACTIVATION`

## Objective

Build a safe clinical/high-intensity governance architecture for Community Nursing, Complex Bowel Care and Urinary Catheter Management without falsely activating services or fabricating clinical authority.

## 1. Boundary first

Current conditional services:

- Community Nursing
- Complex Bowel Care
- Urinary Catheter Management

They must remain unavailable for ordinary quote/roster/invoice/public booking until the service-level and participant-level clinical readiness gates pass.

Do not turn their existence in the Service Scope Registry into operational availability.

Plan Management, Specialist Behaviour Support/BSP development, SIL, SDA, direct NDIA-managed service delivery and regulated restrictive practices remain outside current operational scope/registration boundary.

## 2. Clinical governance roles

Create/reuse role/credential architecture supporting:

- RN / nurse role
- relevant Ahpra/NMBA registration details
- clinical supervisor/lead designation
- qualified assessor/practitioner details for participant-specific plans
- approval/review authority

Do not fabricate a Clinical Lead, nurse registration, practitioner, policy approver or insurer extension.

If no real person is configured, the workflow may exist but final clinical activation must remain blocked.

## 3. Ahpra/NMBA verification model

For nursing workers support:

- registration number
- profession/registration type
- status
- verified date
- verifier
- expiry/renewal review date if applicable
- evidence/reference

Worker self-entry is not verification.

Invalid/unverified/suspended/expired registration must fail closed for nursing assignment.

## 4. Participant clinical review

Create/reuse a controlled clinical-review record linked to participant and service/task.

Support concepts such as:

- clinical service/task
- current health-practitioner assessment reference
- participant-specific care plan/document
- plan author/discipline
- issue/effective date
- review/expiry date
- known escalation/emergency instructions
- contraindications/risks relevant to worker delivery
- clinical reviewer
- approval status
- approval/review timestamps
- required participant-specific worker competencies

Do not copy large clinical content into generic audit logs.

## 5. High-intensity participant-specific competency

For Complex Bowel Care and Urinary Catheter Management, require a participant-specific competence/authorisation model that can prove:

- correct participant
- correct support/task
- current participant-specific plan
- trainer/assessor identity/qualification where applicable
- worker trained/assessed
- competency status
- achieved date
- review/expiry
- evidence
- emergency/escalation knowledge

Generic online course completion alone cannot satisfy the gate.

## 6. Community Nursing

Keep Community Nursing mapped to the correct NDIS registration/support catalogue group/items but do not activate a universal rate/service item.

When later operationally eligible, assignment/rate selection must account for the actual nursing level/time/day/support item and current catalogue.

Clinical readiness should require at least:

- service-level governance enabled
- appropriate insurance configuration/evidence active
- suitably verified nursing worker
- participant-specific nursing assessment/plan
- clinical approval
- service agreement/schedule supports aligned
- participant G1 readiness
- worker G2 readiness
- WHS/transport G5 controls where applicable

## 7. Complex Bowel Care

Keep status conditional until all applicable requirements are present, including:

- current participant-specific bowel care plan
- qualified health-practitioner involvement/oversight as appropriate
- clear risks/emergency escalation
- worker participant-specific training/competency
- management/clinical approval
- insurance scope configured
- review date

Do not encode a blanket rule that only nurses may ever deliver it; instead enforce the current authorised clinical plan, practitioner/assessor requirements and participant-specific competence model.

## 8. Urinary Catheter Management

Keep status conditional until all applicable requirements are present, including:

- current participant-specific catheter care plan
- qualified health-practitioner involvement/oversight as appropriate
- infection/complication/escalation instructions
- worker participant-specific training/competency
- management/clinical approval
- insurance scope configured
- review date

Do not generalise one participant's clinical instructions to another.

## 9. Service activation architecture

Create a service-level clinical readiness gate, separate from participant readiness.

Example states:

- `NOT_CONFIGURED`
- `GOVERNANCE_INCOMPLETE`
- `INSURANCE_REQUIRED`
- `CLINICAL_LEAD_REQUIRED`
- `READY_FOR_CASE_REVIEW`
- `ACTIVE_CONDITIONAL`
- `SUSPENDED`

A service may only become operationally available when every configured mandatory prerequisite passes.

Do not automatically make it public merely because internal service-level readiness passes; G7 controls publication.

## 10. Quote/roster/invoice hard gates

For conditional clinical services, server-side operational actions must verify current live readiness at the action boundary.

Require applicable:

- service-level clinical readiness
- participant clinical approval
- worker credential/readiness
- participant-specific competency
- current plan/review date
- insurance readiness
- participant G1 readiness
- service scope status

No stale static fallback.

Historical completed records remain readable even if current clinical readiness later expires.

## 11. Medication / mealtime / seizure boundary

Where G1/G2 captured medication, dysphagia/mealtime or seizure needs, ensure the architecture can link appropriate participant-specific plans/instructions and worker competency without falsely classifying every such need as Community Nursing.

Do not author a clinical plan automatically.

## 12. Clinical incident linkage

Integrate with G4 incident/safeguarding system for clinical incidents/adverse events.

Support management/clinical review and plan/competency corrective actions.

Do not create a second incident database.

## 13. RLS/privacy

Clinical records are sensitive health information.

Use least privilege:

- public: none
- participant: own approved/safe plan/document access where designed
- ordinary/unassigned worker: none
- assigned competent worker: minimum operational instructions/document access
- clinical/admin management: governed access
- service role: trusted server operations

Direct RLS tests mandatory.

## 14. Audit

Audit important changes:

- clinical review created/approved/suspended
- plan linked/replaced/expired
- service-level activation/suspension
- participant-specific competency granted/expired/revoked
- quote/roster/invoice block/eligibility change where appropriate

Server-derived actors only.

## 15. Tests

At minimum verify:

- conditional clinical services remain blocked before G6 prerequisites
- missing insurance configuration blocks clinical activation
- missing verified clinical lead/authority blocks service activation where required
- unverified Ahpra blocks nursing assignment
- valid Ahpra alone is insufficient without participant plan/approval
- generic training alone does not satisfy bowel/catheter participant-specific competency
- worker competent for Participant A cannot use that competency for Participant B
- expired care plan blocks new delivery
- expired participant-specific competency blocks new delivery
- historical clinical shifts remain readable
- public cannot access clinical records
- unrelated worker cannot access clinical records
- assigned authorised worker receives only minimum operational information
- current service catalogue mapping remains correct
- service cannot become public automatically
- audit actor trusted/server-derived

Run full repository quality gate.

## G6 exit criteria

- clinical service-level readiness architecture exists;
- Ahpra/nursing verification exists;
- participant clinical review/plan model exists;
- participant-specific competency exists and is enforced;
- Community Nursing/bowel/catheter remain fail-closed until prerequisites pass;
- quote/roster/invoice gates are server-side and live-data driven;
- clinical privacy/RLS passes;
- clinical incident linkage works;
- no fabricated clinical authority/insurance/registration claim;
- all tests/typecheck/lint/build pass;
- committed/pushed;
- Vercel Production unchanged.

When complete, automatically start G7.