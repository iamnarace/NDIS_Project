# Opus Care Support Services
# Careers & Recruitment — Product, UX, Data, CRM and Implementation Build Pack

**Prepared before implementation handoff**  
**Purpose:** Define the complete Careers → Application → Recruitment CRM → Hire → Existing Worker Onboarding workflow so an implementation agent does not invent product decisions.

---

## 1. Product decision

Opus Care should have a genuine owner-managed recruitment system, not a simple “send us your CV” page.

The final journey is:

**Public Careers → Published Vacancy / Expression of Interest → Application → Recruitment CRM → Review → Interview → Reference Check → Offer → Hire → Existing Staff/Worker Record → Existing Agreement Generator → Existing Compliance / Readiness → Roster**

The Careers module must not create a second workforce system. Recruitment ends by creating or linking the person to the existing canonical `staff` record.

### Non-negotiable launch rules

- Do not fabricate active job vacancies.
- Careers page may launch with **no current vacancies + Expression of Interest**.
- Only the owner/admin can publish a vacancy.
- Initial application never collects TFN, bank account, super account, Medicare number, screening numbers, passport number, licence number, date of birth, or unnecessary health information.
- Applicant declarations about screening are **status-only and unverified**.
- NDIS Worker Screening is an Opus Care internal policy for direct support workers; do not claim it is universally required by law for an unregistered provider.
- WWCC is conditional on child-related work. Current Opus launch scope remains 18+.
- No applicant becomes rosterable because they submitted an application or because they are marked Hired.
- Hiring must hand off to existing worker onboarding/compliance and preserve all fail-closed roster-readiness gates.
- No clinical/high-intensity activation is introduced by recruitment.
- Do not alter remittance, insurance or participant systems.

---

# 2. Existing Opus architecture this feature must fit

The implementation must extend what already exists rather than inventing a parallel architecture.

## Existing website

Current public website uses:

- `components/SiteHeader.tsx`
- `components/SiteFooter.tsx`
- Next.js App Router public pages under `app/*`
- existing Opus Care design system and global CSS
- public Privacy Policy at `/privacy`
- current referral and contact submission patterns

### Navigation decision

Add **Careers** to:

**Desktop**  
Home  
Services & Supports  
Areas We Serve  
About Opus Care  
**Careers**  
Pricing & FAQ  
Portal  
Contact Us

**Mobile**  
Home  
Portal  
Services & Supports  
Areas We Serve  
About Opus Care  
**Careers**  
Pricing & FAQ  
Contact Us

**Footer Quick Links**  
Add `Careers` immediately after `About Opus Care`.

Do not replace the existing Referral CTA.

---

## Existing CRM

The Admin CRM currently has a single canonical admin surface and existing tabs for referrals, agreements, participants, workforce/staff, compliance, invoicing, quotes, settings, etc.

Add one canonical top-level CRM tab:

`recruitment`

Recommended placement:

**Referrals → Recruitment → Agreements / Participants … → Staff / Workforce**

Rationale: referrals are participant intake; recruitment is workforce intake.

Do not create a separate `/recruitment-admin` product.

---

## Existing Staff model

Current canonical workforce table is `public.staff`.

Important current fields include:

- `id`
- `reference_number`
- `full_name`
- `role`
- `phone`
- `email`
- `suburbs`
- `engagement_type` = employee / contractor
- `status`
- `lifecycle_stage`
- `is_rosterable`
- compliance fields
- credential dates
- `hourly_rate`
- `ndis_orientation_completed`
- clinical/AHPRA fields where relevant

Current lifecycle values include:

- applicant
- onboarding
- pending_verification
- ready_restricted
- ready
- suspended
- inactive
- terminated
- legacy_review_required

### Recruitment design decision

A public applicant **must not be inserted into `staff` at application time**.

Use dedicated recruitment tables first.

Only when Admin selects **Hire Candidate** should the candidate be created/linked to `public.staff`.

On conversion:

- new worker `status = pending`
- `lifecycle_stage = onboarding`
- `is_rosterable = false`
- screening evidence remains unverified
- no self-declared recruitment answer may automatically become a verified workforce credential.

---

## Existing private document storage

Existing bucket:

`crm-documents`

Current properties:

- private
- supports PDF, JPG/PNG/WebP, DOC, DOCX
- 15 MB bucket limit

Recruitment should reuse this private bucket.

Recruitment-specific upload limit should be lower:

- Resume/CV: max 8 MB
- Cover letter: max 5 MB
- Accept only PDF, DOC, DOCX for recruitment application files.

Recommended path:

`recruitment/applications/<application_uuid>/<random_id>_<safe_filename>`

Do not make applicant files publicly readable.

Use short-lived signed URLs only for authenticated admin access.

---

## Existing email architecture

Opus already uses Resend through `lib/email.ts`.

Current email logic follows the right reliability pattern:

1. persist record
2. attempt email
3. email failure must not destroy persisted submission

Careers must use the same principle.

Add recruitment-specific email functions to the existing email layer instead of introducing a second email service.

---

## Existing service areas

Reuse the existing canonical service-area data from `lib/regions.ts`.

Recruitment location options should derive from the existing region configuration rather than manually maintaining a second list.

Canonical broad recruitment areas:

### Northern NSW
- Coffs Coast / Coffs Harbour
- Clarence Valley / Grafton
- Maclean / Yamba
- Richmond Valley
- Lismore Region
- Ballina / Northern Rivers

### Sydney
- Blacktown
- Parramatta
- Western Sydney
- Sydney CBD / Redfern
- selected surrounding locations

A vacancy may target one or multiple areas.

Do not claim immediate worker capacity in a job advertisement.

---

# 3. Legal / factual recruitment guardrails

## Job advertisements and pay

If a public job ad states a pay rate, it must not advertise a rate below the employee's applicable legal minimum entitlement.

Therefore Opus vacancy configuration gets these pay-display modes:

1. `hidden`
2. `award_text`
3. `custom_text`

### Default public pay wording

> Pay and conditions will be determined in accordance with the applicable industrial instrument, classification and employment arrangement.

If the role is confirmed to fall under SCHADS, owner may instead publish:

> Pay and conditions in accordance with the applicable SCHADS Award and confirmed classification.

Do not hardcode a pay rate unless owner has reviewed the current classification/rate.

Do not automatically derive award classification from a job title.

Do not call a contractor arrangement an “employment basis”.

Keep:

- **engagement relationship:** employee / contractor
- **employment basis:** casual / part-time / full-time / fixed-term

as separate concepts.

---

## Privacy — applicants are not yet employees

Prospective/unhired applicants should be treated as recruitment records, not as ordinary employee records.

Only collect information reasonably necessary for recruitment.

The initial application must not ask for irrelevant protected or sensitive information.

