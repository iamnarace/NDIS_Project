# CarePoint Support Services — Complete Antigravity Handoff

**Project:** CarePoint Support Services  
**Repository:** `iamnarace/NDIS_Project`  
**Primary branch:** `main`  
**Project type:** Public-facing disability support / NDIS-related business website  
**Current stage:** Foundation website built and live as a Vercel sample; business/compliance details are still partly placeholders; GitHub→Vercel Git integration is NOT yet complete.  
**Handoff date:** 22 August 2026 (Australia/Sydney)

---

## 0. READ THIS FIRST — EXECUTION DIRECTIVE

Do **not** restart discovery or create a brand-new plan unless a blocking technical fact forces it.

Continue from the existing repository and live site.

Your job is to:

1. inspect the existing repo and preserve good work;
2. reconcile the GitHub source with the currently working live Vercel deployment;
3. upgrade/fix dependencies where needed;
4. connect the existing GitHub repository to the existing Vercel project;
5. make `main` the production source of truth;
6. finish the website to a professional launch-ready **sample** standard while keeping unverified business facts clearly marked;
7. verify desktop/mobile UX, accessibility, navigation, forms, build, deployment and all links;
8. leave clear evidence of what is real vs placeholder.

Do **not** falsely advertise CarePoint as a registered NDIS provider.

Do **not** invent an ABN, registration number, insurance certificate, employee count, years of experience, participant testimonials, office address, phone number, domain ownership or clinical capability.

Do **not** add high-risk/specialist supports merely to make the service catalogue look bigger.

---

# 1. BUSINESS CONCEPT

## Working business name

**CarePoint Support Services**

This is the user's preferred working name.

The intended business is a small, professional disability support service in NSW/Australia, initially structured around the **unregistered provider** model.

### Intended initial participant market

- Self-managed NDIS participants
- Plan-managed NDIS participants

The website must **not** imply that agency-managed/NDIA-managed participants can automatically use CarePoint while CarePoint remains unregistered.

### Current confirmed worker credentials from the owner

The owner has stated that he already has:

- NDIS Worker Screening Clearance
- First Aid course/certificate

The current UI also mentions **First Aid & CPR**. Before final public launch, verify whether CPR is separately current before keeping that exact wording.

### Current intended geography

Working/sample positioning:

- Greater Sydney, NSW

Exact suburbs/travel boundaries are **not yet final**.

### Current provider status

Working position:

- **Unregistered NDIS provider model**
- Not a registered NDIS provider

The site should explicitly avoid an “NDIS Registered Provider” badge unless formal registration is later confirmed.

---

# 2. PRODUCT / WEBSITE GOAL

This is not supposed to be a one-page hobby site.

The user wants a **solid, competitive, professional business website and operational foundation** comparable in confidence and clarity to established Australian disability support providers, while still feeling personal and appropriate for a small provider.

The website should serve four primary audiences:

1. NDIS participant
2. family member / nominee
3. support coordinator
4. plan manager / referring professional

Primary conversion actions:

- Understand services quickly
- Check whether CarePoint may be suitable
- Make a referral / enquiry
- Contact CarePoint
- Understand the onboarding process
- View essential policies / trust information

---

# 3. BRAND / UX DIRECTION

## Brand personality

CarePoint should feel:

- calm
- safe
- professional
- approachable
- human
- dependable
- modern
- not overly clinical
- not childish
- not like a generic hospital website
- not like a copied NDIS template

## Current visual direction

The existing site uses:

- deep teal / green-blue as the primary colour
- fresh mint / pale green backgrounds
- warm/clean white surfaces
- dark green text
- rounded cards and buttons
- spacious layout
- compact CP monogram/logo

The existing CSS direction is approximately:

- deep brand teal: around `#067b77` / `#093d40`
- soft mint: around `#f4faf8`, `#e2f3ee`
- dark text: around `#113f3b`, `#17332f`

Preserve this overall direction unless refinement materially improves accessibility/quality.

## Logo direction

Current logo is a small **CP** monogram inside a rounded asymmetric square/soft geometric mark with a teal-to-mint gradient.

Current header wordmark:

**CarePoint**  
**Support Services**

