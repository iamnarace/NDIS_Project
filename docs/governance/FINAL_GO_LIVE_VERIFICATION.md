# Final Phase — Go-Live Verification & Global Independent Audit

> Canonical autonomous completion specification. Execute after G7 passes.

## Status

`STATUS: COMPLETE`

## Objective

Perform a fresh independent end-to-end audit of the entire Opus Care website + CRM after all governance phases, fix defects found, and produce the final operational readiness result.

Do not simply trust prior phase reports.

---

## 1. Global repository/database audit

Inspect current repository and live Supabase from scratch.

Verify actual implementation against:

- G0/G0.1/G0.2 safeguards
- G1 + G1 Review Closure
- G2
- G3
- G4
- G5
- G6
- G7
- master roadmap
- current authorised business facts

Search all current code/content/config for:

- CarePoint stale branding
- `Pty Ltd` fabrication
- dummy/fake ABN
- dummy/fake bank details
- fabricated insurance
- fabricated proprietor identity
- false NDIS registration/approval/endorsement
- blanket GST-free statements
- `TAX INVOICE` while GST not registered
- direct NDIA claiming assumptions
- fake subcontracting/registered-provider relationships
- silent Plan-Managed/Yamba/adult/transport/service defaults
- client-supplied audit actor IDs
- direct-active participant bypasses
- participant readiness bypasses
- worker readiness/credential bypasses
- roster API bypasses
- clinical service activation bypasses
- public internal-data leakage
- broad RLS contrary to UI/API claims
- stale NDIS item/rate constants
- unsafe static fallback used for operational authorisation.

Fix all in-scope defects and rerun verification.

---

## 2. Business readiness panel

Verify current actual configuration states for:

- business name
- ABN
- GST status
- proprietor legal contracting identity
- business/correspondence address
- bank/remittance
- insurance
- current NDIS registration status
- service regions
- active service scope
- current pricing catalogue version

Missing real-world owner values must be clearly marked:

`OWNER INPUT REQUIRED BEFORE LIVE OPERATION`

Do not invent them and do not treat them as software defects if the safe fail-closed workflow exists.

---

## 3. Full dummy participant lifecycle

Create controlled test fixtures and clean them up safely where appropriate.

Exercise:

`Public Referral`
→ `Service Suitability Assessment`
→ `Participant Onboarding`
→ consent/privacy/documents
→ risk/WHS
→ Service Agreement
→ Schedule of Supports
→ participant readiness
→ worker matching/readiness
→ roster
→ shift
→ progress note
→ timesheet/service record
→ invoice
→ payment-status workflow
→ participant review
→ exit/transition.

Verify persistence after reload at critical stages.

Do not send real emails or financial transactions.

---

## 4. Full worker lifecycle

Exercise:

`Worker record/applicant`
→ identity/readiness
→ Worker Screening
→ credentials
→ training
→ competency
→ service eligibility
→ participant-specific competency where applicable
→ shift assignment
→ expiry/revocation
→ future-shift block/review.

Use controlled dummy evidence, clearly marked as test fixture and removed/isolated safely. Never insert fake values into production organisation configuration.

---

## 5. Negative-path matrix

At minimum prove:

### Participant/funding

- no suitability → no onboarding/active rosterability
- under 18 → current launch scope blocks/review
- outside service area → governed outcome
- unknown funding → no silent Plan-Managed
- NDIA-Managed without verified contracting relationship → blocked
- free-text provider name → does not authorise
- registration-required service → blocked/escalated
- conditional clinical service without G6 readiness → blocked
- restrictive-practice indicator → management/regulatory stop

### Worker

- no valid Worker Screening → new shift blocked
- Pending/Interim Bar/Exclusion/Suspension → blocked
- expired critical credential → blocked
- missing required competency → blocked
- transport without required driver/vehicle readiness → blocked
- worker cannot self-verify
- unrelated worker cannot view sensitive data

### Clinical

- no current participant plan → blocked
- no verified clinical authority → blocked
- no participant-specific competency → blocked
- expired plan/competency → blocked
- Participant A competency does not authorise Participant B

### Documents/privacy

- missing proprietor identity → agreement execute/sign/send blocked
- participant cannot access another participant record
- public cannot access private documents/internal governance data
- revoked information-sharing authority is honoured

### Billing

- GST remains uncharged/current wording
- `INVOICE`, not `TAX INVOICE`
- missing bank/remittance blocks external invoice dispatch if required
- stale/future service cannot be invoiced
- historical finalised rates remain unchanged
- payment status is not falsely treated as a payment ledger/reconciliation.

---

## 6. Complaint/incident/WHS continuity dry runs

Exercise controlled workflows for:

- complaint → acknowledgement → investigation → outcome → corrective action → closure
- safeguarding incident → escalation → external-reporting assessment → corrective action
- restrictive-practice concern → management/regulatory stop
- WHS/home risk → control/review
- lone-worker missed checkout → escalation
- emergency/disaster continuity activation/review

Verify audit history and least privilege.

---

## 7. Public website audit

Render/browse all important public routes.

Verify:

- brand/legal/funding claims
- service scope
- service regions
- referral
- contact
- privacy
- complaints
- participant rights/resources
- pricing
- accessibility/responsive/mobile
- navigation
- stale/duplicate forms
- broken links
- success/error states
- metadata/SEO claims.

No Vercel Production promotion is authorised; use local/preview verification only unless separately instructed.

---

## 8. Security/RLS audit

Directly test relevant roles across governance tables/views/APIs:

- anon/public
- participant
- unrelated worker
- assigned worker
- ordinary staff where distinct
- admin/owner
- service role

Look for policy interactions, not just named policy intent.

Verify service-role APIs enforce application auth where needed.

Check sensitive columns and document storage access.

---

## 9. Full quality gates

Run:

```text
npm test
npm run typecheck
npm run lint
npm run build
```

All must pass.

Also run all dedicated governance suites and targeted security/negative-path tests created across phases.

Any failure must be fixed and rerun before completion.

---

## 10. Documentation/status reconciliation

Update:

- `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
- `docs/governance/README.md`
- each phase document status/evidence
- `docs/CODEX_START_HERE.md` current state if needed

Ensure statuses reflect actual implementation, not planned claims.

Mark phases complete only where verified.

---

## 11. Final readiness classification

Return one of:

### `SOFTWARE / GOVERNANCE READY — OWNER INPUT REQUIRED BEFORE LIVE OPERATION`

Use when all software/governance gates pass but genuine launch facts such as legal proprietor name, bank/remittance, insurance or real worker credentials are still missing.

### `GO-LIVE READY — PRODUCTION DEPLOYMENT NOT YET AUTHORISED`

Use when all operational launch configuration is genuinely present/verified, but Vercel Production has not been authorised.

### `BLOCKED`

Use only for a true unresolved safety/regulatory/data-integrity blocker.

Do not claim actual live operational readiness if required real-world configuration is missing.

---

## 12. Final autonomous report

Return one consolidated:

# OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT

Include:

## Executive status
## Final Git SHA / branch / remote sync
## Live Supabase migration state
## Vercel state
## Phase G1 closure result
## Phase G2 result
## Phase G3 result
## Phase G4 result
## Phase G5 result
## Phase G6 result
## Phase G7 result
## End-to-end participant dry run
## Worker dry run
## Negative-path matrix
## RLS/security matrix
## Public website audit
## Full test/typecheck/lint/build results
## Defects found during final independent audit and fixes
## Remaining OWNER INPUT REQUIRED items
## Final readiness classification

Then stop and return control to the owner.
