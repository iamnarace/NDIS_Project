# Opus Care Governance — Autonomous Execution Index

This directory contains implementation-ready governance specifications for the owner-authorised continuous Codex run.

Codex must follow:

1. `AGENTS.md`
2. `docs/CODEX_START_HERE.md`
3. `docs/CODEX_AUTONOMOUS_RUNBOOK.md`
4. `docs/EXECUTION_PROTOCOL.md`

Do not generate another implementation plan. Execute, verify, self-review, fix until pass, commit/push, and automatically continue to the next phase.

## Current starting gate

### G1 Review Closure

Original G1 implementation commit:

`627b844`

Current closure specification:

[`G1_REVIEW_CLOSURE.md`](./G1_REVIEW_CLOSURE.md)

G1 must pass the independent closure before worker-governance work begins.

Under autonomous mode, when the closure passes Codex **does not wait for owner review**; it marks the gate complete and immediately starts G2.

## Full autonomous sequence

1. [`G1_REVIEW_CLOSURE.md`](./G1_REVIEW_CLOSURE.md) — correctness/security closure of Participant Intake & Onboarding
2. [`G2_WORKER_READINESS_ROSTER_SAFETY.md`](./G2_WORKER_READINESS_ROSTER_SAFETY.md) — worker readiness, screening, credentials, competency, roster hard gates
3. [`G3_PRIVACY_DOCUMENTS_HELP_CENTRE.md`](./G3_PRIVACY_DOCUMENTS_HELP_CENTRE.md) — privacy, consent, controlled participant documents, Help Centre
4. [`G4_COMPLAINTS_INCIDENTS_SAFEGUARDING.md`](./G4_COMPLAINTS_INCIDENTS_SAFEGUARDING.md) — complaints, incidents, safeguarding, corrective actions
5. [`G5_WHS_TRANSPORT_CONTINUITY.md`](./G5_WHS_TRANSPORT_CONTINUITY.md) — WHS/home safety, lone worker, transport, participant property, continuity
6. [`G6_CLINICAL_HIGH_INTENSITY.md`](./G6_CLINICAL_HIGH_INTENSITY.md) — Community Nursing/high-intensity clinical governance
7. [`G7_WEBSITE_PUBLIC_LAUNCH.md`](./G7_WEBSITE_PUBLIC_LAUNCH.md) — website/referral/public-resource launch compliance
8. [`FINAL_GO_LIVE_VERIFICATION.md`](./FINAL_GO_LIVE_VERIFICATION.md) — independent end-to-end audit and final readiness classification

## Completed foundation before this run

- Phase 0 / 0.1 — billing, tax, documents, organisation safeguards
- G0 — service scope / organisation readiness
- G0.1 — security / fail-closed governance / agreement execution guard
- G0.2 — 2026–27 NDIS catalogue integrity / transport separation
- final direct-access security closure
- initial G1 implementation (`627b844`) pending the independent closure above

## Autonomous phase rule

For every phase:

`IMPLEMENT → TEST → SELF-REVIEW AGAINST EXIT CRITERIA → FIX → RETEST → COMPLETE → COMMIT/PUSH → NEXT PHASE`

No normal owner review is required between phases.

Missing real launch values such as proprietor legal name, bank details or insurance certificates should remain fail-closed and be reported at the end as `OWNER INPUT REQUIRED`, not used as a reason to stop unrelated software phases.

Vercel Production deployment is not authorised by this autonomous run.