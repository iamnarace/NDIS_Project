# Portal access repair and content audit — 9 September 2026

## Verified result

Supabase is reachable. The original narrowed migration had **not applied** when live state was rechecked on 8 September. Eight smaller migrations have since applied successfully, with incremental checks. Their local filenames and SQL now match the recorded live migration history.

Identity is `auth.users.id → profiles.id`, then `profiles.portal_staff_id → staff.id` or `profiles.portal_participant_id → participants.id`. Email and display references do not grant portal access.

## Policies and access

- Own profile SELECT replaces the broader staff profile SELECT; existing administrator management remains.
- Active worker identity resolves through a fixed-caller, security-definer helper with an empty search path.
- Worker assignments and shifts replace allow-all access with own-assignment reads and administrator management.
- Assigned participant and goal reads follow the shift-assignment relationship.
- Participant identity resolves through the active participant profile link. Existing own-goal and active-plan policies remain; own participant and shift reads were added.
- Provider configuration and agreements now require administrator access after direct portal reads were observed during isolation testing.
- Progress notes now require administrator access or the worker's own staff ID and assigned shift. Participants cannot read them.
- Helper functions have no caller-selectable actor ID. No business records were changed by these migrations.

## Application repairs

Corrected the staff column selection, missing goal column, worker goals URL, timesheet response handling, participant shift response/time fields, role-aware login routing, and missing worker logo. Unknown or unlinked identities no longer fall through to the participant dashboard. Shift GET uses authenticated RLS queries with a limited projection. Shift completion derives the worker ID, validates the assignment and supplied goals/incident link, and does not return finance records to workers.

## Verification evidence

| Check | Result |
|---|---|
| Own profile | Own visible; other profile hidden; anonymous denied |
| Worker identity | Own staff record only |
| Worker assignments and shifts | Three own assignments/shifts visible; other worker and unassigned shifts hidden |
| Worker participant context | Assigned participant visible; unrelated participant hidden |
| Participant records | Own participant/goals/active plan/shifts; other participant and staff hidden |
| Internal records | Both roles denied provider configuration and agreements; participant denied progress notes; risk records hidden |
| Browser worker | Signed in as James Wilson on localhost, separate from admin-cookie origin; shifts/timesheets rendered; progress-note form opened |
| Browser participant | Signed in as Liam Davies; dashboard, supports, funding and empty goal/plan states rendered |
| Goals/active plans | Positive ownership tests used transactional fixtures and rolled back; existing browser account has no goals or active support plan |
| Hostile request IDs | Actual shift API ignored another user's supplied IDs and returned only caller-authorised shifts |
| Anonymous APIs | Identity, shifts and timesheets returned 401 |
| Admin regression | Ten existing admin GET routes passed: participants, staff, roster, agreements, goals, plans, risk, incidents, training, service records |
| Browser console/server | No participant console errors in final review; portal requests returned 200. Old deleted sessions produced refresh-token logs; development browser requested missing sw.js |
| Typecheck | Passed |
| Lint | Passed; existing WorkforceRosterTab loadShifts dependency warning remains |
| Build | Passed; 70/70 pages generated |
| Tests | No package test script; dedicated live access checker and transactional RLS assertions used |
| Cleanup | Both rounds of temporary auth users/profiles deleted; transactional fixtures rolled back; business records preserved |

Progress-note form opening and authorization were reviewed; no real shift was completed and no incident was submitted. This is not an end-to-end acceptance of billing or incident mutations.

## Content classification and changes

**A — internal, retained:** Supabase imports/client variables, SQL identifiers, UUID relationships, authentication code, hashing implementation, environment-variable names and server logs. These are implementation references, not display text.

**B — administrator diagnostics:** Settings now labels its system section **System Diagnostics**. Removed hardcoded infrastructure/version claims from ordinary cards; no credentials or connection strings were added.

**C — visible, rewritten:** Supabase/PostgreSQL/Sydney-region cards, AES-256 vault labels, SHA-256 seal text, UUID selection hints and truncated-ID fallbacks, immutable-audit wording, unsupported login/privacy assurances, registered-provider label, stale superannuation percentage, absolute incident compliance and complaint response promises. A shared server error formatter sanitises 186 response fields across 34 route files while retaining details in logs.

The second rendered pass corrected participant verification/plan claims, document availability wording and unsupported portal marketing promises. The estimator is labelled illustrative rather than current NDIS pricing.

Rendered technical-term review covered /, /services, /about, /service-areas, /referral, /contact, /faq, /complaints, /incident-management, /privacy, /documents, /documents/service-agreement, /documents/welcome-pack, portal login/dashboards, worker progress-note form, admin home and Settings. Screenshots were inspected for the worker form, participant support screen, public agreement and admin home. This was not a full visual regression of every operational modal or legacy /staff workflow.

## Remaining security boundaries

This narrowed repair does **not** certify every existing policy. Earlier inspection found other permissive policies in training, availability/leave, agreement signatures and related safeguarding workflows. Those were excluded from the minimum repair, and require separately scoped remediation before treating the whole system as least privilege. Worker incident rows still warrant a safe projection that excludes internal investigation fields. Legacy /staff training authorization and completion/incident mutation workflows need further acceptance. Existing multi-step shift completion is not transactional.

## Wording sources

- [NDIS service agreements](https://www.ndis.gov.au/participants/working-providers/arranging-supports/what-service-agreement)
- [NDIS Commission incident management](https://www.ndiscommission.gov.au/rules-and-standards/reportable-incidents-and-incident-management/incident-management)
- [ATO super guarantee](https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee)

This is a targeted product-content correction, not certification of all legal documents or public claims.

