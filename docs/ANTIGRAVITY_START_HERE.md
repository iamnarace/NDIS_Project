# Antigravity — START HERE

You are continuing the existing **Opus Care Support Services** website + CRM project.

Repository:

`https://github.com/iamnarace/NDIS_Project`

Primary branch:

`main`

## Read these first, in this order

1. `docs/EXECUTION_PROTOCOL.md`
2. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
3. the current phase specification referenced below

The roadmap defines the current phase. The phase specification contains the detailed implementation scope, safeguards, tests and exit criteria.

`docs/ANTIGRAVITY_HANDOFF.md` is historical context and may include stale **CarePoint Support Services** naming, old deployment details or superseded decisions. It must not override current repository/live database evidence, owner-authorised facts, the Governance Roadmap or the current phase specification.

---

## Critical execution rule — NO SECOND IMPLEMENTATION PLAN

The detailed GitHub phase specification **is already the implementation plan**.

When the current phase is marked `READY TO EXECUTE` or `IN PROGRESS`:

- do **not** return another implementation plan;
- do **not** create another proposal/task-plan file;
- do **not** stop merely to restate what you intend to build;
- do **not** ask the user to approve the same scope again.

Perform the preflight, execute the current phase directly, verify it, commit the verified work, update the roadmap/phase status, and return an **Implementation Report**.

Only stop before execution for an actual blocker defined in `docs/EXECUTION_PROTOCOL.md` or when the user explicitly requests read-only mode.

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

Do not invent proprietor legal name, address, bank details, insurance, NDIS registration details, payer relationships or clinical authority.

---

## Current execution position

Completed foundation work includes:

- Phase 0 / 0.1
- Governance G0
- Governance G0.1 hardening/security
- Governance G0.2 NDIS catalogue integrity
- final governance direct-access security closure

### Current phase

**Governance G1 — Participant Intake & Onboarding Governance**

Status:

`READY TO EXECUTE`

Canonical G1 specification:

`docs/governance/G1_PARTICIPANT_INTAKE_ONBOARDING.md`

Read that file in full and **execute it directly**.

Do not create another G1 implementation plan.

---

## Required behaviour

- Inspect repository, Git status, recent commits and live Supabase state before implementation.
- Reconcile local Git with `origin/main` before pushing because governance commits and GitHub documentation may have been created on different sides.
- Preserve all verified local governance commits; never reset them away.
- Reuse existing schema/modules before adding new ones.
- Do not implement random features outside the current phase specification.
- Regulatory assertions must be checked against current authoritative Australian/NDIS sources when they materially affect implementation.
- Do not deploy Vercel Production unless separately authorised.
- Report live Supabase changes separately from Git/Vercel deployment status.
- Run the phase's required typecheck, lint, tests, build, security/RLS and negative-path checks.
- Commit only verified phase work.
- Update the current phase spec and `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md` with actual completion evidence/status.
- Stop at the phase boundary for review unless explicitly authorised to continue.

---

## First action on every new Antigravity session

1. Read `docs/EXECUTION_PROTOCOL.md`.
2. Read `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`.
3. Read the current phase specification.
4. Run `git status`; inspect HEAD, branch and recent history.
5. Compare local state with `origin/main`.
6. Inspect applicable live Supabase migrations/state.
7. Confirm the phase/gate is executable.
8. If executable, **implement it directly — no re-planning**.

Do not redesign the project from scratch.