The current logo is a solid starting mark, not necessarily final brand artwork.

If refining it:

- keep it simple and recognisable;
- avoid disability stereotypes;
- avoid medical crosses unless there is a strong reason;
- avoid copying the NDIS logo or visual identity;
- ensure it works as favicon/app/social mark;
- create monochrome-friendly and small-size variants if possible.

---

# 4. CURRENT LIVE WEBSITE

## Live production sample

Primary alias:

`https://carepoint-support-services.vercel.app`

Secondary alias:

`https://carepoint-support-services-naresh-project2054.vercel.app`

The live production site was verified returning HTTP 200.

## Vercel project

**Project name:** `carepoint-support-services`  
**Project ID:** `prj_tCb4viWhxNxIqJlxSF5Yz2i8TC4W`  
**Team:** `Naresh's projects`  
**Team slug:** `naresh-project2054`  
**Team ID:** `team_2OnVfeLuiwliGpr4HjG5PspM`  
**Framework:** Next.js  
**Vercel node version reported:** `24.x`

## Current verified successful production deployment

**Deployment ID:** `dpl_3phq9YVkya9pabmQJwmgrkzkZxHv`  
**Deployment URL:** `carepoint-support-services-fvyecqfmr-naresh-project2054.vercel.app`  
**Ready state:** `READY`  
**Target:** production

## Critical Vercel history

There were two failed deployment attempts before the successful one.

### Failure 1

Deployment:

`dpl_AXAGWrMVjnvLeGx3wvKn5A6wRAhQ`

Failure cause:

- several policy page files in the **direct Vercel deployment payload** were truncated;
- JSX ended before the closing function brace;
- this caused syntax errors such as `Expected '}', got '<eof>'`.

This was a direct-deployment packaging error, not evidence that all equivalent GitHub source files were broken.

### Failure 2

Deployment:

`dpl_33qe2nctuFwLqy3ucJdtN5kmN4jA`

Build itself compiled, but Vercel blocked production because the deployment used:

`next@15.5.2`

Vercel returned:

`VULNERABLE_NEXTJS_VERSION`

with reference to CVE-2025-66478.

### Successful deployment

The final successful direct deployment used:

`next@15.5.21`

and completed:

- install
- Next.js production compile
- type/lint validation
- static page generation
- serverless function creation
- deployment

Vercel marked it `READY`.

---

# 5. CRITICAL SOURCE-OF-TRUTH ISSUE

This must be resolved **before automatic Git deployment is enabled**.

The current GitHub repository `main` still has:

```json
"next": "15.5.2"
```

in `package.json`.

The verified live Vercel build was deployed directly with:

```json
"next": "15.5.21"
```

Therefore:

> **LIVE VERCEL IS CURRENTLY AHEAD OF / DIFFERENT FROM GITHUB MAIN.**

Antigravity must first reconcile the repository with the verified live build.

### Required action

1. inspect every existing GitHub file;
2. upgrade GitHub `package.json` to a patched supported Next.js release;
3. preferably use the latest appropriate stable/LTS release compatible with the current code after checking Next.js migration requirements;
4. run install/build/type/lint checks;
5. preserve the website routes and design;
6. only after GitHub source builds cleanly should Git integration become the production deployment path.

Do not connect GitHub first and allow an old vulnerable `main` deployment to replace the good live build.

---

# 6. GITHUB / VERCEL CONNECTION STATUS

Repository:

`https://github.com/iamnarace/NDIS_Project`

Repo visibility at project creation time was private.

Current Vercel deployment was created via direct file deployment.

**GitHub automatic deployment integration has NOT been confirmed/completed.**

The final desired state is:

`iamnarace/NDIS_Project` → Vercel project `carepoint-support-services`

with:

- `main` = production branch
- pushes/merges to `main` automatically create production deployments
- pull requests/feature branches create preview deployments where appropriate

### Preferred safe connection sequence

