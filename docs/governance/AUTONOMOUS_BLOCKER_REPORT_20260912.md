# Opus Care autonomous governance blocker report — 2026-09-12

> Superseded later on 2026-09-12 by the secure Playwright acceptance and
> `G1_REVIEW_CLOSURE_REPORT_20260912.md`. Retained as an accurate record of the
> earlier environment limitation and its resolution path.

## Status

G1 software implementation and database acceptance advanced materially, but the mandatory authenticated browser lifecycle, reload/persistence, and responsive gate could not be completed. G1 is therefore **not marked complete**, no G1 commit was made, and G2 through Final were not started.

## Preserved repository state

- Checkout: `C:\Users\NareshAdmin\Documents\NDIS_Project`
- Branch: `codex/autonomous-governance`, tracking `origin/codex/autonomous-governance`
- Remote `main` and autonomous branch baseline: `60ae7d0bc9db309b99de06d5ab26aa61335ae9c0`
- All pre-existing G1 changes were preserved. No reset, clean, discard, merge to main, or Production deployment occurred.

## Completed G1 closure work

- Removed built-in/browser administrator credential literals and raw credential API-header reuse.
- Added timing-safe shared-secret comparison and stable server-derived G1 audit actor identity.
- Removed invented participant/referral funding, location, service, schedule, age, transport, and roster-ready defaults.
- Added explicit server validation for referral funding, requested services, location, privacy acknowledgement, and participant/nominee consent.
- Removed direct referral `accepted` status changes outside governed conversion.
- Restricted participant PATCH from changing funding, lifecycle, status, assessment linkage, or rosterability.
- Added authenticated internal service catalogue selection while retaining the public sanitized response.
- Added structured contracting-provider relationship API and verified-record selection for NDIA-managed intake; free text remains enquiry context only.
- Added calendar-date age validation and dynamic medication, mealtime, manual handling, seizure, transport, clinical, and behaviour requirements.
- Made conversion and checklist/signoff transitions transactional and fail closed.
- Added latest-assessment validation, canonical checklist validation, server-owned checklist-item mutation, stale-write rejection, and idempotent duplicate conversion.
- Added a unique one-participant-per-referral index and validated lifecycle/outcome/billing/funding constraints.

## Live Supabase state

- Existing applied migrations verified and not reapplied:
  - `20260912120000 governance_g1_review_closure`
  - `20260912130000 governance_g1_rpc_access_closure`
- Newly applied additive migrations:
  - connector version `20260912045818 governance_g1_atomic_acceptance_closure`; canonical repository SQL is `20260912140000_governance_g1_atomic_acceptance_closure.sql`
  - connector version `20260912051130 governance_g1_remove_invented_defaults`; canonical repository SQL is `20260912150000_governance_g1_remove_invented_defaults.sql`
- Connector-assigned versions were preserved. Matching local marker files document live history without rewriting it.
- G1 RPC EXECUTE matrix verified: anon=false, authenticated=false, service_role=true.
- Direct RLS transaction matrix verified: anon has no table privilege; participant and assigned worker see no raw assessment/checklist rows; synthetic transaction-only admin and service_role can read them.
- Real transaction fault injection passed for checklist insertion, referral update, audit insertion, and readiness signoff. Each forced failure rolled back all preceding writes.
- Repeat conversion returned the existing participant/checklist and created no duplicate.
- All disposable RLS and fault-injection records were inside transactions ending in `ROLLBACK`.

## Quality gate

- `npm test`: 34 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with no warnings or errors; Next lint deprecation notice only.
- `npm run build`: passed; 72 pages generated.
- `git diff --check`: passed.
- Fresh high-entropy local credential was stored only in ignored `.env.local` and never printed or committed.
- Final `.next/static` scan confirmed the temporary credential is absent from client assets.

## Blocking acceptance item

The normal local admin login endpoint passed through an HTTP cookie session test, but the in-app browser clipboard is isolated from the OS clipboard and its file chooser did not attach the ignored local credential file. Automatic approval review also rejected a proposed loopback session-cookie transfer because it would bypass the normal browser login flow. Therefore authenticated browser evidence for:

- full referral → suitability → Start Onboarding → checklist → signoff lifecycle;
- reload/persistence; and
- responsive layouts

remains unavailable in this run. Source/API/database/build evidence cannot substitute for that explicit browser gate.

## Deployment and owner-input boundary

- No commit or push was made because G1's required browser gate did not pass.
- Vercel Production was not changed or deployed.
- The compromised production admin credential was never used, printed, logged, committed, or reintroduced.
- Production credential rotation, session invalidation, old-credential rejection, controlled Production cutover, and post-deploy bundle verification remain **OWNER INPUT REQUIRED BEFORE LIVE OPERATION**.
