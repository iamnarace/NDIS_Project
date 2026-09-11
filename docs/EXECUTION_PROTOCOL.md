# Opus Care — Agent Execution Protocol

This file defines how Codex, Antigravity, and any future coding agent must execute the Opus Care roadmap.

The goal is to prevent repeated re-planning and repeated owner review when the work is already defined.

---

## 1. Canonical documents

For a normal supervised run, read:

1. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
2. the current phase specification under `docs/governance/`
3. this protocol

For the owner-authorised **Autonomous Full-Roadmap Run**, Codex must read:

1. `docs/CODEX_START_HERE.md`
2. `docs/CODEX_AUTONOMOUS_RUNBOOK.md`
3. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
4. the current phase specification under `docs/governance/`
5. this protocol

The roadmap defines the phase sequence. The phase specification defines implementation scope and exit criteria. The autonomous runbook defines how Codex moves between phases without waiting for the owner.

---

## 2. NO SECOND IMPLEMENTATION PLAN

When a phase is marked `READY TO EXECUTE`, `IN PROGRESS`, `REVIEW HARDENING REQUIRED`, or is the current phase in the autonomous runbook:

**Do not create another implementation plan, proposal, architecture plan, task list, or approval document.**

Do not stop after restating the work. Do not ask the owner to approve the same scope again.

Instead:

1. perform preflight verification;
2. inspect/reuse the existing implementation;
3. implement/fix the phase directly;
4. run the required tests and negative-path checks;
5. independently self-review the result against the phase exit criteria;
6. fix any failed criteria and repeat verification until the gate passes;
7. commit verified work;
8. update the phase specification/roadmap with evidence;
9. follow the applicable phase-boundary mode below.

---

## 3. Execution modes

### A. Supervised mode

Default when the owner has not authorised a continuous run.

At a phase boundary:

`READY → IMPLEMENT → VERIFY → SELF-REVIEW → COMMIT → REPORT → STOP FOR OWNER REVIEW`

### B. Autonomous Full-Roadmap mode

The owner has explicitly authorised Codex to complete the remaining governance roadmap without returning for phase-by-phase review.

When `docs/CODEX_AUTONOMOUS_RUNBOOK.md` says autonomous mode is active:

`CURRENT PHASE → IMPLEMENT → VERIFY → SELF-REVIEW → FIX UNTIL PASS → COMMIT/PUSH → UPDATE DOCS → AUTOMATICALLY START NEXT PHASE`

**Do not stop at normal phase boundaries.**

The owner should receive one final consolidated report only after all executable phases and the final system audit have been completed.

The agent may emit progress internally/logically, but must not require user approval between phases.

---

## 4. Autonomous self-review gate

Before automatically advancing to the next phase, Codex must prove that the current phase satisfies all applicable exit criteria.

The phase gate requires:

- required migrations/schema verified;
- required RLS/access controls verified directly where applicable;
- positive-path workflow tests;
- negative-path/fail-closed workflow tests;
- persistence/reload checks for stateful UI workflows;
- relevant browser/responsive checks;
- `npm test` or the repository's relevant complete test suite;
- `npm run typecheck`;
- `npm run lint`;
- `npm run build`;
- no known critical/high-severity security or data-integrity defect introduced by the phase;
- no fabricated business/legal/clinical/provider facts;
- phase-specific exit criteria all checked one-by-one.

If a criterion fails:

1. do not mark the phase complete;
2. diagnose the failure;
3. fix it within the approved scope;
4. rerun the gate;
5. continue until it passes or meets the hard-blocker definition.

Passing tests alone is not enough if repository inspection shows the implementation contradicts the phase specification.

---

## 5. Repository preflight — remote must actually be fetched

`git status` by itself is not proof that the local repository is current.

At the start of the autonomous run and before every push:

```powershell
git remote -v
git fetch --prune origin
git ls-remote origin refs/heads/main
git rev-parse HEAD
git rev-parse origin/main
git status
git log --oneline --decorate -12
```

Reconcile local and remote history safely.

Never discard verified governance commits with `reset --hard` simply to match remote documentation.

If documentation commits and local implementation commits diverge, preserve both through a safe rebase/merge strategy and verify the resulting tree.

---

## 6. Safe database authority during autonomous mode

The owner authorises Codex to apply **additive, backwards-compatible governance migrations** to the existing live Supabase project when needed to complete the roadmap, provided Codex:

