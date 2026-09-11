# Codex — START HERE: Autonomous Opus Care Governance Run

The owner has explicitly authorised Codex to complete the remaining Opus Care governance roadmap **continuously without returning for phase-by-phase approval**.

Repository: `iamnarace/NDIS_Project`

Primary branch: `main`

## Read in this exact order

1. `AGENTS.md`
2. `docs/CODEX_AUTONOMOUS_RUNBOOK.md`
3. `docs/EXECUTION_PROTOCOL.md`
4. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
5. the current phase specification under `docs/governance/`

## Current starting gate

Start with:

`docs/governance/G1_REVIEW_CLOSURE_AUTONOMOUS.md`

That wrapper requires execution of every technical requirement in `G1_REVIEW_CLOSURE.md`, but replaces the old supervised STOP with autonomous self-acceptance when all criteria pass.

After G1 closure passes, continue automatically through:

1. G2 — Worker Readiness & Roster Safety
2. G3 — Privacy, Participant Documents & Help Centre
3. G4 — Complaints, Incidents & Safeguarding
4. G5 — WHS, Home Safety, Transport & Continuity
5. G6 — Clinical / High-Intensity Governance
6. G7 — Website & Public Launch Compliance
7. Final Go-Live Verification + independent global audit

## Critical behaviour

- Do not create another implementation plan.
- Do not ask for approval at normal phase boundaries.
- Implement the current phase directly.
- Run its full acceptance gate.
- Independently review the implementation against the spec.
- If anything fails, fix it and rerun the gate.
- Only after all criteria pass, mark the phase complete, commit/push it, then immediately begin the next phase.
- Stop only for a true hard blocker defined in `docs/EXECUTION_PROTOCOL.md`.
- Missing owner-supplied real-world values such as bank details, proprietor legal name, or insurance certificate values should normally remain fail-closed operational configuration items and must not stop unrelated development phases.
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

The report must show each phase, evidence, migrations, tests, security checks, final Git SHA, live Supabase state, Vercel state, and any remaining `OWNER INPUT REQUIRED` items before real launch.
