# Opus Care Support Services — Governance & Go-Live Roadmap

> **Purpose:** Canonical execution plan for Antigravity and any future coding agent working on the Opus Care Support Services website + CRM.
>
> **Repository:** `iamnarace/NDIS_Project`
>
> **Execution rule:** Do not invent business facts, legal identity, NDIS registration status, insurance details, bank details, clinical authority, support item codes, rates, or provider relationships. Verify repository/database state before each phase.

---

## 1. Current business baseline

### Authorised business facts

- Business / trading name: **Opus Care Support Services**
- ABN: **41 267 197 576**
- Business structure: **Sole trader**
- GST: **Not registered for GST**
- NDIS provider status: **Unregistered**
- Public brand: **Opus Care Support Services**
- Do not unnecessarily advertise the words `sole trader` on the public website.
- Formal contracts must identify the true contracting party. If the proprietor legal name is not configured, agreement execution/sign/send must fail closed.
- Bank/remittance details: pending owner configuration.
- Required insurance will be in place before service delivery. The CRM should track it; never invent policy data.

### Service regions

#### Northern NSW

- Coffs Harbour
- Grafton
- Clarence Valley
- Maclean
- Yamba
- Ballina
- Northern Rivers
- selected surrounding serviceable locations

#### Sydney

- Blacktown
- Parramatta
- Western Sydney
- Sydney CBD
- Redfern
- selected surrounding locations

Canonical availability wording:

> Service availability depends on location, participant requirements and current worker capacity.

---

## 2. Funding and provider boundary

### Current direct participant funding scope

Opus Care currently intends to directly support:

- **Self-Managed NDIS participants**
- **Plan-Managed NDIS participants**

### NDIA-managed participants

Participant funding type and billing/contracting party are separate concepts.

Opus Care is currently unregistered and must not be represented as directly claiming from the NDIA.

A genuine NDIA-managed participant relationship may only proceed where the actual contracting/billing structure is explicitly recorded, such as a legitimate arrangement with a registered provider.

If the relationship is not configured, use:

`Billing Configuration Required`

Never fabricate a nominee, contracting provider, payer or subcontracting arrangement.

---

## 3. Approved service-scope model

The CRM must maintain a central Service Scope Registry separate from the master NDIS Support Catalogue.

### `ACTIVE`

- Community Access & Participation
- Daily Living Assistance
- Household Tasks / Domestic Assistance
- Life Skills & Independence
- Social Support / Companionship
- Appointment Support
- Shopping / Errand Assistance
- Support-Related Transport

### `ACTIVE_WITH_CONTROLS`

- Standard Personal Support

This must trigger screening for relevant risks such as manual handling, mobility/transfers, toileting/continence, medication, swallowing/mealtime issues, clinical tasks, behaviour risks and restrictive practices.

### `CONDITIONAL_CLINICAL`

These are part of the future/current capability model but remain unavailable for normal public booking, quotation, rostering and invoicing until clinical governance is implemented and approved:

- Community Nursing
- Complex Bowel Care
- Urinary Catheter Management

Required architecture includes participant-specific plans, qualified health-practitioner oversight where applicable, worker competency, clinical clearance, emergency/escalation procedures, insurance compatibility and review dates.

### `REGISTRATION_REQUIRED` / future

Do not advertise or operate these as current services while Opus Care is unregistered:

- Plan Management
- Specialist Behaviour Support
- Behaviour Support Plan Development
- Supported Independent Living (SIL)
- Specialist Disability Accommodation (SDA)
- Direct NDIA-managed service delivery
- Regulated Restrictive Practices

### `FUTURE`

- NDIS Digital Platform Service — only relevant if Opus later becomes a qualifying external intermediary/marketplace/payment platform; the internal Opus CRM/worker/participant portal is not automatically this service.
- Group & Centre-Based Activities — not currently authorised as a launch service.

---

## 4. Pricing and catalogue architecture

The **NDIS Support Catalogue** answers:

> What support items, definitions, units, claiming rules and price limits exist?

The **Opus Service Scope Registry** answers:

> What does Opus Care currently offer and under what governance controls?

They are not interchangeable.

### Required rules

- Use the authoritative current **NDIS Support Catalogue / Pricing Arrangements 2026–27**.
- Keep catalogue imports/versioning effective-date aware.
- Never retroactively mutate finalised invoice rates.
- Preserve agreed historical rates on existing invoices/agreements/shifts.
- Do not hardcode old NDIS rates in components/templates.

### Transport separation

Keep these concepts separate:

