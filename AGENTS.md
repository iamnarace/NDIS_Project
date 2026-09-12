# AGENTS.md — Opus Care Autonomous Governance Execution

This repository is under an owner-authorised continuous Codex governance run.

## Mandatory entrypoint

Before changing code, read:

1. `docs/CODEX_START_HERE.md`
2. `docs/CODEX_AUTONOMOUS_RUNBOOK.md`
3. `docs/CODEX_SECURITY_RECOVERY.md`
4. `docs/CODEX_AUTONOMOUS_RESUME.md`
5. `docs/EXECUTION_PROTOCOL.md`
6. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
7. the current phase specification under `docs/governance/`

## Current start point

Resume the preserved local G1 closure work and execute:

`docs/governance/G1_REVIEW_CLOSURE_AUTONOMOUS.md`

Then automatically continue through G2, G3, G4, G5, G6, G7 and Final Go-Live Verification.

## Security incident rule

The previously exposed application admin shared password is compromised.

- Never use, print, log or reintroduce it.
- Production rotation/session invalidation remains `OWNER INPUT REQUIRED BEFORE LIVE OPERATION`.
- This production-only remediation does not stop unrelated software phases.
- For local authenticated acceptance, use only a fresh high-entropy temporary credential in ignored local runtime configuration and verify it never reaches browser bundles.
- Follow `docs/CODEX_SECURITY_RECOVERY.md`.

## Branch / deployment isolation

`main` is connected to Vercel Production. Do not push autonomous implementation commits to `main` while Production deployment remains unauthorised.

Verified autonomous work must be pushed to:

`origin/codex/autonomous-governance`

The remote branch already exists.

Do not merge it to `main` and do not deploy Vercel Production.

## Critical instructions

- Do not create another implementation plan.
- Do not ask for owner approval at ordinary phase boundaries.
- Implement each phase directly.
- Run the complete acceptance gate.
- Perform an independent self-review after implementation.
- Fix failures and repeat until every software exit criterion passes.
- Commit and push every verified phase to the autonomous branch so progress is recoverable.
- Immediately start the next phase.
- Missing proprietor/bank/insurance/real worker values remain fail-closed owner-input launch items and do not stop unrelated development.
- Safe additive/backwards-compatible live Supabase migrations are authorised.
- Do not send real participant/worker emails, perform financial transactions, or fabricate legal/insurance/clinical/provider facts.

## Remote freshness

`git status` is not enough. Always fetch:

```powershell
git fetch --prune origin
git ls-remote origin refs/heads/main
git ls-remote origin refs/heads/codex/autonomous-governance
git rev-parse HEAD
git rev-parse origin/main
git status
```

Preserve all existing uncommitted G1 closure work.

## Final response

Do not send intermediate phase-review requests.

Return one final `OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT` after the full executable software roadmap and final independent audit are complete, or one true software-blocker report if safe continuation is genuinely impossible.

The final report must separately list any `OWNER INPUT REQUIRED BEFORE LIVE OPERATION`, especially production admin credential rotation/session invalidation and controlled Production cutover.