Do not ask:

- age / date of birth
- sex / gender unless genuinely required by law and separately reviewed
- marital status
- pregnancy/family planning
- race/ethnicity
- disability/diagnosis
- religion
- political views
- union membership
- sexual orientation
- medical history
- TFN
- bank/super details

### Accessibility instead of health questions

Public copy:

> **Need an adjustment to apply or interview?**  
> Opus Care welcomes requests for reasonable adjustments during recruitment. You do not need to disclose a diagnosis. Contact our team and tell us what would help you participate in the process.

Use the configured Careers contact email or Support email fallback.

---

## NDIS Worker Screening

Public wording:

> Successful applicants for participant-facing support roles must satisfy Opus Care's worker-screening, identity, work-right, training and role-specific credential requirements before they can be approved for participant supports.

For direct disability support roles, Opus may state:

> Opus Care requires NDIS Worker Screening clearance as an internal worker-safety policy before a worker is approved for participant-facing support.

Do not say unregistered NDIS providers are universally legally required to mandate NDISWC.

---

## WWCC

Current launch scope is 18+.

Do not list WWCC as a universal mandatory requirement for every support worker.

Correct wording:

> A Working With Children Check is required where a role involves child-related work in NSW. Opus Care's current launch service scope is focused on adults; role-specific requirements will be confirmed during recruitment and onboarding.

---

# 4. Public Careers information architecture

Create:

- `/careers`
- `/careers/[slug]`

Do not create a separate external recruitment website.

---

# 5. `/careers` — exact public content

## Metadata

**Title:**  
Careers at Opus Care Support Services | Disability Support Jobs NSW

**Description:**  
Explore current opportunities and expressions of interest with Opus Care Support Services across Northern NSW and selected Sydney service areas.

---

## Hero

**Eyebrow:**  
CAREERS AT OPUS CARE

**H1:**  
Build a meaningful career with Opus Care

**Body:**

> If you care about dignity, choice, reliability and helping people participate in everyday life, we'd like to hear from you. Explore current opportunities with Opus Care Support Services or submit an Expression of Interest for future roles.

**Primary CTA:**  
View Current Opportunities

**Secondary CTA:**  
Submit an Expression of Interest

Do not say “we are always hiring”.

---

## Section: What matters to us

**Heading:**  
Support that starts with respect

**Cards:**

### Person-centred
We listen to the person, respect their choices and support the routines and goals that matter to them.

### Reliable
Participants should be able to rely on the people supporting them. Clear communication, punctuality and accurate records matter.

### Safe & accountable
Screening, training, professional boundaries, privacy and incident reporting are part of how we work.

### Local & practical
Our work happens in homes and communities. We value workers who understand local travel, everyday routines and community participation.

---

## Section: Current opportunities

If published jobs exist, show cards.

Each card:

- Job title
- Location / region
- Employment basis
- short description
- closing date if configured
- `View role` button

Never show internal vacancy notes.

### Zero-vacancy state — exact copy

**Heading:**  
No positions are currently advertised

**Body:**

> You're welcome to submit an Expression of Interest. If a suitable opportunity becomes available, our team may contact you in line with our recruitment and privacy processes.

**Button:**  
Submit an Expression of Interest

---

## Section: Recruitment process

**Heading:**  
What happens after you apply

1. **Application received**  
   We record your application and send you a reference number.

2. **Initial review**  
   We compare your experience and availability with the genuine requirements of the role.

3. **Conversation or interview**  
   Shortlisted applicants may be invited to discuss the role and support approach.

4. **Checks & references**  
   Where appropriate, we confirm references and role-specific screening requirements.

5. **Offer & onboarding**  
   If an offer is made and accepted, you move into Opus Care's formal worker onboarding, agreement and compliance process.

6. **Roster readiness**  
   Hiring does not automatically make a worker roster-ready. Required evidence, training and competencies must be completed and verified first.

---

## Section: Screening & readiness

**Heading:**  
Before participant-facing work begins

**Body:**

> Requirements depend on the role. Successful applicants may need to complete identity and work-right checks, Opus Care induction, role-specific training and relevant screening before being approved for participant-facing support.

**Bullets:**

- NDIS Worker Screening clearance — required by Opus Care policy for direct support workers
- National Police Check — where required by Opus Care policy
- First Aid / CPR — where required for the role
- Current driver licence and suitable vehicle — where driving is an inherent requirement
- WWCC — only for child-related roles where required
- role-specific or participant-specific competencies where relevant

No evidence needs to be uploaded in the initial public application except the CV / optional cover letter.

---

## Inclusive recruitment statement

> Opus Care Support Services is committed to fair, respectful and merit-based recruitment. We welcome applications from people with diverse backgrounds and lived experiences. If you need a reasonable adjustment to participate in the application or interview process, contact our team and tell us what would help.

Do not ask applicants to disclose a diagnosis.

---

# 6. Public vacancy page `/careers/[slug]`

## Header block

Show:

- Job title
- Vacancy reference e.g. `JOB-2026-0001`
- service area(s)
- employment basis
- engagement relationship only if relevant
- opening date
- closing date, if set
- pay text according to configured display mode
- Apply Now button

## Content order

1. About the opportunity
2. What you'll be doing
3. What we're looking for
4. Essential criteria
5. Desirable criteria
6. Location / travel requirements
7. Screening / onboarding requirements
8. Pay & conditions
9. Inclusive recruitment / adjustments
10. Apply CTA

Do not expose:
- applicant counts
- hiring manager private notes
- internal budget
- hidden pay configuration
- staff data
- internal staffing capacity.

---

# 7. Prepared draft role template — Disability Support Worker

This is a reusable **DRAFT TEMPLATE**, not a live vacancy.

## Title
Disability Support Worker

## Short summary
Provide respectful, practical one-to-one support that helps people participate in everyday life, community activities and routines that matter to them.

## About the role

> Disability Support Workers at Opus Care provide participant-led support in homes and community settings. The work may include assistance with daily routines, community participation, appointments, shopping, household tasks, social support and independence-building activities within the worker's approved role and competency.

> Support is guided by the participant's goals, preferences, support plan and risk information. Workers are expected to communicate professionally, document support accurately and escalate concerns through Opus Care's incident and safeguarding processes.

## Key responsibilities

- provide respectful and person-centred support
- follow agreed support plans and participant preferences
- support community access, appointments and everyday activities
- assist with daily living tasks that are within the worker's authorised role and competency
- maintain professional boundaries and confidentiality
- complete accurate progress notes and shift records
- report incidents, hazards and safeguarding concerns promptly
- communicate changes or concerns to the appropriate Opus Care contact
- complete required training and maintain role-specific credentials
- follow Opus Care policies, Code of Conduct and WHS requirements.