1. Make GitHub main build-equivalent to or better than the current live site.
2. Commit all necessary fixes.
3. Verify local production build.
4. In Vercel, attach/import the existing GitHub repository into the **existing** project if supported.
5. Avoid creating a duplicate Vercel project unless there is no safe way to reuse the current project.
6. Confirm production branch = `main`.
7. Trigger a small safe commit.
8. Verify resulting deployment is Git-sourced and READY.
9. Verify `carepoint-support-services.vercel.app` points to the new Git-sourced READY deployment.
10. Record project/deployment IDs and commit SHA.

---

# 7. CURRENT REPOSITORY STRUCTURE / MAJOR FILES

Important existing files include:

- `app/page.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/services/page.tsx`
- `app/about/page.tsx`
- `app/referral/page.tsx`
- `app/contact/page.tsx`
- `app/faq/page.tsx`
- `app/privacy/page.tsx`
- `app/complaints/page.tsx`
- `app/incident-management/page.tsx`
- `app/code-of-conduct/page.tsx`
- `app/api/referral/route.ts`
- `components/SiteHeader.tsx`
- `components/SiteFooter.tsx`
- `components/ReferralForm.tsx`
- `public/carepoint-mark.svg`
- `app/icon.svg`
- `package.json`
- `tsconfig.json`
- `README.md`
- `docs/ANTIGRAVITY_HANDOFF.md`

There may be additional files. Inspect the repository rather than assuming this list is exhaustive.

---

# 8. CURRENT ROUTES / INFORMATION ARCHITECTURE

The target website structure is:

## `/`
Home page

Contains / should contain:

- brand header
- trust/positioning strip
- hero
- primary CTA to referral
- secondary CTA to services
- credentials/trust points
- service overview
- audience shortcuts
- why CarePoint
- onboarding process
- safety/compliance foundation
- referral/contact CTA
- footer

## `/services`

Current initial services:

1. Daily Living Support
2. Community Participation
3. Transport Support
4. Life Skills & Independence
5. Companionship & Social Support
6. Household & Practical Assistance

Keep the copy cautious and participant-led.

Do not casually add:

- nursing
- medication management
- restrictive practices
- complex bowel care
- high intensity supports
- SIL
- SDA
- behaviour support
- allied health
- clinical care

unless the business is actually qualified/authorised/configured for those services.

## `/about`

Purpose:

- founder/business story when real details are supplied
- values
- personal + professional positioning
- transparent current provider model
- credentials that are actually verified

Do not invent a long operating history.

## `/referral`

Audience:

- participant
- family / nominee
- support coordinator
- plan manager
- professional

First-contact form should remain minimal.

Avoid collecting detailed medical reports, identity documents or unnecessary sensitive information through the initial website form.

## `/contact`

Should ultimately include:

- final phone
- final business email
- hours
- service area
- enquiry CTA

Current values are placeholders where noted.

## `/faq`

Current FAQ themes:

- who can use CarePoint?
- is CarePoint registered?
- how pricing works
- service agreements
- professional referrals

Expand later using real operating details.

## Policy routes

- `/privacy`
- `/complaints`
- `/incident-management`
- `/code-of-conduct`

These currently represent **draft public-facing policy foundations**, not legal certification.

---

# 9. REFERRAL FORM / EMAIL IMPLEMENTATION

A referral form component exists:

`components/ReferralForm.tsx`

Server route:

`app/api/referral/route.ts`

The server route is designed to send referral enquiries through **Resend** when environment variables exist.

Expected environment variables:

```text
RESEND_API_KEY
REFERRAL_TO_EMAIL
FROM_EMAIL
```

### Current safe behaviour

If the variables are absent, the endpoint should return a controlled message indicating online referrals are not yet configured and direct the user toward the working email placeholder.

### Required before real launch

- verify actual domain ownership;
- configure SPF/DKIM/DMARC as appropriate;
- use a legitimate sender domain;
- use a real monitored recipient mailbox;
- never expose the API key client-side;
- add abuse controls / validation / rate limiting as appropriate;
- define data retention handling;
- ensure privacy policy matches the actual data flow;
- test participant/professional submissions end-to-end;
- test failure states;
- avoid logging sensitive enquiry content unnecessarily.

Do not enable real participant submissions until this is complete.

---

# 10. WORKING / PLACEHOLDER BUSINESS DETAILS

These are **NOT final facts** unless the user later confirms them.

