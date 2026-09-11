# Opus Care — Codex Autonomous Governance Runbook

## Owner authorisation

The owner has authorised Codex to execute the remaining Opus Care governance roadmap continuously without phase-by-phase review.

Codex must self-review every phase, fix failures, prove the exit criteria, commit/push the verified result, and then move automatically to the next phase.

No separate implementation plan is required or wanted.

---

## 1. Autonomous sequence

Execute in this order:

### Gate 1 — G1 Review Closure

Autonomous specification:

`docs/governance/G1_REVIEW_CLOSURE_AUTONOMOUS.md`

This wrapper requires all technical work in `docs/governance/G1_REVIEW_CLOSURE.md` and overrides only its old supervised STOP instruction.

### Phase G2 — Worker Readiness & Roster Safety

Specification:

`docs/governance/G2_WORKER_READINESS_ROSTER_SAFETY.md`

### Phase G3 — Privacy, Participant Documents & Help Centre

Specification:

`docs/governance/G3_PRIVACY_DOCUMENTS_HELP_CENTRE.md`

### Phase G4 — Complaints, Incidents & Safeguarding

Specification:

`docs/governance/G4_COMPLAINTS_INCIDENTS_SAFEGUARDING.md`

### Phase G5 — WHS, Home Safety, Transport & Continuity

Specification:

`docs/governance/G5_WHS_TRANSPORT_CONTINUITY.md`

### Phase G6 — Clinical / High-Intensity Governance

Specification:

`docs/governance/G6_CLINICAL_HIGH_INTENSITY.md`

### Phase G7 — Website & Public Launch Compliance

Specification:

`docs/governance/G7_WEBSITE_PUBLIC_LAUNCH.md`

### Final Phase — Go-Live Verification & Global Independent Audit

Specification:

`docs/governance/FINAL_GO_LIVE_VERIFICATION.md`

---

## 2. Automatic advancement algorithm

For every phase:

1. Fetch/reconcile current `origin/main`.
2. Read the entire phase specification.
3. Inspect current repository/live database state.
4. Reuse existing architecture; do not duplicate modules/tables/policies.
5. Implement the phase directly.
6. Apply safe additive/backwards-compatible Supabase migration(s) if needed.
7. Run phase tests and full quality gates.
8. Run a separate self-review against every listed exit criterion.
9. Search for bypasses and regression paths that tests may have missed.
10. If any criterion fails, fix it and repeat steps 6–9.
11. When all criteria pass:
    - update the phase spec status to `COMPLETE` with concise evidence;
    - update the master roadmap phase status;
    - commit;
    - fetch/reconcile remote again;
    - push the verified phase to `origin/main`;
    - immediately continue to the next phase.

Do not stop for owner review between phases.

---

## 3. Self-review standard

The implementing pass and the review pass must be treated as separate mental tasks.

After implementation, perform a fresh review asking:

- Is there another route/button/API/RPC that bypasses the new control?
- Are client-supplied governance flags trusted anywhere?
- Are audit actors server-derived?
- Can a partial multi-table write produce false success?
- Does RLS match application-level claims?
- Can anon/participant/unrelated worker read sensitive fields directly?
- Are default values inventing participant/business facts?
- Do public and internal service catalogues remain separated?
- Are restricted/clinical/future services impossible to accidentally activate?
- Are worker/participant readiness gates checked server-side at the actual shift creation boundary?
- Are final invoice/support-item decisions using current governed data rather than stale constants?
- Are historical records preserved?
- Did any phase accidentally regress G0/G1 safeguards?

If the answer is uncertain, inspect and test before marking complete.

---

## 4. Required global quality gate after every phase

Run all that are applicable:

```text
npm test
npm run typecheck
npm run lint
npm run build
```

Plus:

- migration/schema verification
- direct RLS tests
- negative-path API tests
- state persistence/reload tests
- rendered browser workflow checks
- responsive checks for changed UI
- secret/dummy-data scan
- stale CarePoint/Pty Ltd/fake ABN/fake bank/fake provider wording search
- current NDIS registration/service-boundary search where relevant

A phase cannot advance with known failing quality gates.

---

## 5. Data safety

Do not destroy historical data to make a new gate pass.

Existing participants/workers/shifts/invoices/agreements/incidents/complaints/training records must be migrated using safe compatibility states where required.

If old records cannot be automatically proven compliant, use a state such as:

- `legacy_review_required`
- `pending_verification`
- `not_yet_assessed`

rather than falsely marking them ready/compliant.

---

## 6. External configuration does not stop software completion

These may still be missing during the autonomous run:

- proprietor legal name
- real correspondence/business address
- real bank/remittance details
- insurer/policy/certificate details
- real worker credential numbers
- real participant details

Build and test the configuration/workflow around them.

Where a real value is mandatory to execute an external/legal/operational action, keep that action fail-closed and mark the final report:

`OWNER INPUT REQUIRED BEFORE LIVE OPERATION`

Continue the remaining software phases.

---

## 7. Regulatory verification rule

When implementation depends on a current NDIS/Australian legal or regulatory assertion, verify it using current authoritative sources before encoding the rule.

Prefer:

- NDIS Quality and Safeguards Commission
- NDIS / NDIA pricing/support catalogue
- OAIC
- SafeWork NSW
- Fair Work Ombudsman
- Service NSW / SIRA
- Ahpra/NMBA
- business.gov.au / ATO / ACCC as applicable

Do not copy competitor legal text or treat competitor software behaviour as law.

---

## 8. Phase completion evidence ledger

At the end of each phase, append concise evidence to the phase document:

- starting SHA
- ending SHA
- migration(s)
- live Supabase applied/not applied
- test counts/results
- typecheck/lint/build results
- RLS/security verification
- browser/persistence verification
- known deferred items
- Vercel Production unchanged

This ledger is for recovery/audit, not owner approval.

---

## 9. Final stop condition

Codex stops only after either:

### A. Successful full completion

All executable phases through Final Go-Live Verification pass their gates and the final independent audit is complete.

Return one consolidated:

`OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT`

or:

### B. True hard blocker

A blocker under `docs/EXECUTION_PROTOCOL.md` prevents safe continuation.

Return one:

`OPUS CARE AUTONOMOUS BLOCKER REPORT`

with completed phases preserved and pushed.

Do not return ordinary phase review requests.