1. General Transport support
2. Activity Based Transport
3. Provider Travel — labour
4. Provider Travel — non-labour
5. Employee vehicle/mileage reimbursement under employment/payroll rules

Never treat a `$1.00` notional NDIS unit as automatically meaning `$1/km`.

---

## 5. Tax and invoice rules

Current configuration:

- GST status: `not_registered`
- Document title: **INVOICE**
- Never issue `TAX INVOICE` while Opus is not GST registered.
- Do not charge GST.
- Do not assert that every NDIS supply is automatically GST-free under a specific statutory provision.

Preferred neutral wording:

> GST has not been charged — supplier is not registered for GST.

Invoice external dispatch should remain blocked until required organisation/remittance configuration is complete.

Payment status and accounting must remain distinct. `Mark status as Paid` is not a payment ledger or bank reconciliation system.

---

## 6. Security and governance principles

### Public

Public users should only receive safe website-facing service information.

They must not receive internal:

- worker credential requirements
- worker competencies
- risk classes
- clinical approval flags
- quote/roster/invoice eligibility
- internal support catalogue mappings
- insurance policy information
- future/internal roadmap metadata

### Participant

Participant access must be limited to participant-authorised data and their own permitted workflows.

Participants must not gain governance administration rights.

### Worker / ordinary staff

Workers may receive operational information needed for their job, but must not be able to:

- activate/disable services
- change registration requirements
- change clinical requirements
- alter quote/roster/invoice eligibility
- administer organisation insurance
- alter organisation legal configuration

### Admin / owner

Only appropriately authorised admin/owner/governance roles may mutate governance configuration.

### Service role

Server/service-role access bypassing RLS must remain server-only and be guarded by application-level authorisation where appropriate.

### Fail closed

Operational governance decisions such as:

- quote eligibility
- roster eligibility
- invoice eligibility
- clinical eligibility
- registration-required status

must fail closed if authoritative governance data cannot be read.

A static/public fallback may be used only for harmless marketing display, never to authorise operational actions.

---

## 7. Worker screening policy

Opus Care voluntarily adopts the internal standard:

> All direct support workers must hold a current NDIS Worker Screening Clearance before independent participant support.

This is an Opus operational policy for the current unregistered business model; do not mislabel it as a universal legal requirement for every unregistered provider worker.

Future workforce governance must distinguish statuses such as:

- Clearance
- Pending
- Interim Bar
- Exclusion
- Suspension
- No Valid Clearance

Non-cleared / barred / suspended workers must not become independently rosterable under Opus policy.

---

## 8. Privacy and consent

Opus Care will handle sensitive disability and potentially health information.

Required principles:

- no pre-ticked consent
- privacy acknowledgement separated from other permissions where appropriate
- participant/nominee authority captured
- marketing consent optional and separate
- information-sharing authority tracked and revocable
- least-privilege CRM access
- audit history
- sensitive data collected only where necessary

Do not collect detailed clinical information unnecessarily on the first public referral form; collect it securely during intake where appropriate.

---

# 9. EXECUTION ROADMAP

## Phase 0 / 0.1 — Billing and organisation foundation

**Status: COMPLETE**

Delivered/fixed:

- central organisation profile
- authorised ABN
- GST status
- `INVOICE` vs `TAX INVOICE` handling
- removal of blanket GST-free assertions
- removal of dummy ABN/bank/corporate identity
- NDIA billing safeguards
- payment-status wording
- shared document foundation
- operations guide foundation

---

## Governance G0 — Business/service-scope foundation

**Status: COMPLETE**

Delivered:

- Service Scope Registry
- organisation insurance register
- legal identity configuration support
- Northern NSW + Sydney service regions
- referral consent correction
- explicit funding selection
- organisation readiness panel
- future/registration-required service blocking

---

## Governance G0.1 — Security/governance hardening

**Status: COMPLETE**

Delivered:

- public API sanitisation
- fail-closed operational governance
- admin-only governance writes
- admin-only insurance management
- agreement execution guard when legal counterparty identity is incomplete
- separation of public marketing fallback from operational authorisation
- final security closure passed: base-table privileges revoked from anon, public directory view created, verified role segregation across anon/participant/worker/staff/admin.

---

## Governance G0.2 — NDIS catalogue integrity

**Status: COMPLETE**

Delivered:

- 2026–27 NDIS support-item verification
- corrected self-care/community participation/household item mapping
- transport architecture separation
- Community Nursing registration-group mapping
- catalogue/version architecture
- historical invoice/rate immutability
- tests for catalogue integrity

---

# Governance G1 — Participant Intake & Onboarding Governance

**Status: COMPLETE — AUTONOMOUS SELF-REVIEW PASSED 2026-09-12**

