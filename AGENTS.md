# AGENTS.md — Opus Care Autonomous Governance Execution

This repository is under an owner-authorised **continuous Codex governance run**.

## Mandatory entrypoint

Before changing code, read:

1. `docs/CODEX_START_HERE.md`
2. `docs/CODEX_AUTONOMOUS_RUNBOOK.md`
3. `docs/EXECUTION_PROTOCOL.md`
4. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
5. the current phase specification under `docs/governance/`

## Current start point

Begin with:

`docs/governance/G1_REVIEW_CLOSURE.md`

Then automatically continue through G2, G3, G4, G5, G6, G7 and Final Go-Live Verification using the phase files listed in `docs/CODEX_AUTONOMOUS_RUNBOOK.md`.

## Critical instructions

- Do not create another implementation plan.
- Do not ask for owner approval at ordinary phase boundaries.
- Implement each phase directly.
- Run the full phase acceptance gate.
- Perform an independent self-review after implementation.
- Fix failures and repeat until every exit criterion passes.
- Commit and push each verified phase to `origin/main` so progress is recoverable.
- Then immediately start the next phase.
- Stop only for a hard blocker defined in `docs/EXECUTION_PROTOCOL.md`.
- Missing real proprietor/bank/insurance/worker credential values should be represented as fail-closed `OWNER INPUT REQUIRED` launch configuration and should not stop unrelated software development.
- Safe additive/backwards-compatible live Supabase migrations are authorised under the execution protocol.
- Vercel Production deployment is **not authorised** without a separate owner instruction.
- Do not send real external participant/worker emails, perform financial transactions, or fabricate legal/insurance/clinical/provider facts.

## Remote freshness

`git status` is not enough. Always actually fetch GitHub before deciding repository state:

```powershell
git fetch --prune origin
git ls-remote origin refs/heads/main
git rev-parse HEAD
git rev-parse origin/main
```

Safely reconcile without discarding verified governance commits.

## Final response

The owner does not want intermediate phase review requests.

Return one final `OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT` after the entire executable roadmap and final independent audit are complete, or one hard-blocker report if safe continuation is genuinely impossible.