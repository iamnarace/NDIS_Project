# Final security hardening status

This report records the live policy review performed on 9 September 2026. The
database is authoritative; the classifications below describe the policies
observed before the hardening migration.

| Table | Old policy | Risk | New policy | Who can read | Who can write | Rationale |
| --- | --- | --- | --- | --- | --- | --- |
| `training_courses`, `external_courses` | Public-role admin policies with `true` predicates | Anonymous mutation and unintended catalog access | Admin management; active worker catalog read | Linked workers; admins/server | Admins/server | Catalog access now requires an active worker identity. |
| `training_assignments`, `training_attempts`, `training_completions` | Public-role admin policies with `true` predicates | Organisation-wide training records exposed and mutable | Admin management; worker-owned reads through `staff.id` | Record owner; admins/server | Admins/server | All legacy staff references were converted to UUID foreign keys before policies were enabled. |
| `staff_availability` | Public `ALL` with `true` predicates | Any caller could read or alter the roster inputs | Admin management; worker-owned select/insert/update | Record owner; admins/server | Record owner; admins/server | Workers can maintain only their own availability. |
| `staff_leave` | Public `ALL` with `true` predicates | Sensitive leave information exposed and mutable | Admin management; worker-owned reads and pending requests | Record owner; admins/server | Record owner for pending requests; admins/server | Workers cannot approve leave or access another worker's request. |
| `agreement_records` | Admin policy using `is_opus_admin()` | Portal owners could not read issued agreements | Keep admin policy; add owner/status-limited reads | Linked owner after issue; admins/server | Admins/server | Drafts remain internal and owner identity is UUID-derived. |
| `agreement_signatures` | Public `ALL` with `true` predicates | Signature forgery, edits, and deletion | Admin/server signing; linked owner reads; immutable trigger | Linked issued-agreement owner; admins/server | Insert through admin/server workflow only | Signatures cannot be updated or deleted, and executed agreement content is locked. |
| `incidents` | Broad worker insert and full-row worker read | Client identity spoofing and investigation-note disclosure | Server-validated creation; self-reported row read with safe column grants | Reporting worker; authorised staff/server | Authorised server/admin workflow | Worker, shift, and participant are derived before the server writes. |
| `complaints` | Any authenticated user could insert arbitrary participant links | Participant spoofing and internal investigation exposure | Identity-derived participant submission; own safe status read | Linked participant; authorised staff/server | Authorised server/admin workflow | Participant linkage comes from the profile rather than request data. |
| `corrective_actions` | Every worker could read every action | Internal safeguarding actions exposed | Remove worker-wide read | Authorised staff/server | Authorised staff/server | The legacy `owner` is free text, so it cannot safely establish worker ownership. |
| `audit_events` | Public insert with `true` check | Audit history could be forged | Remove portal insert | Authorised staff/server | Server/RPC | Shift completion writes its audit evidence inside the transaction. |
| `documents` | Staff-only metadata; private bucket had a public-role object policy | Object operations were not tied to staff identity | Owner/category metadata reads; authorised staff object management | Linked owner for allowed categories; staff/server | Authorised staff/server | Paths are metadata only; the bucket remains private and object access is policy-controlled. |
| `progress_note_goals` | Every worker could read and insert every link | Goal and note relationships could be forged | Read through own assigned-shift note; RPC writes | Note owner; authorised staff/server | Shift-completion RPC; admins/server | Goal ownership is validated before the transaction writes. |
| `timesheets`, `timesheet_entries` | Worker-owned reads and direct inserts | Entries could bypass shift completion | Keep owned reads; RPC-only inserts | Record owner; authorised staff/server | Shift-completion RPC; admins/server | Approval remains a separate manager action. |
| `travel_records` | Worker-owned `ALL` | Workers could alter approval fields | Worker-owned read; RPC creation | Record owner; authorised staff/server | Shift-completion RPC; admins/server | Recorded travel remains separate from billing approval. |
| `service_records` | Operational staff policy | No portal-specific defect found | Keep | Authorised staff/server | Authorised staff/server and completion RPC | Worker completion creates a pending, not billing-ready, record. |

Training `staff_id` values were stale display references that no longer matched
the current staff references. The one-time conversion requires an exact,
unambiguous match to the staff name already stored with each assignment, carries
that relationship through attempts, converts all three columns to `uuid`, and
adds foreign keys. Names and display references are not used by any resulting
access policy.
