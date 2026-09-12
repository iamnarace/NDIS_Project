# Opus Care — Codex Autonomous Governance Runbook

## Owner authorisation

The owner has authorised Codex to execute the remaining Opus Care governance roadmap continuously without phase-by-phase review.

Codex must self-review every phase, fix failures, prove the exit criteria, commit/push the verified result to the autonomous branch, and then move automatically to the next phase.

No separate implementation plan is required or wanted.

Read `docs/CODEX_SECURITY_RECOVERY.md` before resuming because a production admin shared credential was exposed and is treated as compromised.

---

## 1. Autonomous sequence

Execute in this order:

1. `docs/governance/G1_REVIEW_CLOSURE_AUTONOMOUS.md`
2. `docs/governance/G2_WORKER_READINESS_ROSTER_SAFETY.md`
3. `docs/governance/G3_PRIVACY_DOCUMENTS_HELP_CENTRE.md`
4. `docs/governance/G4_COMPLAINTS_INCIDENTS_SAFEGUARDING.md`
5. `docs/governance/G5_WHS_TRANSPORT_CONTINUITY.md`
6. `docs/governance/G6_CLINICAL_HIGH_INTENSITY.md`
7. `docs/governance/G7_WEBSITE_PUBLIC_LAUNCH.md`
8. `docs/governance/FINAL_GO_LIVE_VERIFICATION.md`

---

## 2. Branch and deployment policy

`main` is coupled to Vercel Production and Production deployment remains unauthorised.

Therefore autonomous implementation work must use:

`codex/autonomous-governance`

For each phase:

- preserve/reconcile `origin/main` changes;
- commit verified work locally;
- push only to `origin/codex/autonomous-governance`;
- do not push/merge implementation commits to `main`;
- do not deploy Vercel Production.

This branch isolation removes the prior push/deploy coupling as a software-development blocker.

---

## 3. Automatic advancement algorithm

For every phase:

1. Fetch/reconcile current `origin/main` and autonomous branch.
2. Read the complete phase specification.
3. Inspect repository/live database state.
4. Reuse architecture; do not duplicate modules/tables/policies.
5. Implement directly.
6. Apply only safe additive/backwards-compatible Supabase migrations when required.
7. Run phase tests and the full quality gate.
8. Perform a separate independent self-review against every exit criterion.
9. Search for bypasses/regressions tests may miss.
10. If anything fails, fix and repeat verification.
11. When software criteria pass:
    - record concise evidence/status;
    - commit;
    - fetch/reconcile remote refs again;
    - push to `origin/codex/autonomous-governance`;
    - immediately continue to the next phase.

Do not stop for owner review between phases.

---

## 4. Security incident continuation rule

The old application admin shared password is compromised and must not be used.

Production rotation/session invalidation/cutover is a final operational blocker, not a blocker to unrelated software completion.

For local authenticated browser verification Codex may use a fresh high-entropy temporary local-only credential in ignored runtime configuration, provided it is never committed, printed, placed in client code, or deployed.

Built browser output must be scanned to prove the temporary credential is absent.

At each relevant phase report separately:

- software/security implementation gate;
- production credential remediation status.

See `docs/CODEX_SECURITY_RECOVERY.md`.

---

## 5. Self-review standard

After implementation, independently ask:

- Is there another route/button/API/RPC bypass?
- Are client-supplied governance flags trusted anywhere?
- Are audit actors server-derived?
- Can partial multi-table writes create false success?
- Does live RLS match code/report claims?
- Can anon/participant/unrelated worker read sensitive data directly?
- Are defaults inventing facts?
- Are public/internal service registries separated?
- Can restricted/clinical/future services accidentally activate?
- Are participant and worker readiness checked at the real shift-write boundary?
- Do invoice/support-item decisions use governed current data?
- Are historical records preserved?
- Did this phase regress previous safeguards?
- Did a privileged credential enter source, git diff, build output, logs or client assets?

If uncertain, inspect/test before marking complete.

---

## 6. Global quality gate after every phase

Run as applicable:

```text
npm test
npm run typecheck
npm run lint
npm run build
```

Plus:

- migration/schema verification
- direct live RLS/function privilege tests
- negative-path API tests
- state persistence/reload tests
- rendered local browser workflow checks
- responsive checks for changed UI
- transaction rollback/fault-injection where applicable
- concurrency/duplicate-write review where applicable
- secret/dummy-data scan
- built-client credential scan
- stale CarePoint/Pty Ltd/fake ABN/fake bank/fake provider wording search
- current NDIS/regulatory boundary verification where relevant

A phase cannot advance with known software/security gate failures.

---

## 7. Data safety

Do not destroy historical data to make a new gate pass.

Existing participants/workers/shifts/invoices/agreements/incidents/complaints/training records must use safe compatibility states where needed.

Use states such as `legacy_review_required`, `pending_verification`, or `not_yet_assessed` rather than falsely marking records compliant.

---

## 8. External configuration does not stop software completion

The following may remain missing while software phases proceed:

- proprietor legal name
- correspondence/business address
- bank/remittance details
- insurer/policy/certificate details
- real worker credentials
- real participant details
- production admin credential rotation/cutover evidence

Keep dependent external/operational actions fail-closed and mark them `OWNER INPUT REQUIRED BEFORE LIVE OPERATION`.

---

## 9. Regulatory verification

When a phase depends on current Australian/NDIS law or guidance, verify authoritative current sources before encoding the rule.

Prefer NDIS Commission/NDIA, OAIC, SafeWork NSW, Fair Work, Service NSW/SIRA, Ahpra/NMBA, business.gov.au/ATO/ACCC as applicable.

---

## 10. Phase evidence ledger

At each phase append concise evidence:

- starting SHA
- ending SHA
- autonomous branch
- migration(s)
- live Supabase status
- tests/typecheck/lint/build
- RLS/security/transaction checks
- browser/persistence verification
- credential/client-bundle scan where relevant
- deferred owner-input items
- Vercel Production unchanged

---

## 11. Final stop condition

Stop only after either:

### A. Full software-roadmap completion

All executable phases through Final Go-Live Verification and final independent global audit are complete.

Return one `OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT`.

The report may state `SOFTWARE ROADMAP COMPLETE — PRODUCTION GO-LIVE BLOCKED` when owner-only launch items remain, including credential rotation/cutover.

### B. True software blocker

A condition genuinely prevents safe local/software continuation even with the security recovery and branch-isolation rules.

Return one `OPUS CARE AUTONOMOUS BLOCKER REPORT` with all completed work preserved on the autonomous branch.

Do not return ordinary phase review requests.