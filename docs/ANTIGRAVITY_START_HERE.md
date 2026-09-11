# Antigravity — START HERE

You are continuing the existing **Opus Care Support Services** website + CRM project.

Repository:

`https://github.com/iamnarace/NDIS_Project`

Primary branch:

`main`

## Read these first, in this order

1. `docs/EXECUTION_PROTOCOL.md`
2. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
3. `docs/governance/G1_PARTICIPANT_INTAKE_ONBOARDING.md`
4. `docs/governance/G1_REVIEW_CLOSURE.md`

The roadmap defines the overall program. The G1 phase specification defines the original implementation scope. The **G1 Review Closure** contains the current independent-review findings that must be corrected before G1 is accepted.

`docs/ANTIGRAVITY_HANDOFF.md` is historical context and may include stale **CarePoint Support Services** naming, old deployment details or superseded decisions. It must not override current repository/live database evidence, owner-authorised facts, the Governance Roadmap, the phase specification or the current review closure.

---

## Critical execution rule — NO SECOND IMPLEMENTATION PLAN

The GitHub specifications are already the implementation instructions.

Do **not** return another implementation plan, proposal, architecture document or approval task list.

Do not stop merely to restate what you intend to fix.

Perform preflight, execute the current G1 review closure directly, verify it, commit verified work, update the governance docs with actual evidence, and return the required **G1 Review Closure Report**.

Only stop before execution for a real blocker defined in `docs/EXECUTION_PROTOCOL.md` or if the user explicitly requests read-only mode.

---

## Current owner-authorised facts

- Business/trading name: **Opus Care Support Services**
- ABN: **41 267 197 576**
- Business structure: **sole trader**
- GST status: **not registered for GST**
- Current NDIS provider status: **unregistered**
- Current direct participant funding scope: **Self-Managed and Plan-Managed**
- Bank/remittance details: owner will configure genuine details before operational invoicing
- Required insurance: will be in place before service delivery; never invent policy details
- Service regions: Northern NSW corridor plus selected Sydney areas including Blacktown, Parramatta, Western Sydney, Sydney CBD and Redfern
- Current launch participant scope: **Adults 18+**

Do not invent proprietor legal name, address, bank details, insurance, NDIS registration details, payer relationships, participant facts or clinical authority.

---

## Current execution position

Completed foundation work includes:

- Phase 0 / 0.1
- Governance G0
- Governance G0.1 hardening/security
- Governance G0.2 NDIS catalogue integrity
- final governance direct-access security closure

Governance G1 implementation commit exists:

`627b844` — `feat(governance): implement Governance Phase G1 participant intake and onboarding governance`

Independent review found material G1 closure issues, so G1 is **not yet accepted**.

### Current executable work

**Governance G1 — Review Closure / Hardening**

Status:

`READY TO EXECUTE`

Canonical review closure:

`docs/governance/G1_REVIEW_CLOSURE.md`

Execute that document directly.

### Do not start G2

Governance G2 is blocked until the G1 Review Closure Report is reviewed and G1 is explicitly accepted.

---

## Required behaviour

- Fetch/reconcile `origin/main` with any verified local changes before implementation.
- Preserve commit `627b844` and prior verified governance history.
- Inspect live Supabase state before creating the corrective migration.
- Reuse existing schema/modules rather than creating parallel systems.
- Do not implement random features outside the G1 review closure.
- Do not deploy Vercel Production unless separately authorised.
- Report live Supabase changes separately from Git/Vercel status.
- Run all tests and negative-path evidence required by `G1_REVIEW_CLOSURE.md`.
- Derive governance actor identity from trusted server authentication, not client labels.
- Use fail-closed/transactional behaviour for critical lifecycle changes.
- Commit only verified closure work.
- Update the G1 phase documentation and roadmap to match actual evidence after the review closure passes.
- Stop at the G1 boundary for review.

---

## First action on every Antigravity session right now

1. Read `docs/EXECUTION_PROTOCOL.md`.
2. Read `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`.
3. Read `docs/governance/G1_PARTICIPANT_INTAKE_ONBOARDING.md`.
4. Read `docs/governance/G1_REVIEW_CLOSURE.md`.
5. Run `git status`; inspect HEAD, branch and recent history.
6. Fetch/compare `origin/main` and reconcile safely.
7. Inspect live Supabase G1 migration/data state.
8. Execute the G1 review closure directly — **no re-planning**.

Do not redesign the project from scratch.