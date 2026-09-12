# Antigravity — START HERE

You are continuing the existing **Opus Care Support Services** website + CRM governance run.

Repository:

`https://github.com/iamnarace/NDIS_Project`

Autonomous working branch:

`codex/autonomous-governance`

Do not use `main` for autonomous implementation work and do not deploy Vercel Production.

## Read these first, in this order

1. `docs/EXECUTION_PROTOCOL.md`
2. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
3. `docs/ANTIGRAVITY_AUTONOMOUS_FROM_G3.md`
4. `docs/governance/G2_WORKER_READINESS_ROSTER_SAFETY.md`
5. `docs/governance/G3_PRIVACY_DOCUMENTS_HELP_CENTRE.md`

The autonomous handoff document defines the current transfer from Codex to Antigravity.

## Current handoff position

G1 is complete and was pushed by Codex to the autonomous branch.

Codex is finishing G2. Before starting G3, verify that G2 is actually complete, tested, committed and pushed.

If Codex stopped because of token exhaustion before completing G2, preserve the existing G2 work and finish only the outstanding G2 verification/closure work. Do not skip G2 and do not restart it from scratch.

Once G2 passes, continue automatically through:

`G3 → G4 → G5 → G6 → G7 → Final Go-Live Verification`

Do not return for phase-by-phase owner approval.

## No second implementation plan

The phase specifications already contain the implementation requirements.

Do not create another implementation plan, proposal, architecture plan or approval checklist.

Implement the current phase directly, run its acceptance gate, independently self-review it, fix failures, commit/push the verified phase to the autonomous branch, then immediately continue.

## Corrected-test retry rule

After a failing test exposes a real test/application defect and that defect is corrected, rerunning the corrected acceptance test is authorised as part of normal verification.

Do not blindly rerun an unchanged failing command, but do not stop for owner approval merely because a corrected test needs to be executed again.

## Owner-authorised facts

- Business/trading name: **Opus Care Support Services**
- ABN: **41 267 197 576**
- Business structure: **sole trader**
- GST status: **not registered for GST**
- Current NDIS provider status: **unregistered**
- Current direct participant funding scope: **Self-Managed and Plan-Managed**
- Current launch participant scope: **Adults 18+**
- Bank/remittance details: pending real owner configuration
- Required insurance: must be real before service delivery; never invent policy details
- Service regions: Northern NSW corridor plus selected Sydney areas including Blacktown, Parramatta, Western Sydney, Sydney CBD and Redfern

Never invent proprietor legal name, address, bank details, insurance, NDIS registration details, payer/provider relationships, participant facts or clinical authority.

## Security incident boundary

The previously exposed application admin credential is compromised.

Never use, print, log, commit or reintroduce it.

Production credential rotation/session invalidation and controlled Production security cutover remain `OWNER INPUT REQUIRED BEFORE LIVE OPERATION` and do not stop unrelated G3–G7 software work.

For local authenticated tests use a fresh ignored local-only credential and the real login flow only.

## First actions

Run:

```powershell
git fetch --prune origin
git ls-remote origin refs/heads/codex/autonomous-governance
git status
git rev-parse HEAD
git rev-parse origin/codex/autonomous-governance
git log --oneline --decorate -15
```

Safely reconcile with `origin/codex/autonomous-governance` without discarding verified local work.

Then execute `docs/ANTIGRAVITY_AUTONOMOUS_FROM_G3.md`.

## Final response

Do not send intermediate phase review requests.

Return only one final:

`OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT`

after the executable roadmap and final independent audit are complete, or one true blocker report if safe software continuation is genuinely impossible.