### Objective

Replace unsafe direct referral-to-active conversion with a governed participant lifecycle.

### Target lifecycle

`Referral`
→ `Service Suitability Assessment`
→ outcome
→ `Participant Onboarding`
→ readiness review
→ `ACTIVE / ROSTERABLE`

### G1A — Service Suitability Assessment

Assess:

#### Funding/billing

- Self-Managed
- Plan-Managed
- NDIA-Managed
- Unsure / further information required
- actual payer/contracting party

#### Location

- Northern NSW / Sydney region
- postcode/suburb
- serviceability
- worker coverage/capacity
- travel practicality

#### Requested service

Check requested service against live Service Scope Registry.

Possible outcomes:

- `Suitable`
- `Suitable With Conditions`
- `Clinical Review Required`
- `Further Information Required`
- `Registered Provider Requirement`
- `Capacity Waitlist`
- `Declined / Outside Scope`

#### Complexity/risk triage

Screen for relevant indicators such as:

- mobility/transfers
- manual handling
- medication
- allergies
- dysphagia/mealtime concerns
- seizures
- continence
- catheter care
- bowel care
- clinical tasks
- behaviours of concern
- behaviour support plan
- restrictive practices
- transport requirements

Do not diagnose participants and do not invent clinical plans.

### G1B — Participant onboarding gate

Conditional checklist should support as applicable:

- identity
- NDIS number
- funding/payer
- nominee/representative
- emergency contact
- communication/accessibility needs
- privacy notice
- participant/nominee consent
- information-sharing authority
- service suitability decision
- requested/approved services
- participant goals
- risk assessment
- support plan
- service agreement
- schedule of supports
- pricing/travel/cancellation acceptance
- home/community WHS assessment status
- clinical plan status where required
- worker matching requirements
- first-shift readiness

A simple community-access participant must not be forced through irrelevant clinical documentation.

### G1C — Status control

Do not permit normal rostering until onboarding readiness requirements applicable to that participant are complete.

Preserve audit trail for acceptance/decline/readiness changes.

### G1 exit criteria

- referral cannot silently become active/rosterable
- every suitability outcome is auditable
- service scope is enforced
- NDIA-managed billing relationships cannot be fabricated
- conditional/clinical services escalate correctly
- restrictive-practice indicators trigger management/regulatory review
- required consent/privacy records exist
- typecheck/lint/tests/build pass
- no production deploy unless separately authorised

---

# Governance G2 — Worker Readiness & Roster Safety

**Status: PLANNED**

### Deliverables

- worker onboarding gate
- NDIS Worker Screening status model
- role/service-dependent credential requirements
- worker competency matrix
- participant-specific competency support
- driver licence/vehicle insurance checks
- Ahpra credential fields for nursing roles
- expiry/review controls
- roster hard blocks for critical missing/expired requirements

### Core rule

`Participant requires Service X`
+
`Service X requires Credential/Competency Y`
+
`Worker has valid Y`
+
`Participant-specific approval complete where applicable`
=
`Worker may be rostered`

Otherwise block or require management review.

---

# Governance G3 — Privacy, Participant Documents & Help Centre

**Status: PLANNED**

### Deliverables

- privacy/collection notices
- participant rights & responsibilities
- information-sharing authority
- participant handbook
- complaints/feedback guide
- service agreement + schedule alignment
- pricing/travel/cancellation resources
- controlled document versions
- Help Centre UI exposing the verified Operations Guide
- policy/document acknowledgement where applicable

Do not publish speculative legal or clinical documents.

---

# Governance G4 — Complaints, Incidents & Safeguarding

**Status: PLANNED**

### Deliverables

- align existing complaints workflow
- align existing incident/safeguarding workflow
- distinguish internal incident governance from registered-provider NDIS reportable-incident obligations
- abuse/neglect/exploitation/safeguarding procedures
- external escalation guidance
- anonymous complaint support where practical
- advocacy/support-person recording
- restrictive-practice boundary
- corrective action/audit linkage

Do not state that every incident by an unregistered provider must be submitted through the registered-provider reportable-incident portal.

---

# Governance G5 — WHS, Home Safety, Transport & Continuity

**Status: PLANNED**

### Deliverables

- Home & Community WHS Assessment
- lone-worker safety/check-in escalation
- driver/vehicle/transport governance
- participant money/property controls
- emergency and disaster management
- business continuity
- Northern NSW bushfire/flood/extreme-weather considerations
- Sydney operational disruption considerations

Participant transport billing and employee vehicle reimbursement must remain separate.

---

