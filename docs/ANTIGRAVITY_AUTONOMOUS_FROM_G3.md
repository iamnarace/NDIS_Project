# Antigravity Autonomous Handoff — Resume from G3

The owner has explicitly authorised Antigravity to continue the Opus Care governance roadmap autonomously after Codex completes Governance G2.

This is a continuation of the same autonomous governance run. Do not create another implementation plan and do not return for ordinary phase-by-phase approval.

## Branch

Work only on:

`codex/autonomous-governance`

Do not push or merge autonomous implementation work to `main`.

Do not deploy Vercel Production.

## Starting condition

Preferred handoff condition:

- G1 is already complete and pushed.
- G2 is complete, verified, committed and pushed to `origin/codex/autonomous-governance` by Codex.

Before starting G3, actually verify this from Git and the governance docs.

If G2 is not yet complete because Codex stopped or ran out of tokens, do **not** skip it. Preserve the existing work and finish only the remaining G2 verification/closure work first, then commit/push G2 and continue to G3 automatically.

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

Safely reconcile the local checkout with `origin/codex/autonomous-governance` without discarding verified local work.

Then read in full:

1. `docs/EXECUTION_PROTOCOL.md`
2. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
3. `docs/ANTIGRAVITY_AUTONOMOUS_FROM_G3.md`
4. `docs/governance/G2_WORKER_READINESS_ROSTER_SAFETY.md`
5. `docs/governance/G3_PRIVACY_DOCUMENTS_HELP_CENTRE.md`
6. all later phase specs before executing each corresponding phase.

## G2 handoff verification

Before G3, confirm G2 evidence shows:

- corrected Playwright G2 acceptance passed;
- focused/full G2 tests passed;
- typecheck/lint/build passed;
- `git diff --check` passed;
- worker readiness/competency rules passed;
- NDIS Worker Screening status handling passed;
- roster write guards passed at the real shift/assignment boundary;
- transaction rollback/fault-injection passed;
- direct RLS/role matrix passed;
- disposable fixtures cleaned up;
- temporary local credentials absent from browser bundles;
- live G2 migrations verified;
- G2 committed and pushed only to `codex/autonomous-governance`;
- Vercel Production unchanged.

If any one of these is missing, finish G2 first rather than assuming completion.

## Autonomous sequence after G2

Once G2 is genuinely complete, continue automatically through:

1. G3 — Privacy, Participant Documents & Help Centre
2. G4 — Complaints, Incidents & Safeguarding
3. G5 — WHS, Home Safety, Transport & Continuity
4. G6 — Clinical / High-Intensity Governance
5. G7 — Website & Public Launch Compliance
6. Final Go-Live Verification + independent global audit

## Execution algorithm for every remaining phase

For each phase:

1. Read the entire phase specification.
2. Inspect repository and live Supabase state.
3. Reuse existing architecture; do not create duplicate systems.
4. Implement directly — no second plan.
5. Apply only safe additive/backwards-compatible migrations where needed.
6. Run focused phase tests.
7. Run full `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
8. Run required browser/persistence/responsive checks.
9. Run direct RLS/security/negative-path tests.
10. Perform a fresh independent self-review against every exit criterion and search for bypass routes.
11. Fix anything that fails and rerun the relevant gate.
12. Only when all software criteria pass:
   - update phase evidence/status;
   - update the master roadmap;
   - commit;
   - fetch/reconcile the autonomous branch;
   - push to `origin/codex/autonomous-governance`;
   - immediately start the next phase.

Do not ask the owner for normal phase approval.

## Retry policy for corrected tests

A failing acceptance test may be rerun after the underlying test/application defect is corrected.

Do not blindly repeat the exact same failing command with no change.

After a real correction, rerun the affected test as part of normal verification without asking for another owner authorization each time.

This rule exists to prevent the repeated blocker cycle caused by an overly strict single-retry interpretation.

## Security / owner-input boundary

The previously exposed application admin credential remains compromised.

Do not use, print, log, commit or reintroduce it.

Production credential rotation, session invalidation, rejection of the old credential, controlled Production deployment and post-deployment verification remain:

`OWNER INPUT REQUIRED BEFORE LIVE OPERATION`

These production cutover items do not stop unrelated G3–G7 software implementation.

For local browser acceptance use only a fresh ignored local-only test credential and the real authentication flow. Never inject/forge sessions as a shortcut.

## External real-world configuration

Missing real values such as proprietor legal name, bank/remittance details, insurance policy details, real worker credentials or real participant data should remain fail-closed launch configuration items where required.

Do not fabricate values and do not let those missing values stop unrelated software completion.

## Final response

Do not return G3/G4/G5/G6/G7 approval requests.

Return only after the whole executable roadmap and final independent audit are complete with:

`OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT`

The final report must separately show:

- G1–G7 status and commit evidence;
- final autonomous branch SHA;
- live Supabase migrations/state;
- tests/security/browser evidence;
- Vercel Production unchanged;
- every `OWNER INPUT REQUIRED BEFORE LIVE OPERATION` item.

Stop early only for a genuine blocker that prevents safe software continuation after reasonable corrective work.