## Essential criteria

- ability to communicate respectfully with people with disability, families and team members
- reliable attendance and professional conduct
- valid Australian work rights
- willingness to complete Opus Care screening and onboarding requirements
- ability to use a phone/app for rosters, notes and required documentation
- ability to travel to the advertised service area where this is an inherent requirement.

Role-specific requirements such as driving, First Aid, CPR or other credentials must be configured per vacancy rather than assumed.

## Desirable

- previous disability, community, aged care, health or support experience
- relevant Certificate III/IV or other community-services qualification
- experience supporting community participation and independence
- familiarity with person-centred and rights-based support.

Do not make a qualification mandatory unless genuinely required for the vacancy.

---

# 8. Public application form — exact field design

Application should be one clear multi-step form.

## Step 1 — Role & contact

**Role**
- prefilled vacancy
- for EOI: preferred role

**First name** — required, max 80  
**Last name** — required, max 80  
**Email** — required, valid email, max 160  
**Mobile** — required, max 40  
**Suburb** — required, max 100  
**Postcode** — required, 4-digit Australian format

---

## Step 2 — Work preferences

**Preferred service areas** — required, multi-select from canonical `lib/regions.ts`

**Employment preference**
- Casual
- Part-time
- Full-time
- Fixed-term
- Flexible / open to discussion

Do not show “contractor” here unless the vacancy itself is explicitly a genuine contractor opportunity.

**Australian work rights**

Question:

> Do you currently hold valid Australian work rights for this role?

Options:
- Yes
- No
- Not sure / would like to discuss

Do not ask citizenship or country of birth.

**Earliest available start date** — optional

---

## Step 3 — Experience & readiness

**Relevant experience**
Textarea, max 1,500 characters.

Prompt:

> Briefly tell us about experience that is relevant to this role. This can include paid work, study, volunteering or transferable experience.

**Qualifications**
Textarea, optional, max 1,000.

**Current Australian driver licence**
- Yes
- No
- Not applicable to this role

No licence number.

**Access to a suitable vehicle where driving is required**
- Yes
- No
- Not applicable

No registration/insurance number at this stage.

**NDIS Worker Screening status**
- Current clearance
- Application in progress
- Not currently held
- Not sure

No screening ID/number and no upload at application stage.

**National Police Check status**
- Current / recently completed
- Not currently held
- Not sure

This is a declaration only.

**First Aid status**
- Current
- Expired / renewal needed
- Not currently held

**CPR status**
- Current
- Expired / renewal needed
- Not currently held

**WWCC**
Only show if vacancy is flagged `child_related_role = true`.

Options:
- Current WWCC
- Application in progress
- Not currently held
- Not sure

Do not ask for WWCC number at application stage.

---

## Step 4 — Availability

Use structured checkboxes, not a large free-text box.

Days:
- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday
- Sunday

General periods:
- Morning
- Daytime
- Evening
- Flexible

Optional:

**Availability notes** max 500.

Do not promise shifts/hours.

---

## Step 5 — Application documents

### Resume / CV
Required for a published vacancy.

For EOI:
optional but recommended.

Accept:
- PDF
- DOC
- DOCX

Max 8 MB.

### Cover letter
Optional.

Accept:
- PDF
- DOC
- DOCX

Max 5 MB.

Do not accept executable files, ZIPs or arbitrary file types.

---

## Step 6 — Final questions

**Why are you interested in this opportunity / Opus Care?**  
max 1,000 characters.

**Privacy consent — required**

Exact text:

> I understand that Opus Care Support Services will collect and use the information in this application for recruitment, candidate assessment and related recruitment administration. I have read the Opus Care Privacy Policy.

Link `Privacy Policy` to `/privacy`.

**Accuracy declaration — required**

> I confirm that the information I have provided is accurate to the best of my knowledge. I understand that any screening status I have declared will still need to be independently verified before participant-facing work.

No marketing opt-in checkbox by default.

---

# 9. Expression of Interest

EOI is not a fake job vacancy.

## Page/modal heading
Expression of Interest

## Intro

> There may not be a current vacancy that matches your experience or location. You can send us an Expression of Interest and, if a suitable opportunity becomes available, our team may contact you.

Preferred roles:

- Disability Support Worker
- Community Support Worker
- Future support opportunities
- Administration / coordination
- Other

Use the same privacy protections as normal applications.

`application_type = eoi`

`vacancy_id = null`

The UI must label it clearly as **Expression of Interest**, not “Job Application”.

---

# 10. Success state

After a successful application:

## Heading
Application received

## Copy

> Thank you for your interest in Opus Care Support Services.

> Your application reference is **APP-2026-XXXX**.

> Our team will review your application. If we need more information or would like to progress your application, we'll contact you using the details you provided.

Buttons:
- Return to Careers
- View Opus Care Services

Do not promise an interview or response timeframe that has not been operationally committed.

---

# 11. Recruitment email copy

Create a configurable recruitment destination email. Prefer an owner-editable CRM Organisation Setting such as:

`careers_contact_email`

Fallback:
`support@opuscare.com.au`

Do not require a future developer merely to change the recruitment mailbox.

---

## Applicant acknowledgement

**Subject:**  
We've received your application · Opus Care Support Services · APP-2026-XXXX

**Body:**

Hello {{first_name}},

Thank you for your interest in joining Opus Care Support Services.

We've received your {{application_label}} for:

**{{role_or_eoi}}**

Application reference: **{{application_reference}}**

Our team will review your information and contact you if we need anything further or would like to progress your application.

Please do not email sensitive identity, banking, tax or screening documents unless an authorised Opus Care team member asks you to use an approved secure process.

Kind regards,  
**Opus Care Support Services**

---

## Admin notification

**Subject:**  
New Careers Application · {{application_reference}} · {{applicant_name}}

**Body fields:**

- Application reference
- Vacancy / EOI
- Applicant
- Email
- Mobile
- Suburb
- preferred service areas
- employment preference
- submitted date/time
- secure admin link

Do not attach CV or cover letter to the email.

CV must be opened from authenticated CRM.

---

## Stage email templates

Prepare but do not automatically send unless Admin explicitly triggers or workflow is intentionally configured.

### Interview invitation
Subject: Opus Care recruitment · Interview invitation · {{reference}}

### Application unsuccessful
Subject: Update on your Opus Care application · {{reference}}

Polite generic copy; do not expose internal scoring or another candidate's information.

### Offer
Do not turn email itself into the employment contract.
Offer stage should hand off to existing employment/agreement workflow.

---

# 12. Recruitment CRM UX

Add CRM top-level tab:

**Recruitment**

Use existing Opus CRM visual primitives rather than creating a different design language.

## Recruitment landing dashboard

Header:

**Recruitment**