## Email placeholder

`support@carepointsupport.com.au`

This is a sample/working address only. Do not assume the domain is owned.

## Phone

Not yet confirmed.

Any old `1300 CAREPOINT` mention was placeholder marketing copy and must not be treated as a real allocated number.

## Service area

Working copy:

`Greater Sydney, NSW`

Exact suburbs/travel limits TBD.

## ABN

Not supplied.

## Business structure

Working concept is unregistered provider / sole trader or small provider structure, but final formal entity setup should be confirmed.

## Insurance

Final insurer, policy numbers, public liability amount, professional indemnity amount, vehicle/business-use coverage etc. have **not been supplied**.

Do not publish “fully insured” or specific dollar amounts until evidence exists.

## NDIS registration

Not registered at this stage.

Do not use the wording “Registered NDIS Provider”.

---

# 11. DOMAIN STATUS

The following domain ideas were checked through Vercel and were reported unavailable / not available for purchase there:

- `carepointsupport.com.au`
- `carepointsupportservices.com.au`
- `carepointss.com.au`

Do not build email or production branding around one of these until ownership/availability is independently confirmed.

The user needs a final domain decision later.

Possible future task:

- research strong alternative `.com.au` domains;
- check ASIC/business-name/trademark conflicts separately before adopting a final brand/domain;
- once confirmed, attach custom domain to Vercel;
- configure www/non-www redirects;
- configure email domain separately.

---

# 12. NDIS / COMPLIANCE POSITIONING

This website should be conservative and accurate.

## Current working principles

- Unregistered providers may work with eligible self-managed and plan-managed participants, subject to actual funding/support circumstances.
- Unregistered providers are still subject to the NDIS Code of Conduct.
- Do not imply the website itself constitutes NDIS registration or NDIS Commission approval.
- The owner wants professional systems and documentation even though the initial model is unregistered.

## Website should visibly support trust through

- Code of Conduct commitment
- complaints/feedback pathway
- incident-management approach
- privacy/confidentiality approach
- worker screening credential (where verified)
- First Aid credential (where verified)
- service agreement process
- participant choice/control language
- transparent provider status
- no misleading NDIS branding

## Pricing

The current pricing context is the **2026–27 NDIS pricing period**, effective from 1 July 2026.

Do not hard-code public rates until:

- exact services are mapped to valid current support items;
- funding model is understood;
- weekday/evening/weekend/public holiday structure is determined;
- provider travel / transport charging rules are confirmed;
- cancellation terms are confirmed;
- owner approves commercial rates.

---

# 13. OPERATIONAL DOCUMENT SYSTEM — FUTURE BUSINESS PACK

The user ultimately wants a complete professional business system, not only the website.

The following documents/workflows should eventually exist and be reviewed before real service delivery.

## Participant-facing documents

- Service Agreement
- Schedule of Supports / service schedule
- Participant Intake Form
- Consent & Information Sharing Form
- Privacy Consent / Collection Notice
- Emergency Contact Form
- Support Preferences / Communication Profile
- Participant Goals summary
- Home / Community Risk Assessment
- Transport Consent (if applicable)
- Cancellation / travel terms
- Feedback / Complaint Form
- Incident follow-up communication template

## Operational templates

- Shift / progress note template
- Incident report form
- Hazard / risk report form
- complaints register
- incident register
- participant document checklist
- worker credential register
- insurance register
- service agreement renewal tracker
- client onboarding checklist
- offboarding checklist
- invoice template
- referral tracker
- contact / lead tracker
- support coordinator outreach tracker

## Policy library target

At minimum consider:

- NDIS Code of Conduct commitment/policy
- Privacy & Confidentiality
- Complaints & Feedback
- Incident Management
- Work Health & Safety
- Risk Management
- Infection Prevention / Hygiene
- Emergency & Disaster Planning
- Participant Rights, Dignity, Choice & Control
- Violence, Abuse, Neglect, Exploitation & Discrimination prevention/response
- Conflict of Interest
- Record Keeping / Document Control
- Information Security
- Worker Screening / Credential Management
- Service Delivery / Continuity
- Transport / Vehicle Safety (if providing transport)
- Medication policy only if medication support is actually in scope
- child-safety/WWCC procedures only where children are actually served

