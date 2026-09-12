# Codex — START HERE: Autonomous Opus Care Governance Run

The owner has authorised Codex to complete the remaining Opus Care governance roadmap continuously without phase-by-phase approval.

Repository: `iamnarace/NDIS_Project`

## Read in this exact order

1. `AGENTS.md`
2. `docs/CODEX_AUTONOMOUS_RUNBOOK.md`
3. `docs/CODEX_SECURITY_RECOVERY.md`
4. `docs/CODEX_AUTONOMOUS_RESUME.md`
5. `docs/EXECUTION_PROTOCOL.md`
6. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
7. current governance phase specification

## Current continuation gate

Resume the preserved local G1 closure implementation and execute:

`docs/governance/G1_REVIEW_CLOSURE_AUTONOMOUS.md`

Do not restart G1 from scratch.

Known live migrations must be verified before any reapplication:

- `20260912120000_governance_g1_review_closure.sql`
- `20260912130000_governance_g1_rpc_access_closure.sql`

## Security incident

A previously exposed application admin shared password is compromised.

Do not use or disclose it.

Follow `docs/CODEX_SECURITY_RECOVERY.md`:

- production rotation/session invalidation/cutover remains owner input before live operation;
- it does not block unrelated software completion;
- local authenticated acceptance may use only a fresh ignored temporary local test credential;
- privileged credentials must never appear in browser/client output.

## Git/deployment isolation

`main` is connected to Vercel Production.

Do not push autonomous implementation work to `main`.

The dedicated branch exists:

`codex/autonomous-governance`

Push verified phase commits only there. Do not merge to main and do not deploy Vercel Production.

## Continuous sequence

After G1 software closure passes, continue automatically through:

G2 → G3 → G4 → G5 → G6 → G7 → Final Go-Live Verification → global independent audit.

No phase-by-phase owner review.

## Required first Git actions

Do not trust cached refs:

```powershell
git remote -v
git fetch --prune origin
git ls-remote origin refs/heads/main
git ls-remote origin refs/heads/codex/autonomous-governance
git status
git log --oneline --decorate -12
```

Preserve existing uncommitted G1 work. Reconcile documentation safely without reset/clean/history rewrite.

## Final response

Do not send normal intermediate approval requests.

Return only after the executable roadmap and independent audit are complete, with one:

`OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT`

The report must distinguish:

- completed software/governance phases;
- live Supabase state;
- autonomous branch final SHA;
- Vercel Production unchanged;
- `OWNER INPUT REQUIRED BEFORE LIVE OPERATION`, including production credential rotation/session invalidation/cutover if still outstanding.