Subtitle:

> Manage vacancies, applications and hiring handoff into the existing Opus Care workforce onboarding process.

### KPI cards

- Open Vacancies
- New Applications
- Shortlisted
- Interviews
- Offers
- Hired — Last 30 Days
- Retention Review Due

### Sub-tabs

1. Vacancies
2. Applications
3. Expression of Interest
4. Pipeline

---

# 13. Vacancies CRM screen

Table columns:

- Reference
- Job title
- Location
- Employment basis
- Status
- Applications
- Published
- Closing date
- Last updated
- Actions

Actions:

- View
- Edit
- Preview
- Publish
- Unpublish
- Close applications
- Duplicate
- Archive

A vacancy must not appear publicly until `Publish` is explicitly used.

---

# 14. Vacancy editor

Use a drawer/wizard consistent with existing Admin forms.

## Step 1 — Role identity

- Title
- Internal vacancy reference auto-generated
- Department/category
- number of positions
- short summary

## Step 2 — Location & arrangement

- service area(s)
- optional towns/suburbs
- employment basis
- engagement relationship
- workplace type: community / participant homes / mixed / office where appropriate

## Step 3 — Role description

- About the opportunity
- Responsibilities
- Essential criteria
- Desirable criteria

Use repeatable list inputs rather than requiring raw Markdown.

## Step 4 — Requirements

Config flags:

- driver licence required
- vehicle access required
- NDISWC required by Opus policy
- police check required by Opus policy
- First Aid required
- CPR required
- `child_related_role`
- relevant qualification required
- other role-specific requirement

If `child_related_role = false`, do not display WWCC as mandatory.

## Step 5 — Pay display

`hidden`
`award_text`
`custom_text`

If custom:
Admin receives warning:

> Any advertised pay rate must comply with the applicable minimum legal entitlement and industrial instrument. Confirm the classification before publishing.

## Step 6 — Publication

- opening date
- closing date optional
- featured
- status
- preview
- Publish button

---

# 15. Applications CRM

Default list shows `NEW` first.

Columns:

- Reference
- Applicant
- Vacancy / EOI
- Location
- Service-area preference
- Stage
- Submitted
- Last activity
- Flags
- Action

Filters:

- Vacancy
- Application type
- Stage
- Service area
- Employment preference
- Submitted date
- retention status

Search:

- name
- email
- phone
- reference

No public access.

---

# 16. Candidate detail / Recruitment 360

Use a right-side drawer or full detail pane.

## Header

Applicant name  
APP reference  
vacancy  
stage pill  
submitted date

Primary actions:
- Move Stage
- Add Note
- Schedule Interview
- Add Reference Check
- Download CV
- Hire Candidate

## Sections

### Application
All submitted answers.

### Documents
- Resume
- Cover letter

Signed URL generated only on demand.

### Recruitment timeline
Immutable stage/event history.

### Internal notes
Admin-only.

### Interview
Scheduled / completed interviews.

### Reference checks
Only collected when needed.

### Hiring handoff
Shows:
- not hired
- linked worker
- worker reference
- onboarding status
- roster readiness

---

# 17. Recruitment stages

Canonical values:

- `new`
- `reviewing`
- `shortlisted`
- `interview`
- `reference_check`
- `offer`
- `hired`
- `unsuccessful`
- `withdrawn`

Public applicant never sees internal notes or pipeline reasoning.

### Transition expectations

NEW → REVIEWING  
REVIEWING → SHORTLISTED / UNSUCCESSFUL  
SHORTLISTED → INTERVIEW / UNSUCCESSFUL  
INTERVIEW → REFERENCE_CHECK / OFFER / UNSUCCESSFUL  
REFERENCE_CHECK → OFFER / UNSUCCESSFUL  
OFFER → HIRED / WITHDRAWN / UNSUCCESSFUL

Admin can correct stages if necessary, but every change creates an event.

---

# 18. Interview record

Fields:

- application_id
- interview type: phone / video / in-person
- scheduled_at
- timezone = Australia/Sydney
- interviewer
- location or meeting link
- status: scheduled / completed / cancelled / no_show
- notes
- outcome: progress / hold / decline
- created_at / updated_at

Interview notes are private.

---

# 19. Reference-check record

Do not ask for referees on the initial public application.

Collect later only if candidate progresses.

Fields:

- application_id
- referee name
- relationship
- organisation optional
- phone/email
- applicant consent confirmed
- status: pending / contacted / completed / unable_to_contact
- checked_at
- checked_by
- factual notes
- outcome

Do not send automated reference requests in v1 unless deliberately implemented and tested.

---

# 20. Data model

Use additive migration(s).

## Table: `job_vacancies`

Recommended columns:

```sql
id uuid primary key default gen_random_uuid()
reference_number text not null unique
slug text not null unique
title text not null
category text
short_summary text not null
about_role text not null
responsibilities jsonb not null default '[]'
essential_criteria jsonb not null default '[]'
desirable_criteria jsonb not null default '[]'
service_area_ids text[] not null default '{}'
location_notes text
employment_basis text[] not null default '{}'
engagement_relationship text not null default 'employee'
positions_count integer
driver_licence_required boolean not null default false
vehicle_required boolean not null default false
ndiswc_required boolean not null default false
police_check_required boolean not null default false
first_aid_required boolean not null default false
cpr_required boolean not null default false
child_related_role boolean not null default false
qualification_required boolean not null default false
other_requirements jsonb not null default '[]'
pay_display_mode text not null default 'award_text'
pay_public_text text
status text not null default 'draft'
featured boolean not null default false
opens_at timestamptz
closes_at timestamptz
published_at timestamptz
closed_at timestamptz
archived_at timestamptz
created_by text
updated_by text
created_at timestamptz default now()
updated_at timestamptz default now()
```

Constraints:

`status`:
draft / published / closed / archived

`engagement_relationship`:
employee / contractor

`pay_display_mode`:
hidden / award_text / custom_text

For published vacancy:
- title nonblank
- slug valid
- role content complete
- at least one location/service area
- at least one employment basis
- if custom pay mode, `pay_public_text` required.

---

## Table: `job_applications`

```sql
id uuid primary key default gen_random_uuid()
reference_number text not null unique
application_type text not null
vacancy_id uuid null references job_vacancies(id)
first_name text not null
last_name text not null
email text not null
phone text not null
suburb text not null
postcode text not null
preferred_service_area_ids text[] not null default '{}'
employment_preferences text[] not null default '{}'
work_rights_status text not null
earliest_start_date date
experience_summary text
qualification_summary text
driver_licence_status text
vehicle_access_status text
ndiswc_status_declared text
police_check_status_declared text
first_aid_status_declared text
cpr_status_declared text
wwcc_status_declared text
availability jsonb not null default '{}'
availability_notes text
motivation text
privacy_consent_at timestamptz not null
accuracy_declaration_at timestamptz not null
stage text not null default 'new'
source text not null default 'website'
submitted_at timestamptz
retention_until date
converted_staff_id uuid null references staff(id)
hired_at timestamptz
decision_at timestamptz
created_at timestamptz default now()
updated_at timestamptz default now()
```