Do not generate policy claims that exceed actual capability.

---

# 14. WEBSITE CONTENT / COPY PRINCIPLES

Use Australian English.

Preferred tone:

- simple
- respectful
- clear
- warm
- professional
- participant-led

Avoid:

- “suffering from disability”
- pity-based language
- overuse of “care” when “support” is more appropriate
- exaggerated promises
- “best NDIS provider” claims
- fake testimonials
- fake participant counts
- fake awards
- fake star ratings
- “24/7 support” unless true
- medical/clinical claims outside scope

Use language such as:

- your goals
- your choices
- your routine
- support that fits your life
- clear agreements
- reliable communication
- independence
- community participation
- choice and control

---

# 15. ACCESSIBILITY REQUIREMENTS

This is especially important for a disability support website.

Before calling the site finished:

- keyboard navigation must work;
- visible focus states;
- semantic heading order;
- labels for all form fields;
- sufficient colour contrast;
- no essential meaning conveyed by colour alone;
- touch targets mobile-friendly;
- responsive text without clipping;
- sensible max line lengths;
- form errors announced/accessibly associated;
- respect reduced-motion preference if animations are added;
- alt text for meaningful images;
- decorative images ignored by assistive tech;
- mobile navigation actually usable, not just a decorative icon;
- test at 200% zoom;
- basic WCAG 2.2 AA mindset.

The current mobile “menu” implementation may simply link to Contact rather than opening a real navigation drawer. Verify and improve this.

---

# 16. SEO / TECHNICAL WEBSITE REQUIREMENTS

Current site has basic metadata.

Target final baseline:

- unique title/description per key page
- metadataBase when custom domain is known
- Open Graph
- Twitter/social metadata if useful
- favicon/logo variants
- `robots.ts`
- `sitemap.ts`
- canonical URLs after final domain
- local service area wording
- organisation structured data only with real business facts
- no fake reviews schema
- no fake LocalBusiness address
- performance optimisation
- Core Web Vitals review
- image optimisation
- 404 page
- good link structure

Current sitemap/robots must be updated from Vercel alias to final custom domain later.

---

# 17. IMAGERY

The current website intentionally does not use copied competitor photos.

Preferred future imagery:

1. authentic CarePoint photos with permission; or
2. properly licensed Australian disability/community imagery; or
3. carefully created original visuals that do not misrepresent real participants.

Do not:

- scrape competitor imagery;
- imply an AI-generated person is a real CarePoint participant;
- use exploitative/stereotyped disability imagery;
- use stock photography full of unrelated “medical staff” if CarePoint is not clinical.

If using sample imagery during development, clearly treat it as design placeholder material.

---

# 18. RECOMMENDED PAGE ENHANCEMENTS

After source/deployment reconciliation, strengthen the site with:

## Home

- stronger real visual hero once imagery is available
- capability/availability message
- clear service area
- referral trust strip
- short FAQ preview
- final contact details when provided

## Services

Each service should eventually have:

- what it is
- examples
- who it may suit
- what it does NOT include
- funding/eligibility disclaimer
- referral CTA

Consider individual service pages only if they genuinely improve SEO/user clarity.

## About

Once user supplies real info:

- founder story
- relevant experience
- why CarePoint was created
- language/cultural capability if relevant and true
- verified qualifications

## Referrals

Add:

- capacity/availability selector if useful
- preferred days/times
- simple consent
- success page
- secure backend
- spam protection

Do not collect NDIS participant number in an unsecured generic first-contact form unless there is a clear need and secure process.

## Contact

Add final:

- phone
- email
- hours
- service areas
- response-time expectation only if operationally realistic

---

# 19. EMAIL / BUSINESS COMMUNICATION SYSTEM

Longer-term target:

- professional domain mailbox
- generic inbox such as `support@...` or `hello@...`
- referrals inbox if volume warrants it
- branded email signature
- acknowledgement email
- referral received email
- request for more information email
- service agreement email
- onboarding confirmation
- appointment/session confirmation if used
- cancellation/change template
- feedback/complaint acknowledgement
- invoice/reminder templates
- support coordinator introduction email

