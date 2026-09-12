# Governance G1 Review Closure — Autonomous Codex Gate

This wrapper exists because `G1_REVIEW_CLOSURE.md` was originally written for supervised phase-by-phase review.

## Autonomous instruction

Read and execute every technical requirement and verification criterion in:

`docs/governance/G1_REVIEW_CLOSURE.md`

Also read and obey:

`docs/CODEX_SECURITY_RECOVERY.md`

The owner has authorised continuous autonomous execution.

## Current known security incident

The old application administrator shared password was exposed in public source/browser output and is treated as compromised.

The local implementation has removed browser literals/fallbacks, but production credential rotation/session invalidation requires owner/platform access.

This production-only remediation does **not** block software acceptance when:

- the exposed credential is not used;
- local authenticated browser verification uses a fresh ignored local-only test credential;
- built browser bundles are scanned and contain no privileged credential;
- production remains explicitly fail-closed / not declared go-live ready;
- the final report records production credential rotation/cutover as `OWNER INPUT REQUIRED BEFORE LIVE OPERATION`.

## G1 software acceptance

1. Implement every G1 review-closure correction.
2. Verify both known G1 closure migrations are already applied before further DB action.
3. Run every required G1 verification gate.
4. Complete authenticated browser lifecycle locally using safe local-only auth configuration if required.
5. Perform a fresh independent self-review against all closure findings.
6. If any software/schema/RLS/transaction/privacy criterion fails, fix it and rerun verification.
7. Do not mark G1 software-complete while a closure finding remains unresolved.
8. When every software criterion passes, record:
   - `G1 SOFTWARE GATE: COMPLETE — AUTONOMOUS SELF-REVIEW PASSED`
   - `PRODUCTION ADMIN CREDENTIAL REMEDIATION: OWNER INPUT REQUIRED BEFORE LIVE OPERATION`
9. Commit the verified closure.
10. Push only to `origin/codex/autonomous-governance`, not `main`.
11. Immediately start `docs/governance/G2_WORKER_READINESS_ROSTER_SAFETY.md`.
12. Do not request owner review between G1 and G2.

All business, security, privacy, fail-closed, migration, testing and no-production-deploy requirements in the original closure remain binding.

A production credential rotation/cutover requirement is a **final launch blocker**, not a blocker to unrelated autonomous software implementation.

Only a true blocker that prevents safe software continuation may stop the autonomous run.