Constraints:

`application_type`:
vacancy / eoi

For vacancy application:
`vacancy_id is not null`

For EOI:
`vacancy_id is null`

`stage`:
new / reviewing / shortlisted / interview / reference_check / offer / hired / unsuccessful / withdrawn

No TFN, banking, super account, DOB or screening identifiers.

---

## Table: `job_application_files`

```sql
id uuid primary key default gen_random_uuid()
application_id uuid not null references job_applications(id) on delete cascade
file_kind text not null
file_name text not null
file_size integer not null
mime_type text not null
storage_path text not null unique
created_at timestamptz default now()
```

`file_kind`:
resume / cover_letter

No direct public access.

---

## Table: `job_application_events`

```sql
id uuid primary key default gen_random_uuid()
application_id uuid not null references job_applications(id) on delete cascade
event_type text not null
from_stage text
to_stage text
note text
actor text not null
created_at timestamptz default now()
```

Use for immutable timeline:
- submitted
- stage_changed
- note_added
- email_sent
- interview_scheduled
- reference_check
- hired
- retention_updated

---

## Table: `job_interviews`

As defined in section 18.

## Table: `job_reference_checks`

As defined in section 19.

---

# 21. Reference numbers

Use existing Opus reference-number style.

Recommended:

- Vacancy: `JOB-00001` or `JOB-2026-0001`
- Application: `APP-00001` or `APP-2026-0001`

Use UUIDs internally.

Human references are display/audit identifiers only.

---

# 22. Recruitment retention policy

Do not claim one retention period is mandated by law.

Create owner-configurable business-policy retention.

Recommended default:

- unsuccessful / withdrawn applications: 12 months after final decision
- EOI: 12 months after submission unless refreshed/renewed
- hired candidates: recruitment record linked to staff; preserve only what is required under the approved workforce record policy.

Add:

`recruitment_retention_months = 12`

to owner-editable organisation/recruitment settings, if practical.

CRM shows:
**Retention Review Due**

Do not auto-delete silently.

Admin purge action should:
1. require confirmation
2. delete applicant private files
3. redact applicant PII where policy says purge
4. retain minimal non-identifying audit metrics if required.

---

# 23. API contract

Recommended route structure:

## Public

### `GET /api/careers/vacancies`
Returns only:
- published vacancies
- within open/close window
- public fields only

### `GET /api/careers/vacancies/[slug]`
Public vacancy only.

### `POST /api/careers/applications`
Accept application / EOI.

Must:
- validate server-side
- verify vacancy is currently open
- enforce privacy consent
- reject hidden honeypot
- enforce payload limits
- create APP reference
- persist application
- handle file upload safely
- mark submission complete
- then attempt emails
- return application reference

No public application LIST endpoint.

---

## Admin

### `GET /api/admin/recruitment/vacancies`
### `POST /api/admin/recruitment/vacancies`
### `PATCH /api/admin/recruitment/vacancies/[id]`

All protected by existing Admin authentication.

### `GET /api/admin/recruitment/applications`
Filters supported.

### `GET /api/admin/recruitment/applications/[id]`
Return detail + signed file URLs only when requested.

### `PATCH /api/admin/recruitment/applications/[id]/stage`

Must insert event.

### `POST /api/admin/recruitment/applications/[id]/notes`
### `POST /api/admin/recruitment/applications/[id]/interviews`
### `POST /api/admin/recruitment/applications/[id]/references`

### `POST /api/admin/recruitment/applications/[id]/hire`

Critical transactional handoff.

---

# 24. Application submission reliability

Recommended workflow:

1. validate form
2. verify vacancy/open state
3. create application as internal `submission_state = processing` if this field is used
4. upload resume/cover letter to private bucket
5. write file metadata
6. mark application submitted
7. create submitted event
8. attempt email notifications
9. return success

If required file upload fails:
- clean any uploaded objects
- do not expose partial application as a normal candidate
- return retryable error.

If email fails:
- keep application
- record safe delivery-failure event
- still return successful application submission.

---

# 25. File safety

Server validation, not browser validation alone.

Resume:
- MIME: PDF, DOC, DOCX
- max 8 MB

Cover:
- MIME: PDF, DOC, DOCX
- max 5 MB

Safe filename:
- strip path characters
- normalize Unicode where appropriate
- create random prefix / UUID
- do not use applicant email in path
- do not trust client MIME alone where practical.

Private bucket only.

Signed URL:
10–15 minutes recommended for admin download.

No permanent public URL.

---

# 26. Spam / abuse protection

At minimum:

- hidden honeypot field
- minimum form completion time check
- maximum request body/file limits
- server validation
- duplicate submission warning
- reasonable submission throttling
- no verbose database errors in public response.

Duplicate detection:

same normalized email + same vacancy within configurable recent period.

Do not block automatically if data is ambiguous; warn or return existing reference where appropriate.

---

# 27. Hire Candidate — exact behaviour

This is the key CRM integration.

Admin presses:

**Hire Candidate**

Open a final review drawer.

## Final hiring fields

- Final role
- Engagement relationship:
  - employee
  - contractor
- If employee, employment basis:
  - casual
  - part-time
  - full-time
  - fixed-term
- service areas
- planned start date
- base rate / classification review deferred to existing employment setup where appropriate

Do not blindly copy applicant preference as the employment decision.

## Duplicate prevention

Before creating staff:
- exact case-insensitive email match
- normalized phone match
- optionally name + phone review

If an existing staff record is found:

> Existing worker record found. Link this candidate to the existing worker instead of creating a duplicate.

Admin chooses Link.

## New worker creation

Create `staff`:

- full_name = candidate first + last
- phone
- email
- role = final role
- engagement_type = final owner decision
- suburbs/service areas = approved assignment
- status = pending
- lifecycle_stage = onboarding
- is_rosterable = false
- NDIS screening = Unknown / Needs Verification
- credential fields remain null/unverified
- readiness note references originating APP reference.

Do not transfer:
- declared NDISWC status into verified worker credential
- declared Police status into verified worker credential
- declared First Aid/CPR into verified evidence
- CV as a workforce credential.

Set:

`job_applications.converted_staff_id = staff.id`  
`stage = hired`  
`hired_at = now()`

Create immutable event.

Then show buttons:

**Open Worker 360**  
**Generate Employment Agreement**  
**Begin Compliance Onboarding**