Resend can be used for website/transactional email, but final domain and sender verification must be completed first.

The user has previously considered automated professional emails with logo/branding and wants as much routine administration automated as practical.

---

# 20. BUSINESS DEVELOPMENT / CLIENT ACQUISITION FOUNDATION

Future marketing/referral work should support:

- local support coordinators
- plan managers
- participants/families
- community organisations
- allied health referral relationships where appropriate
- self-managed participant communities

Create later:

- one-page referral/capability PDF
- support coordinator outreach email
- participant flyer
- referral QR code
- Google Business Profile when real business details qualify
- local SEO pages only when they are genuinely useful and not spammy

Do not claim partnerships/referral relationships that do not exist.

---

# 21. CURRENT TECH STACK

Current project foundation:

- Next.js App Router
- React 19
- TypeScript
- `lucide-react`
- CSS in `app/globals.css`
- Vercel hosting

Current GitHub package file at handoff still declares:

- Next.js `15.5.2` **(must be upgraded/reconciled; vulnerable build was blocked by Vercel)**
- React `19.1.0`
- React DOM `19.1.0`
- TypeScript `^5.7.2`

The successful Vercel sample build used Next.js `15.5.21`.

Do not blindly run `npm audit fix --force` and accept breaking changes. Upgrade deliberately and verify.

---

# 22. EXACT FIRST EXECUTION PASS FOR ANTIGRAVITY

Perform this in order.

## Step A — Inspect

```powershell
cd <local path to NDIS_Project>
git status
git branch --show-current
git log --oneline -10
```

Inspect:

- `package.json`
- lockfile if present
- all `app/**`
- `components/**`
- `public/**`
- `README.md`
- this handoff

Do not overwrite blindly.

## Step B — Reconcile dependency/security issue

- upgrade Next.js away from `15.5.2`;
- choose a supported patched version;
- verify any migration requirements;
- update lockfile.

Then run the repository’s appropriate checks.

At minimum:

```powershell
npm install
npm run build
```

If lint/typecheck scripts are added/available, run them too.

## Step C — Compare website to live sample

Live:

`https://carepoint-support-services.vercel.app`

Check that GitHub source reproduces or improves:

- header
- CP branding
- home
- services
- about
- FAQ
- referral
- contact
- privacy
- complaints
- incidents
- code of conduct
- responsive CSS

## Step D — Fix mobile navigation

Current mobile navigation needs review. Implement a real accessible menu/sheet or equivalent.

## Step E — Verify referral behaviour

Without Resend env variables:

- referral form must fail gracefully;
- no sensitive data is silently lost while telling user it succeeded.

With real env values later:

- send server-side only;
- validate safely.

## Step F — GitHub/Vercel connection

Connect this exact repo to the existing project:

- repo: `iamnarace/NDIS_Project`
- Vercel project: `carepoint-support-services`
- project ID: `prj_tCb4viWhxNxIqJlxSF5Yz2i8TC4W`
- team ID: `team_2OnVfeLuiwliGpr4HjG5PspM`
- production branch: `main`

Do not accidentally connect to one of the user's other Vercel projects.

## Step G — Prove Git deployment

Make a harmless documented commit after integration.

Confirm deployment metadata is Git-sourced and maps to that commit SHA.

Confirm:

`https://carepoint-support-services.vercel.app`

still works.

## Step H — Browser verification

Test at least:

- desktop width
- tablet width
- mobile width
- home navigation
- all route links
- referral form validation
- policy links
- 404
- no console errors
- no horizontal scrolling
- focus/keyboard basics

---

# 23. DEFINITION OF DONE FOR THE NEXT MILESTONE

Do not call the next milestone complete until all of these are true:

