# ANTIGRAVITY EXECUTION PROMPT — OPUS CARE CAREERS & RECRUITMENT

You are implementing a PRE-DEFINED product specification.

Do NOT redesign it.
Do NOT create another roadmap.
Do NOT replace the data model with a generic ATS.
Do NOT simplify the feature into an email/contact form.
Do NOT create a second worker/onboarding system.

## CANONICAL INPUTS

The owner will provide these files with this prompt:

1. `Opus_Care_Careers_Recruitment_FINAL_SPEC.md`
2. `Opus_Care_Careers_Recruitment_Migration_DRAFT.sql`
3. `Opus_Care_Careers_Acceptance_Checklist.md`

The FINAL_SPEC is the controlling product/UX/business/security specification.

The SQL file is an implementation draft. Reconcile it against latest remote `main` before applying; do not blindly execute if equivalent schema has appeared.

The Acceptance Checklist defines the evidence required before completion.

## VERIFIED PREPARATION BASELINE

At specification preparation time:

- repo: `iamnarace/NDIS_Project`
- latest verified main: `c9de7c7031323fedc26d09b9cd78ee4836edc959`
- latest verified Production deployment for that commit:
  `dpl_6JSop5qQcyr59X1wCwUSfyLUdkUk`
- Production was `READY`.

FIRST:
fetch current remote state.

If remote main is newer:
- preserve it
- use it as the real baseline
- do not reset/revert newer owner-approved work.

## OWNER INTENT

The feature must answer YES to:

“Can the owner create a vacancy, publish it, receive applications and EOIs,
review candidates, manage interview/reference stages, hire a candidate,
and move that person into the EXISTING Opus worker agreement/compliance/
roster-readiness workflow without needing a developer?”

## IMPLEMENT EXACTLY

Public:
- `/careers`
- `/careers/[slug]`
- current-opportunity cards
- truthful no-vacancy state
- Expression of Interest
- accessible application form
- private CV / optional cover-letter upload
- success state with APP reference
- Careers in desktop/mobile/footer navigation.

CRM:
- top-level `Recruitment`
- Vacancy CRUD/publish/close/archive/preview
- Applications
- EOI
- Pipeline
- candidate detail
- immutable timeline
- interview tracking
- reference-check tracking
- Hire Candidate workflow.

Integration:
- Recruitment candidates remain separate from `staff` until Hire
- Hire creates/links canonical Staff
- explicit fail-closed staff values
- existing Agreement Generator
- existing Worker Readiness / compliance
- no automatic roster readiness
- no copied self-declaration becoming verified credential.

Owner self service:
- careers email
- retention months
- all vacancy publishing from CRM
- no developer needed to post future jobs.

## SECURITY / PRIVACY

Never collect/store in public recruitment:
- TFN
- bank details
- super account details
- unnecessary DOB
- Medicare
- screening ID/number
- passport/licence number
- diagnosis/medical history unrelated to inherent requirements.

Private CV storage only.

Public website never gets:
- application listing
- candidate data
- private files
- internal notes
- draft vacancies.

All Admin Recruitment APIs use existing Admin auth.

Use current Opus server/API patterns.

Do not leak service-role/admin secrets into browser output.

## FACTUAL WORKER-SCREENING LANGUAGE

Current business is unregistered.

NDIS Worker Screening:
Opus may require it as internal policy for direct support workers.
Do not say unregistered providers are universally legally required to do so.

WWCC:
only where child-related work requires it.
Current launch age scope is 18+.

## PAY / EMPLOYMENT

Do not fabricate SCHADS classification from role title.

Do not hardcode public pay rates.

Keep separate:
- engagement relationship = employee / contractor
- employment basis = casual / part-time / full-time / fixed-term.

Use safe public pay-display modes from the spec.

Do not engage in sham-contractor logic.

## IMPORTANT EXISTING-SCHEMA GAP

At preparation time `public.staff` did NOT contain canonical:
- employment_basis
- employment_start_date.

If still absent, implement them as specified.

Do NOT overload `engagement_type`.

## IMPORTANT STAFF FAIL-CLOSED RULE

When Hire Candidate creates Staff, explicitly write:
- status pending
- lifecycle onboarding
- is_rosterable false
- screening Unknown / Needs Verification
- credentials null/unverified
- orientation false
- no implicit hourly rate
- approved service areas only.