---

# 28. Employment basis gap to resolve during implementation

Current canonical `staff` table distinguishes employee vs contractor but does not currently contain a dedicated employment-basis field for:

- casual
- part-time
- full-time
- fixed-term

Recruitment should not misuse `engagement_type` for this.

Implementation should add, if still absent after current-main inspection:

`staff.employment_basis`

Allowed:
casual / part_time / full_time / fixed_term / not_applicable

And optionally:

`employment_start_date`

Only add after checking current main for any equivalent canonical field.

Do not duplicate agreement-specific data if a newer existing field already exists.

---

# 29. Existing Agreement Generator handoff

Recruitment does not create a new contract engine.

After hire:

Candidate  
→ Staff  
→ existing Agreement Generator  
→ existing PAYG employment contract or genuine contractor agreement  
→ signature/execution  
→ worker compliance  
→ readiness  
→ roster.

The recruitment module's job ends at a clean handoff.

---

# 30. Candidate declarations vs verified evidence

This distinction must be visible in CRM.

Application may display:

**Applicant declared**
- NDISWC: Current clearance
- First Aid: Current

But Worker readiness must show:

**Verification**
- NDISWC: Not yet verified
- First Aid: Evidence required

Never copy a declaration into a verified field.

---

# 31. Accessibility

Public Careers and Application must support:

- keyboard-only navigation
- correct labels
- field descriptions associated with inputs
- visible focus
- error summary
- inline validation
- `aria-live` success/error states
- accessible file picker
- no colour-only status meaning
- responsive 320px+ layout
- semantic headings
- sufficient contrast.

Recruitment CRM should remain usable on tablet.

---

# 32. SEO / structured data

For real `PUBLISHED` vacancies only, add JobPosting structured data if implementation can do it correctly.

Do not add JobPosting schema for:
- Expression of Interest
- Draft roles
- Closed roles
- fake seed vacancies.

Include only fields backed by vacancy data.

If salary is hidden, omit salary structured data rather than inventing it.

---

# 33. Public trust copy boundaries

Do not publish:

- “guaranteed shifts”
- “immediate start”
- “competitive pay” unless substantiated
- “fully insured” unless insurance automation says true
- “registered NDIS provider”
- “WWCC mandatory for all staff”
- unsupported benefits
- unsupported training funding
- fake team size
- fake testimonials from workers.

---

# 34. Recruitment analytics — lightweight only

Owner dashboard can derive:

- applications per vacancy
- stage counts
- time in stage
- hires by vacancy
- source if collected
- EOI count

Do not build algorithmic applicant ranking.

Do not score candidates based on protected characteristics.

No AI résumé ranking in v1.

---

# 35. First production state

Immediately after deployment, expected state:

- `/careers` LIVE
- Careers nav link LIVE
- Recruitment CRM LIVE
- zero fake public vacancies
- zero real applicants unless submitted
- EOI open
- owner can create/publish vacancy
- owner can receive/manage application
- CV storage private
- applicant email confirmation configured
- Admin recruitment notification configured
- Hire → worker handoff available
- existing worker readiness remains fail-closed.

---

# 36. Acceptance scenarios

## Scenario A — no vacancy
1. Visit `/careers`
2. no fake role listed
3. zero-vacancy state displayed
4. EOI works
5. APP reference created
6. CRM shows EOI
7. email failure does not lose EOI.

## Scenario B — owner creates vacancy
1. Admin → Recruitment
2. New Vacancy
3. save DRAFT
4. not visible publicly
5. Preview
6. Publish
7. immediately visible on Careers
8. dynamic job page works.

## Scenario C — vacancy application
1. applicant opens published job
2. completes fields
3. uploads safe PDF CV
4. accepts privacy/declaration
5. submits
6. application persisted
7. reference shown
8. CV private
9. admin notified
10. candidate appears NEW.

## Scenario D — closed vacancy
1. owner closes vacancy
2. page shows closed/unavailable state
3. Apply button disabled
4. API refuses new vacancy application
5. EOI remains optional.

## Scenario E — recruitment pipeline
1. NEW → REVIEWING
2. event recorded
3. SHORTLISTED
4. interview created
5. reference check added
6. OFFER
7. timeline complete.

## Scenario F — hire
1. Admin clicks Hire Candidate
2. final employment decision entered
3. duplicate staff check
4. staff created/linked
5. lifecycle onboarding
6. rosterable false
7. candidate stage hired
8. Worker 360 opens
9. Agreement Generator available
10. onboarding/readiness continues.

## Scenario G — security
- anonymous cannot list applicants
- anonymous cannot read CV
- applicant cannot enumerate other applications
- admin route returns 401 without admin session
- no service role in browser bundle
- storage private
- short-lived signed links.

## Scenario H — sensitive information
Search DB/schema/UI/client:
- no TFN field
- no bank field
- no super account field
- no DOB
- no screening identifiers in initial application
- no applicant health/diagnosis question.

---

# 37. File-by-file implementation map

Implementation agent should inspect current main first, but expected changes are approximately:

## Public
- `app/careers/page.tsx`
- `app/careers/[slug]/page.tsx`
- `components/careers/CareersLanding.tsx`
- `components/careers/JobCard.tsx`
- `components/careers/JobApplicationForm.tsx`
- `components/careers/ExpressionOfInterestForm.tsx`
- `components/SiteHeader.tsx`
- `components/SiteFooter.tsx`

## API
- `app/api/careers/vacancies/route.ts`
- `app/api/careers/vacancies/[slug]/route.ts`
- `app/api/careers/applications/route.ts`
- `app/api/admin/recruitment/...`

## CRM
- `components/admin/RecruitmentTab.tsx`
- supporting vacancy/candidate drawers/components
- `app/admin/page.tsx` add `recruitment` tab, import and render only

Do not add the whole Recruitment UI directly into the already very large `app/admin/page.tsx`; use extracted components.

## Services / validation
- `lib/recruitment.ts`
- `lib/recruitmentValidation.ts`
- `lib/email.ts` recruitment send functions
- optional helpers under `lib/services`

## Database
- additive migration under `supabase/migrations/`

## Tests
- recruitment unit/integration test file(s)
- browser/E2E for public apply and Admin workflow

---

# 38. Quality standard for implementation agent

Must run:

```bash
git diff --check
npm test
npm run typecheck
npm run lint
npm run build
```

Then browser acceptance for:

- Careers responsive layout
- vacancy publish/unpublish
- actual public submission
- private document access
- CRM candidate pipeline
- Hire → Staff handoff.

Use controlled fixtures and clean them.

No real applicant details in automated test data.

---

# 39. What ChatGPT has deliberately decided before implementation

These decisions should not be reinvented by the implementation agent:

