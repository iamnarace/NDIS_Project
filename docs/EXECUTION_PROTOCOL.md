# Opus Care — Agent Execution Protocol

This file defines **how Antigravity and any future coding agent must execute the Opus Care roadmap**.

It exists specifically to prevent the repeated cycle of:

`Roadmap already approved` → `Agent creates another implementation plan` → `User has to approve the same work again`.

## 1. Canonical documents

Read these in order at the start of every session:

1. `docs/ANTIGRAVITY_START_HERE.md`
2. `docs/OPUS_CARE_GOVERNANCE_ROADMAP.md`
3. the current phase execution specification referenced by the roadmap, for example `docs/governance/G1_PARTICIPANT_INTAKE_ONBOARDING.md`

The roadmap defines **what phase is current**. The phase specification defines **exact implementation scope, constraints, tests and exit criteria**.

## 2. NO SECOND IMPLEMENTATION PLAN

When the roadmap marks a phase as `READY TO EXECUTE` or `IN PROGRESS`, and a detailed phase specification exists:

**DO NOT create another implementation plan, proposal, architecture plan, task list or approval document.**

Do not stop after restating the phase.

Do not ask the user to approve the same implementation scope again.

Do not create files such as:

- `IMPLEMENTATION_PLAN.md`
- `PROPOSAL.md`
- `G1_PLAN.md`
- duplicated phase-planning documents

unless the user explicitly asks for a new plan.

Instead:

1. perform the required preflight verification;
2. reconcile repository/live database evidence with the phase specification;
3. execute the phase directly;
4. run all required tests and negative-path checks;
5. commit verified work locally;
6. update the phase specification and master roadmap with actual results/status;
7. return an **Implementation Report**, not another plan;
8. stop at the phase boundary for review.

## 3. Allowed preflight

A short preflight is allowed and should normally be executed rather than merely described:

- `git status`
- branch / HEAD / recent history
- compare local state with `origin/main`
- inspect applicable migrations and live Supabase state
- inspect existing schema/components/APIs to avoid duplication
- confirm the prior phase gate has passed
- confirm no unexpected destructive conflict exists

A preflight is **not** a new implementation plan.

## 4. When the agent MUST stop instead of executing

Stop and report the blocker only when one of these is true:

- the current phase gate has not passed;
- repository/database evidence materially contradicts the canonical phase specification;
- required implementation would destroy or irreversibly rewrite existing production data beyond the approved migration scope;
- a required legal/business fact is missing and cannot safely remain a controlled pending configuration;
- current official regulatory evidence materially changes what Opus may lawfully offer or how the feature must work;
- a required credential/secret/external account is unavailable and there is no safe local implementation path;
- Vercel Production deployment or another separately protected external action would be required without approval;
- the user explicitly requested read-only mode.

When blocked, return a concise **Blocker Report**. Do not invent a workaround that weakens governance.

## 5. Read-only means read-only

If the user or current gate says `READ-ONLY`, do not:

- edit code;
- create migration files;
- apply migrations;
- update GitHub files;
- commit;
- push;
- deploy.

Only inspect and report.

## 6. Repository reconciliation rule

GitHub documentation may be updated remotely while verified governance commits exist only in the local repository.

Before pushing:

- fetch `origin/main`;
- inspect divergence;
- preserve all verified local commits;
- safely rebase/merge documentation changes;
- never reset away verified local governance work;
- verify clean history and working tree before push.

## 7. Database versus deployment reporting

Always report these separately:

### Git/code

- local changes
- commit SHA
- pushed/not pushed

### Supabase

- migration created
- migration applied to live Supabase or not
- data/schema affected

### Vercel

- preview deployed or not
- production deployed or not

Do not say `no production changes` when the live Supabase schema/data was changed.

## 8. Implementation quality gates

Unless the phase specification says otherwise, complete:

- relevant automated tests
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- migration/schema verification
- RLS/security verification
- negative-path workflow tests
- persistence/reload tests where UI data is involved
- responsive/browser checks where UI changed
- git diff review
- secret/dummy-data scan where relevant

Do not claim completion until evidence passes.

## 9. Source-of-truth hierarchy

When documents conflict, use this order:

1. current owner-authorised facts explicitly recorded in the canonical roadmap;
2. current official regulatory/legal source evidence;
3. current repository + live database evidence;
4. current phase execution specification;
5. master roadmap;
6. older handoff/history documents.

Historical `CarePoint Support Services` content must not override current Opus Care decisions.

## 10. Phase boundary workflow

For each phase:

`READY TO EXECUTE`
→ agent executes directly
→ tests and evidence
→ local commit
→ phase document updated with result
→ roadmap status updated to `COMPLETE` or `BLOCKED`
→ stop for review
→ next phase is not started until its gate/status allows it.

The user should not have to reconstruct implementation instructions from chat history. The GitHub roadmap + current phase specification must contain enough detail for an agent to continue directly.