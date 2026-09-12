# Codex — Secure Local Browser Acceptance Harness

This document resolves the G1 browser-acceptance blocker without exposing, reusing, or bypassing administrator credentials.

## Purpose

The autonomous run must not depend on the in-app browser clipboard or file chooser to transfer a credential.

Use an automated local browser test harness instead.

Preferred approach: **Playwright** (or the repository's existing browser/e2e framework if already present).

The browser test must exercise the real application login flow. Do not inject a session cookie, forge authentication state, bypass middleware, or call internal admin APIs as a substitute for login.

---

## Local-only ephemeral credential rule

For authenticated local acceptance:

1. Generate a fresh high-entropy random test credential in memory or an ignored local environment file.
2. Never print the credential to stdout/stderr, reports, snapshots, traces, screenshots, Git diffs, or chat.
3. Never commit it.
4. Never write it into source code, `NEXT_PUBLIC_*`, client bundles, fixtures, or test snapshots.
5. Start the local Next.js server with the credential available only as a **server-side environment variable** such as `ADMIN_ACCESS_KEY`.
6. Start Playwright from the same parent test process or with a protected environment value so the test script can type the credential into the actual admin login form.
7. The test should obtain the authenticated application session only through the normal login request/UI flow.
8. After the run, terminate the local server/test process and remove any ignored temporary env file if one was created.
9. Rebuild/scan the browser bundle and confirm the ephemeral credential is absent.

Do not reuse the compromised production credential.

---

## Recommended execution pattern

Adapt to repository scripts rather than blindly adding duplicate tooling.

Conceptually:

1. Inspect `package.json` and existing Playwright/e2e configuration.
2. If an existing Playwright setup exists, reuse it.
3. If not, add the smallest maintainable local-only e2e harness needed by the governance acceptance suite.
4. Generate the secret programmatically using a cryptographically secure random source.
5. Spawn the local application server with server-only environment values.
6. Wait for a health/login endpoint to become ready.
7. Launch browser automation.
8. Navigate to the real admin login page.
9. Fill the credential into the real password/access-key field.
10. Submit normally.
11. Verify an authenticated admin page loads.
12. Exercise the complete G1 lifecycle required by `G1_REVIEW_CLOSURE.md`.
13. Reload pages to prove persistence.
14. Run required viewport/responsive checks.
15. Log out if the application provides logout and verify protected admin access is lost.
16. Stop the server.
17. Run browser-bundle credential scan.

The test harness may receive the ephemeral credential from `process.env`, but browser/client application code must never receive it except as the value typed into the actual login form by the automation runtime.

---

## G1 browser acceptance requirements

At minimum automate and verify:

- unauthenticated `/admin` access cannot reach protected admin functionality;
- real login flow succeeds with the fresh local-only test credential;
- referral intake contains no invented Plan-Managed/Yamba/adult/service/transport defaults;
- suitability assessment uses the authenticated internal service catalogue;
- restricted/registration-required/conditional clinical selections produce the governed outcomes;
- suitable referral exposes explicit `Start Onboarding` rather than silently converting;
- governed onboarding conversion persists after reload;
- dynamic checklist requirements persist after reload;
- non-waivable requirements cannot be waived;
- allowed waiver requires a reason;
- final readiness signoff is blocked while required items remain incomplete;
- after canonical readiness passes, participant-side roster eligibility persists after reload;
- non-ready participant is rejected by actual shift-creation boundary;
- historical shift visibility is preserved;
- manual Add Participant cannot bypass suitability/governance;
- relevant UI remains usable at desktop and at least one narrow/mobile viewport used for admin responsive verification;
- logout/session-end behavior is checked where supported.

Use deterministic disposable test fixtures and clean them up through supported test/admin/database mechanisms. Never alter real participant/worker records for browser acceptance.

---

## Evidence

Capture evidence without secrets:

- test names and pass/fail result;
- routes/workflows exercised;
- viewport sizes;
- reload/persistence assertions;
- fixture IDs/reference numbers only if non-sensitive test fixtures;
- local server/build SHA;
- confirmation that credential scan found no match.

Do not preserve screenshots/traces that contain the credential field value. Configure tracing/video/screenshot policy accordingly or redact/remove sensitive artifacts before retaining evidence.

---

## Failure handling

A clipboard/file-chooser limitation is **not** a hard blocker once this harness is available.

If the browser harness itself fails because of application behavior, treat that as a real software/test failure and fix it.

If Playwright/browser binaries are unavailable, install/use the repository-supported local browser tooling if authorised and safe. Do not weaken authentication to make the test easier.

If a genuine environment limitation still prevents any real browser automation after reasonable supported setup, record exact evidence and continue only if the phase specification explicitly permits equivalent acceptance. G1 currently requires real authenticated browser acceptance, so do not self-accept G1 without it.