- recruitment records remain separate from Staff until Hire
- no fake vacancy seed
- Careers page supports EOI
- private CV storage
- no TFN/bank/super/DOB in recruitment
- no screening numbers at initial application
- worker declarations are never treated as verified evidence
- NDISWC = Opus policy, legally accurate public wording
- WWCC = child-related only
- service locations reuse existing region config
- job ad pay has safe display modes
- applicant emails never carry the résumé
- Admin Recruitment lives inside the existing CRM
- Hire links/creates canonical Staff
- existing Agreement Generator is reused
- roster readiness remains fail-closed
- no algorithmic/AI candidate ranking
- retention is configurable business policy, not falsely called a statutory period
- no public recruitment data leakage.

---

# 40. Implementation handoff gate

Do not hand this to an implementation agent until the owner is satisfied with this product definition.

When implementation begins, the agent's job is:

**implement this agreed build pack faithfully, not redesign the recruitment product.**

The implementation agent should report deviations only where the current repository makes an exact detail technically invalid, and then use the closest architecture-preserving solution.

---

# 41. Official-source principles used while preparing this pack

This product definition was prepared against current official guidance as of September 2026, including:

- Fair Work Ombudsman: job ads must not advertise pay below applicable minimum entitlements.
- OAIC: the employee-record exemption does not simply cover prospective unsuccessful applicants; applicant privacy should be handled carefully.
- Australian Human Rights Commission: recruitment advertisements and selection should focus on genuine job requirements and avoid discriminatory criteria; accessible recruitment and reasonable adjustments are good practice.
- NSW Office of the Children's Guardian: WWCC applies to child-related work, not every adult disability-support role.
- NDIS Quality and Safeguards Commission: an unregistered provider is not legally required by registration rules to mandate NDIS Worker Screening, but may choose to require it and the Commission recommends clearances.

No part of this pack should be used to make Opus Care appear to be a registered NDIS provider.

---

# FINAL REPOSITORY-VERIFIED ADDENDUM — 15 SEPTEMBER 2026

This addendum overrides any conflicting implementation detail earlier in this document.

## A. Verified starting baseline

At preparation time:

- Repository: `iamnarace/NDIS_Project`
- Latest `main` commit verified: `c9de7c7031323fedc26d09b9cd78ee4836edc959`
- Commit message: `feat(governance): true e2e payslip acceptance with authenticated rls, bearer auth support, and payroll notice`
- Latest verified Vercel Production deployment for that commit: `dpl_6JSop5qQcyr59X1wCwUSfyLUdkUk`
- Production state: `READY`
- Production site: `https://opuscare.com.au`

The implementation agent MUST fetch current remote state before working. If `main` has moved forward, the newer remote `main` is the source of truth. Never reset newer owner-approved work back to this SHA.

## B. Verified current website integration points

Current navigation lives in:

- `components/SiteHeader.tsx`
- `components/SiteFooter.tsx`

Careers must be added to desktop navigation, mobile navigation and Footer Quick Links without replacing the existing Make a Referral CTA.

Public website uses Next.js App Router and existing Opus design classes. Careers should reuse that system instead of introducing another component/style framework.

## C. Verified current CRM integration point

Current Admin CRM is primarily composed from:

- `app/admin/page.tsx`

It already imports extracted modules such as workforce, invoicing, quotes, timesheets, worker readiness, agreements and other Admin components.

`app/admin/page.tsx` is already very large.

Therefore:

**DO NOT implement the Recruitment UI inline inside that file.**

Create an extracted module such as:

`components/admin/RecruitmentTab.tsx`

and supporting child components.

`app/admin/page.tsx` should only receive the minimal integration:
- `recruitment` TabType
- icon/label/tab navigation entry
- import
- render switch.

## D. Verified current Staff model facts

Production `public.staff` currently has:

- canonical UUID `id`
- human `reference_number`
- `full_name`
- `role`
- `phone`
- `email`
- `suburbs`
- `engagement_type`: employee / contractor
- `status`
- `lifecycle_stage`
- `is_rosterable`
- credential/readiness fields
- `hourly_rate`
- `ndis_orientation_completed`
- AHPRA/clinical fields.

Production currently does **not** have a dedicated canonical:
- `employment_basis`
- `employment_start_date`

Recruitment must not misuse `engagement_type` as casual/part-time/full-time.

If still absent at implementation time, add:

`staff.employment_basis`

values:
- `casual`
- `part_time`
- `full_time`
- `fixed_term`
- `not_applicable`

and:

`staff.employment_start_date date null`

For contractors, `employment_basis = not_applicable`.

### Important fail-closed insertion rule

Current database defaults are not safe enough to rely on during Candidate → Staff conversion.

The current production schema has historically included defaults such as:
- worker screening default that may appear verified
- default hourly rate
- historical suburb defaults.

Therefore the Hire endpoint MUST explicitly write safe onboarding values rather than allowing database defaults to imply readiness.

For a NEW Staff record created from recruitment, explicitly set:

- `status = 'pending'`
- `lifecycle_stage = 'onboarding'`
- `is_rosterable = false`
- `ndis_screening = 'Unknown / Needs Verification'`
- credential expiry/evidence fields = null/unverified
- `ndis_orientation_completed = false`
- `hourly_rate = null` unless an owner-confirmed rate has deliberately been entered in the final hiring/employment setup
- `suburbs` = owner-approved service areas from hiring decision, never historical DB defaults
- `readiness_notes` includes source APP reference.

No self-declared recruitment screening answer may populate a verified workforce credential.

## E. Verified staff API pattern

Existing Staff API:

`app/api/crm/staff/route.ts`

already follows the desired worker-intake safety model:
- Admin authenticated
- pending worker
- applicant/onboarding lifecycle
- not rosterable
- credentials unverified.

The Hire Candidate service should reuse/extract the same worker-creation logic rather than duplicating divergent rules.

Prefer a shared server-side service function, for example:

`lib/services/staffIntake.ts`

used by:
- manual Add Worker
- Hire Candidate conversion.

This avoids two different worker-creation rules.

## F. Verified private Storage architecture

Current live Supabase bucket:

`crm-documents`

is:
- private
- 15 MB bucket maximum
- supports PDF
- DOC
- DOCX
- common image formats.

Recruitment may reuse the private bucket but should use its own metadata table (`job_application_files`).

Do NOT force applicant CVs into `public.documents`, because that table is designed around participant/staff/referral owners and applicant records should remain separate until hire.

Recruitment path:

`recruitment/applications/<application_uuid>/<random>_<safe_filename>`

Application-specific validation:
- Resume max 8 MB
- Cover letter max 5 MB
- PDF / DOC / DOCX only.

Admin downloads via short-lived signed URL.

## G. Verified current email architecture