# Governance G6 — Clinical / High-Intensity Governance

**Status: PLANNED — MUST PRECEDE ACTIVATION OF CLINICAL SERVICES**

### Deliverables

- nursing/Ahpra credential model
- clinical review/approval architecture
- clinical plan records/document links
- participant-specific competency assessments
- qualified assessor/practitioner details
- emergency/escalation plans
- review/expiry controls
- clinical incident governance
- Community Nursing activation process
- Complex Bowel Care activation process
- Urinary Catheter Management activation process

Generic online training must never be treated as sufficient participant-specific high-intensity competency.

---

# Governance G7 — Website & Public Launch Compliance

**Status: PLANNED**

### Website scope

Public current services should align only with active/approved service scope.

Do not advertise current availability for:

- Plan Management
- Specialist Behaviour Support / BSP development
- SIL
- SDA
- direct NDIA-managed claiming
- regulated restrictive practices
- conditional clinical services until they are operationally activated

### Public resources

Prepare/verify:

- Home
- Services
- Locations
- About
- Referral
- Contact
- Self-Managed information
- Plan-Managed information
- Support Coordinator/referral information
- registered-provider partnership information where factually appropriate
- Privacy
- Complaints & Feedback
- Rights & Responsibilities
- Pricing
- Participant Handbook/resources
- Current Availability

Do not claim Opus is NDIS registered, approved or endorsed.

---

# 10. Go-Live final verification phase

**Status: PLANNED**

Before accepting the first real participant, run controlled end-to-end dry runs.

### Business readiness

- proprietor legal contracting identity configured
- real correspondence/business address configured where required
- genuine bank/remittance details configured
- required insurance records active
- actual worker credentials/training recorded
- pricing configuration verified

### Dummy participant lifecycle test

`Referral`
→ suitability
→ onboarding
→ agreement
→ schedule
→ worker match
→ roster
→ shift
→ progress note
→ timesheet
→ service record
→ invoice
→ payment-status workflow
→ review/exit

### Negative-path testing

Examples:

- restricted service requested → blocked/escalated
- NDIA-managed funding without genuine contracting payer → billing blocked
- conditional clinical service without clinical clearance → quote/roster/invoice blocked
- worker missing NDISWC → independent roster blocked under Opus policy
- worker missing participant-specific competency → high-intensity roster blocked
- expired driver/vehicle requirement → transport roster blocked
- unsigned/incomplete required agreement → participant not rosterable
- missing legal contracting identity → agreement execution blocked
- governance DB unavailable → operational action fails closed

### Quality gates

- typecheck
- lint
- automated tests
- production build
- migration verification
- RLS/access tests
- role tests
- audit-trail tests
- visual/responsive QA
- document A4/print QA
- secret scan
- git diff review

Production deployment requires separate approval.

---

# 11. Agent execution protocol

For every phase:

1. Read this roadmap first.
2. Inspect repository + database + existing functionality before creating new schema/components.
3. Reuse existing tables/modules where practical.
4. Do not build duplicate parallel models without a documented reason.
5. Verify current official NDIS/NDIA/Commission/Fair Work/OAIC/ATO/NSW authority when a phase depends on current regulatory facts.
6. Do not treat competitor CRM behaviour as legal authority.
7. Keep changes phase-scoped.
8. Apply migrations only when required and report whether they touched live Supabase.
9. Run quality gates.
10. Commit locally after a clean verified phase.
11. Do not push/deploy Production unless specifically authorised.
12. Update this roadmap's phase status and implementation notes after each accepted phase.
13. STOP at the end of each phase for review unless the roadmap/user explicitly authorises continuation.

---

# 12. Required phase report format

Every phase completion report must include:

- Phase name
- Starting SHA
- Ending SHA
- Branch
- Working-tree status
- Git remote/push status
- Vercel deployment status
- Live Supabase migration/data status
- Files changed
- Schema changes
- RLS/security impact
- User-visible workflow changes
- Tests/typecheck/lint/build
- Negative-path tests
- Known remaining risks
- Next recommended phase

Never describe `no production changes` if live Supabase schema/data was modified. Report database and Vercel states separately.

---

# 13. Current execution marker

## CURRENT GATE

**Governance G2 — Worker Onboarding, Competency & Verification Governance (COMPLETE)**

## NEXT PHASE AFTER PASS

**Governance G3 — Participant Privacy, Documents & Help Centre**

Antigravity must not skip directly to G3/G4/G6 or random feature development.

---

## Maintenance rule

This file is intended to become the single visible plan for the governance/go-live program.

When business decisions change, update this roadmap rather than relying on old chat prompts.
