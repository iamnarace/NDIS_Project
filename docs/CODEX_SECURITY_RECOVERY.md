# Codex Autonomous Security Recovery — Exposed Admin Credential

## Incident status

An application administrator shared password was exposed in committed source and a publicly retrievable production browser bundle. Treat the old credential as **compromised**.

Do not print, copy, log, re-use or reintroduce the exposed value.

The local G1 closure already removes browser literals/built-in fallback. A separate live Supabase migration also closes unintended G1 SECURITY DEFINER RPC EXECUTE grants for anon/authenticated.

## Owner-only production remediation still required

Before real production administration is trusted again, the owner/platform administrator must:

1. rotate the compromised production admin credential in secure platform configuration;
2. invalidate sessions/tokens derived from the old credential;
3. verify the old credential is rejected;
4. deploy the corrected application through a controlled production security cutover.

These are `OWNER INPUT REQUIRED BEFORE LIVE OPERATION` items.

They **do not block unrelated software governance development**.

## Autonomous continuation rule

Codex must continue software completion without using the compromised production credential.

### Local authenticated acceptance

For local/browser acceptance only, Codex may generate a fresh high-entropy **temporary local test credential** and place it only in ignored local runtime configuration/environment.

Rules:

- never commit the temporary credential;
- never print it in reports/logs;
- never place it in client/browser source;
- never set it in Vercel Production;
- use it only to prove server-side admin authentication and G1/G2/etc. browser workflows locally;
- remove/replace the temporary local value when no longer needed;
- verify the built client bundle does not contain it.

A temporary local test credential does **not** count as production rotation.

## Push/deploy decoupling

`main` is connected to Vercel Production. Therefore the autonomous run must NOT push implementation commits to `main` while production deployment remains unauthorised.

Use the dedicated remote branch:

`codex/autonomous-governance`

For each verified phase:

- commit locally;
- fetch/reconcile `origin/main` and `origin/codex/autonomous-governance` safely;
- push the verified phase to `origin/codex/autonomous-governance`;
- do not merge/push to `main`;
- do not deploy Vercel Production.

Preview deployment is not required for progress. Prefer local browser verification unless a phase explicitly needs a safe preview and deployment policy permits it.

## G1 acceptance boundary

G1 may be marked **software-complete** when all code/schema/RLS/transaction/browser acceptance criteria pass using safe local authentication and live database verification, even though production credential rotation remains outstanding.

Record separately:

- `G1 SOFTWARE GATE: COMPLETE`
- `PRODUCTION ADMIN CREDENTIAL REMEDIATION: OWNER INPUT REQUIRED`

Do not falsely mark the entire business `GO-LIVE READY` while the production credential remains compromised/unrotated.

## Final go-live rule

Final Go-Live Verification must fail/hold the production launch gate until evidence exists that:

- production credential rotation is complete;
- old credential/session is invalidated;
- corrected production build is deployed;
- post-deploy secret/bundle scan passes;
- old credential is rejected.

Until then the autonomous run may still complete every software phase and return one consolidated report with the production security cutover listed under `OWNER INPUT REQUIRED BEFORE LIVE OPERATION`.