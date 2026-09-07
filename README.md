# Opus Care Support Services — Enterprise NDIS Platform & CRM

[![Production Status](https://img.shields.io/badge/Production-Live-success?style=for-the-badge&logo=vercel)](https://opuscare.com.au)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.21-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2017-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)

> **Live Production URL:** [https://opuscare.com.au](https://opuscare.com.au)  
> **GitHub Repository:** `iamnarace/NDIS_Project` (Branch: `main`)  
> **Hosting & CI/CD:** Vercel (Automatic deploys on push to `main`)  
> **Database:** Supabase PostgreSQL 17 (Sydney `ap-southeast-2`, Project Ref: `wqykzdodzcfwpgitnisx`)  
> **Email Service:** Resend API & Inbound Webhooks

---

## 🤖 AI & Developer Quick Reference

If you are an AI assistant or software engineer continuing work on this repository, read this section first:

1. **Single Global CSS Architecture**:
   - The design system uses **pure CSS** located in `app/globals.css` (no Tailwind CSS, no CSS modules).
   - Enterprise CRM and ERP styles start around line 2358 (`OPUS CARE ENTERPRISE CRM/ERP DASHBOARD`).
   - Portal styles start around line 8416. Kanban/timeline styles start around line 8602.
   - **Do NOT overwrite `app/globals.css` wholesale.** Always append new classes or make targeted edits.

2. **Authentication Architecture**:
   - **Admin CRM (`/admin`)**: Protected by cookie `opus_admin_session` (HMAC-SHA256 token), header `x-admin-key`, or `Authorization: Bearer <key>`. Defined in `lib/adminAuth.ts`. Passcode: `OpusCare2025!Admin`.
   - **Staff & Participant Portals**: Dedicated lightweight session states. Support worker default identity is `STF-001` (James Wilson) with fallback to `STF-002` (Sophie Clarke).

3. **Supabase Client Patterns**:
   - Server-side routes use `lib/supabase/admin.ts` (`createAdminClient()`), which prioritizes `SUPABASE_SERVICE_ROLE_KEY` with fallback to publishable/anon keys.
   - Database schema is centralized in `supabase/schema.sql`.

4. **Email Routing & Webhooks (DO NOT BREAK)**:
   - `referrals@opuscare.com.au` → Routed via Resend webhook to `/api/referral`.
   - `contact@opuscare.com.au` → Routed to `/api/contact`.
   - General aliases: `support@opuscare.com.au`, `hello@opuscare.com.au`.
   - Master webhook handler: `/api/email/inbound`.

---

## 🏛️ System Architecture Overview

```mermaid
graph TD
    A[Public Marketing Website /] -->|Inbound Referral| B[/api/referral]
    A -->|Contact Form| C[/api/contact]
    D[Resend Email Inbound] -->|Webhook| E[/api/email/inbound]

    B --> F[(Supabase Database)]
    C --> F
    E --> F

    subgraph Operations Core
        G[Admin CRM /admin] <-->|CRUD APIs| F
        G <-->|Private Vault Storage| H[(Supabase Storage crm-documents)]
    end

    subgraph Staff Training Hub
        I[Staff Portal /staff] <-->|Assignments & Quizzes| J[/api/training/*]
        J <--> F
        J <-->|Certificates & Evidence| H
    end

    subgraph Participant Self-Service
        K[Participant Portal /portal] <-->|Invoices & Shifts| F
    end
```

---

## 📦 Core Modules & Feature Breakdown

### 1. Enterprise CRM / ERP Dashboard (`/admin`)
An IDURAR ERP-inspired operations command centre for disability service providers.
- **Pipeline & Inbound Referrals**: Interactive Kanban board and tabular view tracking inbound enquiries across 5 stages: `new` → `contacted` → `assessment` → `agreement_sent` → `accepted` (active).
- **One-Click Participant Conversion**: Converts accepted referrals directly into official NDIS participant profiles via `/api/crm/convert` with auto-generated welcome activities.
- **Participant Directory**: Comprehensive profiles with NDIS numbers, plan management types (Self-Managed, Plan-Managed, NDIA), support coordinator details, and allocated funding hours.
- **Service Agreements & PACE Invoicing**: Generation and tracking of service agreements, quotes, and NDIS PACE-compliant tax invoice batches with catalogue support item line codes.
- **Support Worker Register**: Clearances tracker monitoring NDIS Worker Screening Check (NWSC), Working With Children Check (WWCC), Police Check dates, First Aid, CPR, and hourly pay rates.
- **Encrypted Document Vault**: File storage using private AES-256 Supabase bucket `crm-documents` accessed via time-limited signed URLs (1-hour TTL).
- **Activity Timeline & Communication Log**: Audit trail recording phone calls, client emails, shift notes, and supervisory reviews.
- **System Diagnostics**: Live status indicators for Supabase PostgreSQL 17, Private Vault storage, and Resend inbound email forwarders.

---

### 2. Staff Training & Compliance Hub (`/staff`)
A complete, custom-built training and compliance management system designed specifically for Australian NDIS disability support providers.

#### A. Three-Tab Worker Portal Experience
1. **My Assigned Training**:
   - Live **Mandatory Compliance %** gauge.
   - List of all assigned modules with format pills (`PDF + 5Q Quiz`, `PDF + Read`, `External Cert`) and compliance status indicators.
   - **In-App PDF Viewer**: Embedded PDF reader + new tab button for reading modules directly in the portal.
   - **Interactive Knowledge Checks**: 5-question multi-choice quizzes with paginated navigation, server-side scoring, instant feedback, retry handling on failure, and automatic certificate generation upon scoring ≥80%.
2. **Free External Training Library**:
   - Directory of curated official courses from government bodies and universities.
   - Filterable by 6 categories: *NDIS Essentials, Safeguarding, Support Practice, Behaviour & Trauma, Leadership, Optional Specialist Learning*.
   - Badges: `🟢 Free`, `🎓 Official Certificate` / `🔓 Creative Commons`, `👥 Target Audience`, and estimated duration.
   - Action buttons: `[Start Free Training ↗]` (launches external provider portal) and `[Record Evidence]` (modal for logging completion date, provider, and uploading certificate evidence).
3. **My Certificates & Evidence Vault**:
   - Unified repository of earned internal certificates and uploaded external credentials.
   - One-click access to view and print official internal completion certificates.

#### B. 10 Original Internal Opus Care Learning Modules
Included directly with full PDF material, practical support worker scenarios, escalation guides, and 5-question quiz banks:
1. `Opus Care Induction & NDIS Foundations`
2. `NDIS Code of Conduct, Rights, Choice & Control`
3. `Privacy, Confidentiality & Recordkeeping`
4. `Incident, Emergency & Safeguarding Response`
5. `Complaints, Feedback & Escalation`
6. `Abuse, Neglect, Exploitation & Professional Boundaries`
7. `Effective Communication & Supported Decision-Making`
8. `Risk, Dignity of Risk, Lone Work & WHS`
9. `Infection Prevention & Safe Support Basics`
10. `External Certificates & Mandatory Training Guide`
- Master Guide: `00_Training_Catalogue_and_Deployment_Guide.pdf`

*All PDFs are stored in `/public/training/` and synced to private Supabase Storage `crm-documents` under `training/materials/`.*

#### C. 11 Curated Free External Courses
1. **Worker Orientation – Quality, Safety and You** (NDIS Commission, Official Certificate, Required)
2. **New Worker NDIS Induction – 8 Modules** (NDIS Commission, Official Certificate, Recommended)
3. **Supporting Effective Communication** (NDIS Commission, Official Certificate, Required)
4. **Supporting Safe and Enjoyable Meals** (NDIS Commission, Official Certificate, Role-specific)
5. **Abuse, Neglect & Exploitation – Module 1: Frontline Workers** (NSW ADC, Downloadable Certificate, Required)
6. **Abuse, Neglect & Exploitation – Module 2: Supervisors & Managers** (NSW ADC, Downloadable Certificate, Role-specific)
7. **Know My Rights – Support Worker Journey** (NDIS Commission / Ausmed, Online Pathway)
8. **Skills for Active Support – 8 Modules** (La Trobe University, Creative Commons BY-SA 4.0)
9. **Positive Behaviour Support & Trauma-Informed Practice** (NDS / NDIS Commission, Official Certificate)
10. **Frontline Practice Leadership** (La Trobe University, Creative Commons BY-SA 4.0)
11. **External Support Workers Training** (ADCET Academy, Certificate + Digital Badge)

#### D. Compliance Status Lifecycle
The system calculates real-time compliance across 8 standardized states:
- `Not Started`: Assigned but no attempt or completion recorded.
- `In Progress`: Quiz attempted but not yet passed.
- `Due Soon`: Due within 7 days.
- `Overdue`: Assignment due date has passed without completion.
- `Complete`: Quiz passed (≥80%) or Read & Acknowledge confirmed.
- `Expiring Soon`: Valid certification expiring within 30 days.
- `Expired`: Validity period has lapsed.
- `Renewal Required`: Expired mandatory module requiring re-certification.

#### E. Internal Certificate Generation & Legal Disclaimer
Printable certificates are rendered via `/api/training/certificate` with permanent certificate numbers (`OC-TRN-YYYY-XXXXX`) and include the mandatory Australian legal qualification disclaimer:
> *"Internal Training Certificate — Not a nationally accredited qualification. This certificate does not represent completion of any NDIS Commission, TAFE, or RTO-registered course."*

---

### 3. Participant Self-Service Portal (`/portal` & `/portal/dashboard`)
Dedicated portal for NDIS participants, nominees, and plan managers:
- **Plan Funding Breakdown**: Core supports, capacity building, and capital funding utilization meters.
- **Delivered Shifts & Roster**: Timeline of completed and upcoming support worker shifts.
- **Invoices**: Searchable tax invoices with itemized support catalogue codes and status tags (`pending`, `approved`, `queried`).
- **Direct Switcher**: Quick link to access the Staff Training Hub.

---

## 🗄️ Database Schema (`supabase/schema.sql`)

The database consists of 14 tables protected by PostgreSQL Row Level Security:

| Table | Purpose | Key Columns / Constraints |
| :--- | :--- | :--- |
| `profiles` | User profiles linked to Supabase Auth | `id`, `role`, `full_name`, `email` |
| `referrals` | Inbound intake pipeline leads | `id`, `reference_number`, `participant_name`, `status`, `funding` |
| `participants` | Active NDIS participants | `id`, `reference_number`, `name`, `ndis_number`, `plan_manager` |
| `contacts` | Support coordinators, family & nominees | `id`, `name`, `relationship`, `phone`, `email` |
| `participant_contacts` | Junction table | `participant_id`, `contact_id` |
| `activities` | Timeline events & notes | `id`, `activity_type`, `title`, `description`, `author_name` |
| `tasks` | Team tasks & reminders | `id`, `title`, `due_date`, `completed` |
| `documents` | Private metadata vault | `id`, `owner_type`, `owner_id`, `storage_path`, `category`, `expiry_date` |
| `training_courses` | Course definitions & quiz questions | `id`, `title`, `course_type`, `quiz_questions` (JSONB), `pass_mark_pct`, `is_mandatory` |
| `training_assignments` | Worker-to-course assignments | `id`, `course_id`, `staff_id`, `due_date`, `unique(course_id, staff_id)` |
| `training_completions` | Passing completions & cert records | `id`, `course_id`, `staff_id`, `certificate_id`, `expires_at`, `unique(course_id, staff_id)` |
| `training_attempts` | Quiz audit log (pass or fail) | `id`, `course_id`, `staff_id`, `answers` (JSONB), `score_pct`, `passed` |
| `external_courses` | Curated free external training | `id`, `title`, `provider`, `category`, `certificate_type`, `url`, `is_active` |
| `training_cert_seq` | Sequence for human-friendly IDs | Starts at `1001` |

> **Critical Attempt Rule**: An entry in `training_attempts` with `passed = false` strictly **never** creates a row in `training_completions`. Completions are only awarded when `score_pct >= pass_mark_pct`.

---

## 🌐 API Route Directory

All routes are implemented under `app/api/`:

### Operations & CRM
- `POST /api/referral`: Submit new participant referral (from website or email parser).
- `GET /api/referral`: List all referrals with stage filters.
- `PATCH /api/referral`: Update referral pipeline status.
- `POST /api/crm/convert`: Convert accepted referral into an active participant.
- `GET/POST /api/crm/participants`: Participant directory records.
- `GET/POST /api/crm/staff`: Support worker records and clearances.
- `GET/POST /api/crm/documents`: Upload file to `crm-documents` or retrieve signed URLs.
- `GET/POST /api/crm/activities`: Add and retrieve timeline notes and call logs.
- `POST /api/contact`: General enquiry form submissions.
- `POST /api/email/inbound`: Resend webhook for inbound emails.
- `GET/POST/DELETE /api/admin/auth`: Admin authentication session management.

### Training & Compliance
- `GET /api/training/courses`: List active courses.
- `POST /api/training/courses`: Create new course with quiz questions (Admin).
- `GET /api/training/assignments`: List assignments by `staff_id`.
- `POST /api/training/assignments`: Bulk assign courses to support workers.
- `POST /api/training/attempts`: Submit quiz attempt, evaluate score, and create completion on pass.
- `GET /api/training/completions`: Retrieve worker completions with signed certificate URLs.
- `POST /api/training/completions`: Record Read & Acknowledge confirmation.
- `PATCH /api/training/completions`: Upload external certificate evidence.
- `GET /api/training/external`: Retrieve curated external courses with category filters.
- `GET /api/training/certificate`: Render printable HTML certificate.

---

## 🚀 Development & Deployment

### Local Setup
```bash
# Clone the repository
git clone https://github.com/iamnarace/NDIS_Project.git
cd NDIS_Project

# Install dependencies
npm install

# Configure environment variables (.env.local)
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
# ADMIN_ACCESS_KEY=...
# RESEND_API_KEY=...

# Run development server
npm run dev
```

### Production Build & Typecheck
```bash
npm run build
```

### Automated Validation Suite
A dedicated verification test suite is available in `scripts/verify_training.mjs`:
```bash
node scripts/verify_training.mjs
```
The suite verifies:
1. Course creation & retrieval.
2. Staff assignment upserts.
3. Quiz failure attempt logging without creating a completion.
4. Quiz passing attempt logging, completion recording, and certificate ID generation.
5. Read & Acknowledge flow.
6. External certificate recording.
7. Real-time status & expiry calculations (`Overdue`, `Due Soon`, `Complete`, `Expiring Soon`, `Expired`).
8. Mandatory compliance % calculations.
9. Multi-staff data isolation between workers (`STF-001` vs `STF-002`).

---

## 📄 License & Compliance Notice

- **Internal Training Content**: Original Opus Care Support Services operational documentation and training resources.
- **External Courses**: Sourced from public and Creative Commons (BY-SA 4.0) repositories (NDIS Quality and Safeguards Commission, NSW Ageing and Disability Commission, La Trobe University Living with Disability Research Centre, ADCET).
- **Disclaimer**: Internal certificates are workplace competency verifications and do not constitute nationally recognized training under the Australian Qualifications Framework (AQF).
