# Antigravity — START HERE

You are continuing the existing **Opus Care Support Services** website + CRM project.

Repository:

`https://github.com/iamnarace/NDIS_Project`

Primary branch:

`main`

## Canonical execution plan

Before changing anything, read this file in full:

`docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`

Treat that roadmap as the current source of truth for the Opus Care governance/go-live program.

`docs/ANTIGRAVITY_HANDOFF.md` contains older historical project context and may include stale **CarePoint Support Services** naming, old deployment details or decisions that have since changed. Do **not** allow older handoff text to override the current repository, live database evidence, owner-authorised facts, or `OPUS_CARE_GOVERNANCE_ROADMAP.md`.

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

## Current execution position
 
Completed foundation work includes Phase 0/0.1, Governance G0, G0.1 hardening, G0.2 NDIS catalogue integrity, and the G0.3 security closure gate.
 
The **current active phase** is:
 
**Governance G1 — Participant Intake & Onboarding Governance** (IN PROGRESS)

## Required behaviour

- Inspect repository, Git status, recent commits and live Supabase state before implementation.
- Reconcile local Git with `origin/main` before pushing because governance work may exist locally while documentation has been updated remotely.
- Do not discard verified local governance commits.
- Reuse existing schema/modules before adding new ones.
- Do not implement random features outside the current roadmap phase.
- Regulatory assertions must be checked against current authoritative Australian/NDIS sources when required.
- Do not deploy Vercel Production unless separately authorised.
- Report live Supabase changes separately from Git/Vercel deployment status.
- Run typecheck, lint, tests, build, security/RLS and relevant negative-path checks for each implementation phase.
- Commit only verified phase work.
- Update `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md` after each accepted phase so GitHub remains the visible execution plan.
- Stop at phase boundaries for review unless explicitly authorised to continue.

## First action on every new Antigravity session

1. Read `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`.
2. Run `git status`, inspect `HEAD`, branch and recent history.
3. Compare local state with `origin/main`.
4. Inspect applicable live Supabase migrations/state.
5. Determine the current roadmap gate/phase.
6. Continue only that phase.

Do not redesign the project from scratch.
