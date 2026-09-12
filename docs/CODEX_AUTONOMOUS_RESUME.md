# Codex Autonomous Resume After Security Blocker

Resume the existing autonomous run. Do not restart G1 from scratch and do not create a new implementation plan.

## Preserve current local work

The local checkout contains uncommitted G1 review-closure work and applied live migrations. Preserve it exactly unless a verified correction is required.

Do not reset, clean, checkout away, or overwrite the uncommitted implementation.

## Read first

1. `AGENTS.md`
2. `docs/CODEX_START_HERE.md`
3. `docs/CODEX_AUTONOMOUS_RUNBOOK.md`
4. `docs/CODEX_SECURITY_RECOVERY.md`
5. `docs/governance/G1_REVIEW_CLOSURE_AUTONOMOUS.md`
6. `docs/governance/G1_REVIEW_CLOSURE.md`

## Known live database state

Do not reapply already-applied migrations.

Known applied G1 closure migrations include:

- `20260912120000_governance_g1_review_closure.sql`
- `20260912130000_governance_g1_rpc_access_closure.sql`

Verify live state before any further migration action.

The RPC access closure must retain:

- anon EXECUTE: false
- authenticated EXECUTE: false
- service_role EXECUTE: true

for the five protected G1 SECURITY DEFINER functions.

## Credential incident

Follow `docs/CODEX_SECURITY_RECOVERY.md`.

Do not use or report the exposed credential.

Use a fresh ignored local-only test credential if authenticated local browser acceptance needs one. Production rotation remains owner input and must not block unrelated software phases.

## Branch/push rule

Do not push implementation work to `main` because `main` is coupled to Vercel Production.

Push verified autonomous work only to:

`origin/codex/autonomous-governance`

If the branch does not exist locally, create it without losing uncommitted work using a safe Git procedure after fetching its remote ref.

## Resume acceptance

Finish all outstanding G1 closure acceptance work, including:

- authenticated local browser lifecycle;
- responsive/reload/persistence verification;
- real transaction rollback/fault-injection coverage;
- complete role/access matrix;
- duplicate/concurrency/bypass review;
- canonical checklist validation;
- structured provider verification;
- manual intake workflow;
- full evidence reconciliation against code/live schema.

Then:

- run full test/typecheck/lint/build;
- independent self-review;
- commit verified G1 closure;
- push to autonomous branch;
- mark G1 software gate complete while recording production credential remediation as owner input;
- immediately continue G2 through Final according to the autonomous runbook.

Do not return for ordinary phase approval.