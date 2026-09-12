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
5. `docs/CODEX_BROWSER_ACCEPTANCE.md`
6. `docs/governance/G1_REVIEW_CLOSURE_AUTONOMOUS.md`
7. `docs/governance/G1_REVIEW_CLOSURE.md`

## Known live database state

Do not reapply already-applied migrations.

Known applied G1 closure migrations include:

- `20260912120000_governance_g1_review_closure.sql`
- `20260912130000_governance_g1_rpc_access_closure.sql`

The latest blocker report also records additional additive G1 acceptance migrations. Verify the actual live migration table and local marker files before any migration action. Do not rewrite historical migration versions merely to make labels look cleaner.

The RPC access closure must retain:

- anon EXECUTE: false
- authenticated EXECUTE: false
- service_role EXECUTE: true

for the protected G1 SECURITY DEFINER functions.

## Credential incident

Follow `docs/CODEX_SECURITY_RECOVERY.md`.

Do not use or report the exposed credential.

Production rotation/session invalidation remains `OWNER INPUT REQUIRED BEFORE LIVE OPERATION` and must not block unrelated software phases.

For local authenticated browser acceptance, do **not** depend on the in-app browser clipboard or file chooser.

Use the secure automated browser harness defined in:

`docs/CODEX_BROWSER_ACCEPTANCE.md`

Generate a fresh high-entropy local-only credential, provide it only through server-side ignored runtime configuration and the local e2e test process, and exercise the **real application login flow** with Playwright or the repository's existing browser framework.

Do not inject cookies, forge sessions, weaken authentication, expose the credential in client source, or reuse the compromised production credential.

A clipboard/file-chooser limitation is no longer a valid hard blocker once the automated harness can run.

## Branch/push rule

Do not push implementation work to `main` because `main` is coupled to Vercel Production.

Push verified autonomous work only to:

`origin/codex/autonomous-governance`

The remote autonomous branch exists. Fetch its current ref before reconciling local dirty work.

Preserve all existing uncommitted G1 implementation and migration files. Never reset them away to match the remote documentation branch.

## Resume acceptance

Finish all outstanding G1 closure acceptance work, including:

- authenticated local browser lifecycle through the real login UI;
- responsive/reload/persistence verification;
- real transaction rollback/fault-injection coverage;
- complete role/access matrix;
- duplicate/concurrency/bypass review;
- canonical checklist validation;
- structured provider verification;
- manual intake workflow;
- full evidence reconciliation against code/live schema.

The latest blocker report states that 34 tests, typecheck, lint, build, diff check, bundle credential scan, live RLS/RPC matrix, and transaction fault injection passed. Treat those as prior evidence only. Rerun anything affected by subsequent browser/e2e or source changes before final acceptance.

Then:

- run full test/typecheck/lint/build;
- run secret/bundle scan;
- perform an independent self-review;
- update G1 evidence accurately;
- commit verified G1 closure;
- push only to the autonomous branch;
- mark G1 software gate complete while recording production credential remediation as owner input;
- immediately continue G2 through Final according to the autonomous runbook.

Do not return for ordinary phase approval.
