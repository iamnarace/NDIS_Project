# Governance G4 — Complaints, Incidents & Safeguarding

> Canonical autonomous execution specification. Implement directly after G3 passes.

## Status

`COMPLETE` — Verified 2026-09-12. Migrations applied to live Supabase (wqykzdodzcfwpgitnisx) with schema version 20260912210000. 77/77 automated test assertions pass. Typecheck, lint, and build (83 static pages) pass with zero warnings/errors. Git diff whitespace clean. Live database triggers enforce closure guards, restrictive practice boundaries, and anti-deletion immutability. Vercel production unchanged.

## Objective

Bring existing complaints, incidents and safeguarding workflows into one accurate governance model for an unregistered Opus Care provider, with strong internal controls and correct external-reporting boundaries.

## 1. Reuse existing modules

Inspect and extend existing:

- complaints
- incidents/safeguarding
- participant/staff records
- corrective actions/tasks if present
- documents/policies
- audit events
- notifications

Do not create duplicate complaint/incident systems.

## 2. Complaints governance

Support at least:

- complainant details or anonymous option where practical
- participant/representative/worker/other source
- issue category
- accessibility/communication needs
- advocate/support person
- acknowledgement
- risk/urgency triage
- assigned owner
- investigation/actions
- outcome
- response date
- review/appeal/escalation
- closure
- improvement/corrective action linkage

Participants must be able to complain without retaliation language or workflow pressure.

Public website/participant resources should clearly explain internal complaint options and external escalation avenues accurately.

## 3. Incident model

Support factual incident capture including:

- date/time/location
- participant(s)/worker(s) involved
- incident category
- injury/medical response
- immediate safety action
- witnesses
- police/ambulance/emergency involvement
- safeguarding indicators
- manager review
- external notification assessment
- follow-up/corrective action
- closure/review

Do not turn incident notes into clinical diagnosis.

## 4. Registered-provider reporting boundary

Opus Care is currently unregistered.

Implementation must distinguish:

- Opus internal incident management
- NDIS Code of Conduct obligations
- police/emergency reporting where applicable
- SafeWork/WHS notification where applicable
- child protection only if future child-service scope becomes relevant
- registered-provider NDIS Commission reportable-incident workflow
- genuine subcontracting/registered-provider notification responsibilities where an actual relationship exists

Do not state that every Opus incident must be reported through the registered-provider NDIS Commission portal.

Where the system cannot determine an external reporting duty automatically, use `Management / External Reporting Assessment Required` rather than fabricate certainty.

## 5. Safeguarding

Create/reuse structured safeguarding indicators for concerns such as:

- abuse
- neglect
- exploitation
- violence
- sexual misconduct
- financial abuse
- coercion
- unsafe environment
- missing participant / welfare concern
- unexplained injury
- worker conduct concern
- restrictive-practice concern

High-risk indicators must escalate visibly and fail closed against ordinary closure until authorised management review occurs.

## 6. Restrictive-practice boundary

Opus Care must not create a workflow that authorises regulated restrictive practices while unregistered.

If indicated:

- flag management/regulatory review;
- record existing Behaviour Support Plan/reference factually if supplied;
- do not let staff create/approve restrictive-practice authority;
- block any automatic progression suggesting Opus may implement the practice.

## 7. Corrective actions / continuous improvement

Link complaint/incident findings to corrective actions where appropriate:

- action
- owner
- due date
- status
- evidence
- review result

Preserve traceability from issue → action → closure.

## 8. Access control and privacy

Use least privilege.

- public: complaint submission only if implemented; no case data
- participant: own complaint status/safe communications where supported; no internal staff investigation notes unless designed for release
- worker: only assigned/required operational incident access; no unrelated case access
- admin/safeguarding management: governed management access
- service role: trusted server operations

Direct RLS tests required.

## 9. Audit and immutability

Audit:

- complaint/incident creation
- risk escalation
- status/outcome change
- external-reporting assessment
- evidence/document linkage
- corrective action
- closure/reopen

Do not permit silent deletion of closed governance records. If deletion is legally/operationally required, use controlled archival/redaction patterns with audit evidence.

Server-derived actors only.

## 10. Notifications

Use internal/admin notifications for urgent safeguarding or overdue actions where existing infrastructure supports it.

Do not automatically send external regulator reports/emails without explicit configured workflow and genuine destination/authority.

## 11. Tests

At minimum verify:

- anonymous complaint accepted where enabled without exposing identity
- complaint can record advocate/support person
- urgent safeguarding indicator escalates
- ordinary staff cannot close critical safeguarding issue without authorised role
- participant/unrelated worker cannot access unrelated case data
- restrictive-practice indicator produces management/regulatory stop
- no generic rule falsely marks every incident as Commission-reportable
- external reporting assessment is separately recorded
- corrective action remains linked through closure
- closed record remains historically traceable
- audit actor server-derived
- negative direct-Supabase access blocked

Run full repository quality gate.

## G4 exit criteria

- existing complaint/incident modules are aligned rather than duplicated;
- internal vs external/registration-specific obligations are distinguished;
- safeguarding escalation works;
- restrictive-practice boundary is safe;
- corrective-action linkage exists;
- least-privilege RLS passes;
- records/audit history cannot be silently lost;
- public/participant guidance is accurate;
- all tests/typecheck/lint/build pass;
- committed/pushed;
- Vercel Production unchanged.

When complete, automatically start G5.