- [ ] GitHub `main` is the source of truth
- [ ] GitHub no longer uses vulnerable Next.js 15.5.2
- [ ] dependency lockfile is committed
- [ ] production build passes
- [ ] existing Vercel project is Git-connected to `iamnarace/NDIS_Project`
- [ ] production branch is `main`
- [ ] a Git-sourced production deployment is READY
- [ ] production alias resolves successfully
- [ ] Home works
- [ ] Services works
- [ ] About works
- [ ] Referral works in safe demo/unconfigured mode
- [ ] Contact works
- [ ] FAQ works
- [ ] Privacy works
- [ ] Complaints works
- [ ] Incident Management works
- [ ] Code of Conduct works
- [ ] mobile navigation is real and usable
- [ ] responsive layout verified
- [ ] basic accessibility verified
- [ ] no false NDIS registration claim
- [ ] no fake business credentials/details
- [ ] placeholders are clearly distinguishable from real facts
- [ ] documentation updated with final deployment ID + Git SHA

---

# 24. LATER LAUNCH GATES — DO NOT FAKE THESE

The site can be polished as a sample now, but real public business launch requires owner-supplied/finalised information.

Still needed:

- final business structure
- ABN
- registered business name status
- final phone
- final domain
- final email domain/mailboxes
- exact service area
- insurance evidence/details
- vehicle/business-use insurance if transport is offered
- exact qualifications/credentials to display
- exact services offered
- pricing/service-item mapping
- cancellation policy
- travel/transport charging policy
- service agreement approval
- privacy policy approval
- operational incident/complaints system
- secure participant record storage
- real referral form email/storage configuration
- final legal/compliance review appropriate to the business

Do not block website design work waiting for all of these, but never present missing items as completed facts.

---

# 25. IMPORTANT USER PREFERENCE FOR AGENT BEHAVIOUR

The user prefers agents to **execute exact instructions rather than repeatedly starting new plans**.

Therefore:

- continue from this handoff;
- inspect evidence first;
- make safe progress;
- report concrete results;
- do not ask questions that repository/Vercel evidence can answer;
- do not unnecessarily rewrite good existing work;
- do not claim success without validation;
- if something cannot be completed, state the exact blocker and leave the repo safe.

---

# 26. REQUIRED FINAL REPORT FORMAT FOR ANTIGRAVITY

When the first continuation pass is finished, report:

```text
CAREPOINT CONTINUATION REPORT

Repository:
Branch:
Starting SHA:
Ending SHA:
Working tree:

DEPENDENCIES
- Previous Next.js:
- Final Next.js:
- Lockfile:
- Security blocker resolved: YES/NO

BUILD
- install:
- typecheck:
- lint:
- production build:

VERCEL
- Team:
- Project name:
- Project ID:
- GitHub repository connected:
- Production branch:
- Deployment ID:
- Deployment commit SHA:
- Deployment state:
- Production URL:
- HTTP check:

UX / ROUTES
- Home:
- Services:
- About:
- Referral:
- Contact:
- FAQ:
- Privacy:
- Complaints:
- Incident management:
- Code of Conduct:
- Mobile navigation:
- Responsive check:
- Accessibility basics:

PLACEHOLDERS STILL OPEN
- final domain:
- email:
- phone:
- ABN:
- insurance:
- service area:
- pricing:
- other:

FILES CHANGED
<list>

BLOCKERS
<exact blockers or None>

NEXT RECOMMENDED STEP
<one clear next step>
```

---

# 27. CURRENT REFERENCE LINKS

GitHub repository:

`https://github.com/iamnarace/NDIS_Project`

Live sample:

`https://carepoint-support-services.vercel.app`

Vercel project:

- name: `carepoint-support-services`
- ID: `prj_tCb4viWhxNxIqJlxSF5Yz2i8TC4W`
- team: `naresh-project2054`

Latest verified READY direct deployment at handoff:

`dpl_3phq9YVkya9pabmQJwmgrkzkZxHv`

---

# 28. BOTTOM LINE

CarePoint is currently a **working professional sample website with a live Vercel deployment**, but it is not yet a fully launched NDIS business system.

The immediate engineering priority is not another redesign.

The immediate priority is:

> **Make GitHub main match or improve the verified live build, patch the Next.js dependency, connect the existing GitHub repo to the existing Vercel project, prove Git-sourced production deployment, then continue UX/compliance/business-system refinement from that stable base.**

Preserve the calm teal/mint CarePoint identity, participant-first UX, transparent unregistered-provider positioning, and strict separation between verified facts and placeholders.
