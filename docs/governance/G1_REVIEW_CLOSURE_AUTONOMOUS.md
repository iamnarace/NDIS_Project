# Governance G1 Review Closure — Autonomous Codex Gate

This wrapper exists because `G1_REVIEW_CLOSURE.md` was originally written for supervised phase-by-phase review.

## Autonomous instruction

Read and execute **every technical requirement and verification criterion** in:

`docs/governance/G1_REVIEW_CLOSURE.md`

The owner has now authorised continuous autonomous execution.

Therefore, for the Codex autonomous run only, the old final instruction:

`Then STOP. Do not start G2 until this review closure is accepted.`

is superseded by this rule:

1. Implement every G1 review-closure correction.
2. Run every required G1 verification gate.
3. Perform a fresh independent self-review against all closure findings.
4. If any item fails, fix it and rerun verification.
5. Do not mark G1 accepted while any closure finding remains unresolved.
6. When every criterion passes, Codex itself records the closure as `COMPLETE — AUTONOMOUS SELF-REVIEW PASSED`, with evidence in the phase docs/roadmap.
7. Commit and push the verified G1 closure.
8. Immediately start `docs/governance/G2_WORKER_READINESS_ROSTER_SAFETY.md`.
9. Do not request owner review between G1 and G2.

All business, security, privacy, fail-closed, migration, testing and no-production-deploy requirements in the original closure remain fully binding.

Only a hard blocker under `docs/EXECUTION_PROTOCOL.md` may stop the autonomous run.