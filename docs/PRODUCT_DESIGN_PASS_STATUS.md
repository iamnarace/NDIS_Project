# Opus Care product design pass — implementation checkpoint

Date: 8 September 2026

Status: **Incomplete — implementation validated locally; full visual and workflow acceptance blocked.**

## Baseline and scope

- Checkout: `C:\Users\NareshAdmin\Documents\NDIS_Project`.
- Branch: `main`; clean baseline `30358db`.
- Next.js 15.5.21, React 19, installed Geist and Lucide retained.
- Changes are limited to product presentation, accessible controls, dialog interaction, and visible loading/error feedback. No dependency, framework configuration, API, schema, RLS, migration, or deployment changes.

## Implemented

- Scoped product stylesheet and admin/portal layouts: semantic surfaces, borders, text, action and status colours; spacing, radius and elevation scales; Geist typography; reduced-motion support.
- Admin shell: flatter full-width workspace, grouped navigation, selected-page semantics, named search, skip link, consistent action controls and responsive navigation.
- Dashboard: operational heading, referral attention panel, quieter metrics, reusable section panels, clearer agreement/roster actions and simpler microcopy.
- Tables: shared readable headers and rows, hover treatment, numeric alignment, horizontal scroll containment, and consistent actions.
- Phase C dialogs: supplied missing styles for `crmModalBackdrop` and `crmModalCard`, which previously had no stylesheet definitions.
- Forms: shared input treatment, field-to-control associations, helper/error descriptions, native filter/control labels, keyboard-selectable funding cards, improved wizard progress and narrow form grids.
- Shared searchable combobox: Arrow keys, Enter, Escape, filtered options, listbox semantics and a separate clear control. Suburb picker received keyboard and accessible field support while retaining custom suburb entry.
- Dialogs: reusable focus containment and restoration, Escape dismissal, named dialog surfaces across onboarding, agreements, roster, finance, safeguarding and worker completion. Participant/referral/worker record surface becomes a side drawer.
- Feedback: browser `alert()` calls in the edited product files use dismissible live-region notices. Quotes, invoices, timesheets and progress notes show skeleton loading and explicit retry states for failed HTTP requests.
- Portal source: shared typography/colours, simpler participant welcome surface, scrollable worker navigation and responsive form grids. Login styling is included in the scoped stylesheet.

## Evidence obtained

| Check | Result |
| --- | --- |
| Initial admin navigation inspection | Home, referrals, participants, goals, support plans, risk, roster, timesheets, progress notes, quotes, invoicing, agreements, safeguarding, workers, training, settings inspected in the signed-in browser. Database results were not consistently available. |
| Dashboard visual review | Before and after reviewed at 1440px. |
| Participant wizard | Personal details → location → funding reviewed without saving; Self-Managed selection by keyboard hides plan-manager fields. |
| Quote dialog | Reviewed at 1440px and 390px; mobile dialog client/scroll width both 342px, with vertical scrolling available. |
| Dialog focus | Shift+Tab from quote close control wraps to final action; Escape closes and returns focus to New Service Quote. |
| Focused TSX syntax | Passed during implementation. |
| `npm.cmd run typecheck` | Passed. |
| `npm.cmd run lint` | Passed with warnings. New combobox ARIA warning corrected; focused lint then passed without warnings. Existing roster `loadShifts` effect dependency warning remains. |
| `npm.cmd run build` | Passed; 70/70 routes generated, exit 0. Includes type/lint validation; existing roster warning only. |
| Automated test suite | No `test` script is configured. Existing database verification/seed scripts were not executed. |

No records were saved, emails sent, agreements signed, shifts completed, invoices generated, or production deployments performed during this pass. Browser screenshots were inspected in-session; no screenshot files were exported.

## Blockers and remaining work

1. Local server requests to Supabase intermittently fail with `TypeError: fetch failed`, caused by `EACCES`. Quote/support-item/invoice/roster/agreement requests returned HTTP 500. Some existing endpoints return HTTP 200 with empty or fallback data on query failure; those are not proof that the register is empty. Backend behaviour was not changed.
2. User confirmed no worker or participant test accounts are available. Authenticated portal workflows are source-reviewed only, not browser-accepted.
3. Remaining acceptance: all populated record states; agreement viewer and generator; worker credential/contract paths; goals, support plans and risk forms; safeguarding forms; shift completion; training; funding and invoice flows; empty/error states on modules outside the four Phase C registers.
4. Remaining responsive review: 1280px, 1024px and 768px; complete portal mobile journeys; all long dialog footers and keyboard paths. Only the quote dialog received the recorded mobile containment check.
5. Legacy inline colours/layouts remain in some components. Settings and notification sample content, existing browser confirmation/prompt flows, and `/staff` need further review against the brief. No claim of comprehensive screen-by-screen completion is made.

The development server was stopped before the production build to avoid concurrent writes to `.next`. Resume with a local server that can reach the configured backend, then complete the remaining visual review and refinement. Production/store acceptance is not implied by the successful build.

## Follow-up: portal login attempt and cleanup

The production build was subsequently started locally with network access. The user supplied four temporary Auth logins; live inspection found their application profiles missing. Temporary linked worker/participant profiles were added for the test.

Worker authentication succeeded, but profile access failed because the existing profile SELECT policies exclude the worker and participant roles. The browser fell through to the participant dashboard and displayed a profile-load error. Authenticated portal visual acceptance remains blocked.

All four test logins and temporary profiles have now been removed. Database verification confirmed zero remaining test Auth/profile rows and preservation of the two staff and two participant records. No operational records were submitted. The unrelated untracked account-creation script was left untouched.

See `PORTAL_ACCESS_REPAIR_PROPOSAL.md` for the exact proposed policy and bounded application repair. No access policy or application authentication change has been applied.
