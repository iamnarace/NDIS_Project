# Codex — START HERE: Autonomous Opus Care Governance Run

The owner has explicitly authorised Codex to complete the remaining Opus Care governance roadmap **continuously without returning for phase-by-phase approval**.

Repository:

`iamnarace/NDIS_Project`

Primary branch:

`main`

## Read in this exact order

1. `docs/CODEX_AUTONOMOUS_RUNBOOK.md`
2. `docs/EXECUTION_PROTOCOL.md`
3. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
4. current phase specification under `docs/governance/`

## Current starting gate

Start with:

`docs/governance/G1_REVIEW_CLOSURE.md`

Governance G1 implementation exists, but its independent review closure must be executed before G2.

After the G1 closure gate passes, **do not stop for owner review**.

Continue automatically through:

1. G1 Review Closure
2. G2 — Worker Readiness & Roster Safety
3. G3 — Privacy, Participant Documents & Help Centre
4. G4 — Complaints, Incidents & Safeguarding
5. G5 — WHS, Home Safety, Transport & Continuity
6. G6 — Clinical / High-Intensity Governance
7. G7 — Website & Public Launch Compliance
8. Final Go-Live Verification + independent global audit

## Critical behaviour

- Do not create another implementation plan.
- Do not ask for approval at normal phase boundaries.
- Implement the current phase directly.
- Run its full acceptance gate.
- Independently review the implementation against the spec.
- If anything fails, fix it and rerun the gate.
- Only after all criteria pass, mark the phase complete, commit/push it, then immediately begin the next phase.
- Stop only for a true hard blocker defined in `docs/EXECUTION_PROTOCOL.md`.
- Missing owner-supplied real-world values such as bank details, proprietor legal name, or insurance certificate values should normally remain fail-closed operational configuration items and **must not stop unrelated development phases**.
- Do not deploy Vercel Production unless separately authorised.

## First commands

Do not trust cached `origin/main`.

```powershell
git remote -v
git fetch --prune origin
git ls-remote origin refs/heads/main
git rev-parse HEAD
git rev-parse origin/main
git status
git log --oneline --decorate -12
```

Safely reconcile local work with current GitHub main. Preserve all verified governance commits and documentation.

## Required final response

Do not send separate G1/G2/G3/etc. approval requests to the owner.

At the end of the full autonomous run, return one consolidated:

`OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT`

The report must show each phase, evidence, migrations, tests, security checks, final Git SHA, live Supabase state, Vercel state, and any remaining **OWNER INPUT REQUIRED** items before real launch.