Current email implementation:
- `lib/email.ts`
- Resend
- `RESEND_API_KEY`
- `FROM_EMAIL`
- referral/contact destination configuration.

Recruitment should extend this file or an extracted email module that uses the same Resend client/config.

Add environment fallback:

`CAREERS_TO_EMAIL=support@opuscare.com.au`

But owner self-service should be preferred.

If still absent, add server-side `provider_config.careers_email text null`.

Resolution order:
1. configured `provider_config.careers_email`
2. `CAREERS_TO_EMAIL`
3. `provider_config.support_email`
4. `support@opuscare.com.au`

Do not expose private provider-config fields from a public API merely to send email.

## H. Verified provider configuration

Production `provider_config` already contains owner-editable organisation fields including:
- website URL
- support email
- referrals email
- service regions
- age scope
- social destinations
- business/governance settings.

Recruitment should add only the smallest needed owner settings:

- `careers_email text null`
- `recruitment_retention_months integer default 12`

Do not add a new global settings table just for Careers.

## I. Verified service-area source

Use:

`lib/regions.ts`

as the canonical location source.

It already contains:
- Northern NSW regions
- Sydney service locations
- operational service coverage.

Recruitment can reuse region IDs / labels.

Important:
do not blindly reuse marketing description strings that claim immediate capacity. Careers should use location names only unless copy is specifically reviewed for recruitment.

## J. Current public age scope

Production `provider_config.age_scope` is currently `18+`.

Therefore:
- public general Disability Support Worker vacancy must not present WWCC as universally required.
- only show WWCC field when `job_vacancies.child_related_role = true`.
- current launch vacancies should normally have `child_related_role = false`.

## K. Applicant Privacy architecture

Public applicant data must be stored only in the recruitment tables until hire.

Do not create:
- profile account
- staff account
- participant record
- generic document owner
for a normal applicant.

No public applicant portal is required in v1.

Applicant gets a reference number but not an authenticated account.

## L. RLS / API architecture decision

Use API-mediated access.

Recruitment tables:
- RLS enabled
- no anonymous direct table reads
- no anonymous direct table inserts
- no general authenticated-user table access by default.

Public website talks to:
- `GET /api/careers/vacancies`
- `GET /api/careers/vacancies/[slug]`
- `POST /api/careers/applications`

Server validates and performs controlled service-role actions.

Admin talks to protected Admin Recruitment APIs using existing Admin authentication.

This is intentionally consistent with the current Opus architecture and easier to audit than exposing recruitment tables directly to anonymous Supabase clients.

## M. Vacancy publication rules

A vacancy is publicly discoverable only when ALL are true:

- `status = 'published'`
- `published_at is not null`
- opening date is null or <= now
- closing date is null or > now
- not archived
- required public fields valid.

A `closed` vacancy may retain a public read-only page if desired for a short period, but:
- Apply CTA disabled
- POST application rejected for vacancy route
- EOI option remains available.

Draft/archived vacancy must never be publicly enumerated.

## N. Applicant reference generation

Existing helper:

`lib/referenceNumber.ts`

generates human display references from a table's `reference_number`.

Use existing project convention rather than adding a second reference-number subsystem.

Recommended:
- `JOB-00001`
- `APP-00001`

If concurrency is a concern, implementation agent may improve the helper safely or use a DB sequence, but it must not break existing REF/STF references.

## O. Recruitment retention

`12 months` is an owner business-policy default, not a claim of universal statutory requirement.

UI:
- retention due
- extend retention when owner has a legitimate reason
- purge action with explicit confirmation.

Purge must:
- remove private CV/cover files
- remove/redact PII according to policy
- not silently erase immutable business audit events required to explain system actions.

Implementation agent must document the exact purge behaviour.

## P. Recruitment files must not enter the Staff document register automatically

After Hire:
- CV can remain in recruitment record for approved retention.
- do not reclassify CV as a verified worker credential.
- actual First Aid, CPR, screening, licence, insurance and identity evidence must be uploaded through the existing governed workforce evidence workflow.

## Q. Hire Candidate transaction

Candidate → Staff conversion should be transaction-safe.

Preferred server-side sequence:

1. lock/read candidate
2. ensure stage not already `hired`
3. duplicate staff lookup
4. Admin chooses create vs link
5. create/link `staff`
6. update candidate `converted_staff_id`
7. set candidate stage `hired`
8. set `hired_at`
9. append immutable `hired` event
10. return Staff reference and next actions.

If any required write fails:
- do not leave a candidate marked Hired without a linked Staff record.

Use a Postgres RPC transaction if that is cleaner than multiple independent HTTP writes.

## R. No algorithmic candidate ranking

No:
- AI CV scoring
- automated reject score
- protected-attribute inference
- personality inference
- facial analysis
- candidate ranking model.

Filters and human pipeline management only.

## S. Official-source factual basis verified 15 September 2026

### Fair Work Ombudsman — Job ads
https://www.fairwork.gov.au/starting-employment/job-ads

Current guidance: a job ad cannot advertise a pay rate below the employee's minimum entitlement under the Fair Work Act or applicable industrial instrument.

### Fair Work Ombudsman — Hiring employees
https://www.fairwork.gov.au/starting-employment/hiring-employees

Employment status (full-time, part-time, casual) and applicable award/conditions must be determined correctly.

### OAIC — Employee records exemption
https://www.oaic.gov.au/privacy/privacy-guidance-for-organisations-and-government-agencies/organisations/employee-records-exemption

The employee-record exemption does not simply cover future employment relationships; unsuccessful prospective applicants are not automatically within that exemption.

### Australian Human Rights Commission — Recruiting people with disability
https://humanrights.gov.au/resource-hub/resources-for-organisations-businesses/disability-resources-employers/attracting-and-recruiting-people-with-disability-to-your-organisation

Current guidance supports accessible recruitment, reasonable adjustments, removing non-essential barriers and avoiding intrusive unrelated health questions.

### NSW Office of the Children's Guardian — Who needs a WWCC
https://ocg.nsw.gov.au/working-children-check/who-needs-check

WWCC applies to child-related work involving under-18s as defined by NSW requirements; people who do not work/deliver services to children generally do not need a NSW WWCC.

### NDIS Quality and Safeguards Commission — Worker screening for unregistered providers
https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-unregistered-providers

Unregistered providers are not legally required under provider-registration rules to require worker screening clearance, but may choose to require it; the Commission recommends doing so.

## T. Handover discipline

The implementation agent is NOT being asked:
- “design a careers system”
- “make a recruitment roadmap”
- “research what we should build”.

The decisions are already made in this specification.

The agent is being asked:

**Implement this specification into the existing Opus architecture, report only genuine architecture conflicts, prove acceptance, and do not invent a different recruitment product.**