- inspects current live schema/data first;
- preserves historical records;
- avoids destructive data loss;
- uses safe defaults/backfills;
- verifies RLS and data integrity after application;
- reports every live migration in the final report.

A destructive migration is not automatically authorised. Codex must first redesign toward a non-destructive approach where reasonably possible.

Do not silently delete participant, worker, roster, invoice, agreement, incident, complaint, document, training, or audit history.

---

## 7. Deployment authority

### Allowed without further owner review

- local implementation
- tests/builds
- additive/backwards-compatible live Supabase migrations under section 6
- Git commits
- pushes to `origin/main` after each verified phase so the autonomous state is recoverable
- preview deployments if already supported and useful for verification

### Not authorised automatically

- Vercel Production deployment/promotion
- destructive live-data deletion
- fabrication of missing business facts
- external emails/messages to real participants/workers
- real financial transactions
- creation of fake insurance/bank/legal/clinical records

Vercel Production must remain unchanged unless the owner separately authorises production deployment.

---

## 8. External owner-supplied facts must not unnecessarily stop development

Examples:

- proprietor legal name
- final correspondence/business address
- genuine bank/remittance details
- insurer/policy/certificate information
- real worker credential numbers
- real participant information

If these are missing:

- build the configuration/workflow safely;
- keep execution/sending/service activation fail-closed where appropriate;
- mark the final operational readiness item `OWNER INPUT REQUIRED`;
- continue all remaining software/governance phases that do not depend on the missing real-world value.

Do **not** stop the entire autonomous roadmap merely because a real launch credential/value is not yet supplied.

---

## 9. Hard blockers that may stop the autonomous run

Stop only when the blocker prevents safe progress across later phases and cannot be safely deferred, for example:

- repository access or authentication prevents all further work;
- database access required for current and later work is unavailable;
- current live schema materially contradicts the canonical design and any safe migration would cause irreversible data loss;
- authoritative current regulation makes the planned service/workflow unlawful and no compliant in-scope implementation exists;
- a severe security/data-integrity defect cannot be resolved without an owner decision that materially changes business scope;
- required source code is corrupt/unrecoverable.

For a hard blocker:

- preserve all verified completed work;
- commit/push only safe work;
- write a concise `AUTONOMOUS_BLOCKER_REPORT` with evidence and exact owner decision needed;
- stop.

Do not stop for ordinary implementation difficulty, failing tests, documentation drift, or a fixable bug. Fix those.

---

## 10. Read-only means read-only

If the user explicitly switches a task to `READ-ONLY`, do not:

- edit code;
- create/apply migrations;
- update GitHub files;
- commit;
- push;
- deploy.

Only inspect and report.

The current owner authorisation for the full Codex run is implementation authority, not read-only mode.

---

## 11. Security and source-of-truth hierarchy

When documents conflict, use this order:

1. current owner-authorised facts in the canonical roadmap/autonomous runbook;
2. current official Australian/NDIS regulatory evidence where the implementation depends on it;
3. current repository + live database evidence;
4. current phase execution specification;
5. master roadmap;
6. older handoff/history documents.

Historical `CarePoint Support Services` content must never override current Opus Care decisions.

Operational governance must fail closed when authoritative eligibility/readiness data cannot be read.

---

## 12. Database, Git, and deployment reporting must remain separate

For every phase record:

### Git/code

- starting SHA
- ending SHA
- commit message
- pushed/not pushed

### Supabase

- migration(s) created
- migration(s) applied live/not applied
- affected schema/data/backfill
- RLS verification

### Vercel

- preview deployed/not deployed
- Production deployed/not deployed

Never say `no production changes` if live Supabase changed.

---

## 13. Final autonomous completion rule

After the last implementation phase, Codex must perform a **fresh end-to-end independent system audit**, not merely trust prior phase reports.

It must:

- compare implementation against every phase specification;
- search for bypass paths, unsafe defaults, stale branding, dummy identity/bank/insurance data, public data leakage, direct-active shortcuts, roster bypasses, clinical/registration boundary bypasses, and billing inconsistencies;
- run end-to-end dummy lifecycle and negative-path tests;
- fix defects found;
- rerun full quality gates;
- update all roadmap/status documents;
- produce one final `OPUS CARE AUTONOMOUS GOVERNANCE COMPLETION REPORT`.

Only then may it stop and return control to the owner.