Do not rely on DB defaults.

## FILE ARCHITECTURE

Do not bloat `app/admin/page.tsx`.

Create extracted Recruitment components, e.g.:
- `components/admin/RecruitmentTab.tsx`
- candidate/vacancy subcomponents.

`app/admin/page.tsx` gets only minimal tab integration.

Reuse:
- `components/SiteHeader.tsx`
- `components/SiteFooter.tsx`
- `lib/regions.ts`
- current Admin UI primitives
- current Resend architecture
- existing private `crm-documents` bucket
- existing Staff/Agreement/Readiness workflows.

Applicant file metadata stays recruitment-specific, not `public.documents`.

## EMAIL RELIABILITY

Persist application FIRST.

Then attempt:
- applicant acknowledgement
- admin notification.

If email fails:
- application stays recorded
- return successful submission with APP reference
- log safe delivery failure.

Never attach CV to notification email.

## DO NOT SEED A FAKE LIVE JOB

After initial deployment:
- Careers can be public
- EOI can be open
- zero published vacancies is valid.

No vacancy appears until owner explicitly publishes one.

## ANTI-DIVERGENCE RULE

If you think the spec should be redesigned:
do NOT redesign it.

Only depart where current repository architecture makes a specific detail invalid.

If that happens:
- choose the closest architecture-preserving implementation
- record the exact deviation and reason in the final report.

Do not use the deviation as permission to change unrelated design decisions.

## EXECUTION MODE

Perform the work continuously:

inspect latest state
→ implement
→ migration
→ tests
→ browser/E2E
→ self-review
→ fix
→ rerun gates
→ commit/push to the repository-authorised non-production feature/autonomous branch.

### IMPORTANT DEPLOYMENT CONTROL

For this FIRST implementation pass:

DO NOT deploy Vercel Production.
DO NOT apply destructive Production changes.
DO NOT publish any real vacancy.

Follow current repository AGENTS.md for branch safety.

Safe migration file creation is required.
If the repo's existing workflow allows a safe development Supabase branch and one is already available, test there.
Do not create paid infrastructure without owner authorisation.

Return the completed implementation for independent review BEFORE Production cutover.

## REQUIRED TESTS

At minimum prove:

Public:
- published vacancy visible
- draft not visible
- closed vacancy cannot accept application
- EOI works
- success reference shown
- application persists when email fails
- privacy/accuracy consents enforced
- no sensitive fields.

Files:
- safe types accepted
- bad type rejected
- size limits
- private object
- anonymous direct access denied
- admin signed URL.

Admin:
- unauthenticated recruitment API = 401
- vacancy create/edit/publish/close/archive
- application filters/stages
- event history
- interview
- reference check.

Hire:
- duplicate Staff detection
- create/link canonical Staff
- explicit safe values
- self-declared credentials remain unverified
- Staff lifecycle onboarding
- rosterable false
- Agreement Generator handoff
- Worker Readiness handoff.

Responsive/accessibility:
- mobile Careers
- keyboard form
- labels
- focus
- errors
- aria-live success state.

Security:
- no applicant PII in public/client bundle/logging
- no Admin/service-role secret exposure
- no direct anonymous table access.

## QUALITY GATE

Run and PASS:

`git diff --check`
`npm test`
`npm run typecheck`
`npm run lint`
`npm run build`

Add focused recruitment tests rather than relying only on existing suite.

## REQUIRED FINAL RESPONSE

Return exactly one:

# OPUS CARE CAREERS & RECRUITMENT IMPLEMENTATION REPORT

Include:

- starting main SHA
- final implementation SHA
- branch
- files changed
- migration filename
- schema reconciliation/deviations
- public Careers status
- EOI status
- vacancy owner-management status
- private CV status
- recruitment CRM status
- Hire → Staff status
- Agreement/Readiness handoff
- email persistence/failure test
- security/RLS/API results
- accessibility/browser results
- full test/typecheck/lint/build results
- fixture cleanup
- Production status: UNCHANGED / NOT DEPLOYED

Finish with one of:

`READY FOR INDEPENDENT REVIEW BEFORE PRODUCTION`

or

`BLOCKED — <one concrete genuine blocker>`

Do not return another planning document.
