-- ==============================================================================
-- OPUS CARE GOVERNANCE MIGRATION: PAYSLIP STORAGE, SUPERANNUATION 12% & SUBSTANTIVE POLICIES
-- Migration: 20260913120000_document_categories_payslip_and_super_12.sql
-- Applied to: live Supabase project wqykzdodzcfwpgitnisx
-- ==============================================================================

-- 1. Extend documents category constraint to support payslip and required operational types
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_category_check;
ALTER TABLE public.documents ADD CONSTRAINT documents_category_check
  CHECK (category = ANY (ARRAY[
    'service_agreement'::text,
    'ndis_plan'::text,
    'risk_assessment'::text,
    'care_plan'::text,
    'police_check'::text,
    'wwcc'::text,
    'first_aid'::text,
    'cpr'::text,
    'driver_license'::text,
    'car_insurance'::text,
    'payslip'::text,
    'employment_contract'::text,
    'super_choice'::text,
    'tfn_declaration'::text,
    'worker_screening'::text,
    'contractor_insurance'::text,
    'vehicle_insurance'::text,
    'vehicle_safety_check'::text,
    'training_cert'::text,
    'qualification'::text,
    'identity'::text,
    'consent'::text,
    'other'::text
  ]));

-- 2. Update RLS on public.documents to allow workers to read their own payslips
DROP POLICY IF EXISTS "Workers read own credential documents" ON public.documents;
CREATE POLICY "Workers read own credential documents" ON public.documents
  FOR SELECT TO authenticated
  USING (
    owner_type = 'staff'
    AND owner_id = (public.my_staff_id())::text
    AND category = ANY (ARRAY[
      'police_check'::text,
      'wwcc'::text,
      'first_aid'::text,
      'cpr'::text,
      'driver_license'::text,
      'car_insurance'::text,
      'payslip'::text,
      'employment_contract'::text,
      'super_choice'::text,
      'training_cert'::text,
      'other'::text
    ])
  );

-- 3. Update Superannuation Guarantee default from 11.5% to 12.00%
ALTER TABLE public.provider_config ALTER COLUMN default_super_rate_pct SET DEFAULT 12.00;
UPDATE public.provider_config SET default_super_rate_pct = 12.00 WHERE default_super_rate_pct = 11.50;

-- 4. Clarify insurance limit comments as configurable business policy targets
COMMENT ON COLUMN public.provider_config.min_public_liability_limit IS 'Internal business target coverage amount for Public Liability (not a statutory NDIS minimum)';
COMMENT ON COLUMN public.provider_config.min_professional_indemnity_limit IS 'Internal business target coverage amount for Professional Indemnity (not a statutory NDIS minimum)';

UPDATE public.controlled_documents SET
  title = 'NDIS Service Agreement Standard',
  change_summary = 'Aligned with NDIS 2026-27 Pricing Arrangements and Opus sole trader unregistered governance.',
  content_markdown = '# NDIS Service Agreement Standard
**Document Code:** DOC-AGR-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations & Governance Lead | **Audience:** Participant / Nominee

## 1. Purpose & Legal Context
This document governs the creation, negotiation, and formal execution of NDIS Service Agreements between Opus Care Support Services (ABN: 41 267 197 576) and self-managed or plan-managed NDIS participants. As an unregistered NDIS provider, Opus Care operates in full accordance with the *National Disability Insurance Scheme Act 2013* (Cth), the NDIS Code of Conduct, and Australian Consumer Law.

## 2. Fundamental Principles
- **Choice and Control:** Participants retain complete sovereignty over which supports are delivered, who delivers them, and how service schedules are arranged.
- **Transparent Pricing:** All services are billed strictly within the limits established by the *NDIS Pricing Arrangements and Price Limits 2026–27*. Opus Care never charges fees exceeding the gazetted NDIS price cap.
- **GST Exemption Disclosure:** Opus Care Support Services is not registered for GST. GST has not been charged on any invoice.
- **Fair Termination:** Either party may terminate the Service Agreement by providing fourteen (14) days written notice without financial penalty.

## 3. Responsibilities & Service Delivery
- **Provider Duties:** Deliver agreed support services with due care, skill, and cultural sensitivity; maintain qualified and screened support workers; keep participant records confidential under the *Privacy Act 1988* (Cth).
- **Participant Duties:** Inform Opus Care of any changes to NDIS plan funding, emergency contacts, or home access arrangements; provide timely notice of schedule changes.',
  updated_at = now()
WHERE document_code = 'DOC-AGR-01';

UPDATE public.controlled_documents SET
  title = 'Schedule of Supports & Pricing Structure',
  change_summary = 'Tailored support item allocations and price limits.',
  content_markdown = '# Schedule of Supports & Pricing Structure
**Document Code:** DOC-SCH-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations & Governance Lead | **Audience:** Participant / Plan Manager

## 1. Scope & Application
This schedule sets out the itemised allocation of funded supports delivered by Opus Care Support Services, establishing agreed unit prices, weekly hours, line item codes, and regional billing boundaries.

## 2. NDIS Price Limits Adherence
- All rates charged correspond to the *NDIS Pricing Arrangements and Price Limits 2026–27* for the relevant line item.
- Rates vary based on time of service (Weekday Daytime, Weekday Evening, Saturday, Sunday, Public Holiday).
- Direct care line items include:
  - 01_011_0107_1_1: Assistance With Self-Care Activities - Standard
  - 04_104_0125_6_1: Access Community, Social And Rec Activities - Standard

## 3. Provider Travel & Non-Labour Costs
- **Travel Labour:** Billed in accordance with Modified Monash Model (MMM) guidelines (capped at 30 minutes for MMM 1–3 areas and 60 minutes for MMM 4–5 regional zones).
- **Activity-Based Transport:** Billed at $1.00 per kilometre when transporting the participant in a worker''s private vehicle during support delivery, subject to prior written agreement.',
  updated_at = now()
WHERE document_code = 'DOC-SCH-01';

UPDATE public.controlled_documents SET
  title = 'Pricing, Travel & Cancellation Policy',
  change_summary = 'Transparent pricing under NDIS price limits; short-notice cancellation rules aligned with NDIS pricing arrangements.',
  content_markdown = '# Pricing, Travel & Cancellation Policy
**Document Code:** DOC-PRC-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Finance & Governance Lead | **Audience:** All Stakeholders

## 1. Regulatory Framework & Non-GST Disclosure
Opus Care Support Services delivers support strictly adhering to the *NDIS Pricing Arrangements and Price Limits 2026–27*. Opus Care is not registered for GST; therefore, GST has not been charged on any invoice and all invoices state "INVOICE".

## 2. Cancellation Terms
- Short-notice cancellations are governed by the NDIS Pricing Arrangements and the participant''s individual Schedule of Supports.
- For standard one-on-one core disability support, cancellations must be communicated by the participant prior to the scheduled start time as specified in their agreement (e.g. by 2:00 PM of the preceding business day, or 2 clear business days where agreed for scheduled group or rostered services).
- Where short notice is provided and the support worker cannot be reassigned to alternate duties, Opus Care may claim up to 100% of the scheduled fee from NDIS plan funds.
- Opus Care actively seeks alternative duties or waives charges where compassionate circumstances warrant.

## 3. Travel & Mileage Separation
- **Participant Billing:** Maximum 30 mins travel labour (MMM 1-3) at the agreed hourly support rate; $1.00/km for participant transport during shifts.
- **Worker Reimbursement:** Strictly separated from participant invoicing; reimbursed at statutory SCHADS vehicle rates.',
  updated_at = now()
WHERE document_code = 'DOC-PRC-01';

UPDATE public.controlled_documents SET
  title = 'Privacy Collection Notice & Information Handling Policy',
  change_summary = 'Australian Privacy Principles compliance, purpose of collection, secure retention and access rights.',
  content_markdown = '# Privacy Collection Notice & Information Handling Policy
**Document Code:** DOC-PRV-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Privacy Officer | **Audience:** All Stakeholders

## 1. Legislative Commitment
Opus Care Support Services complies with the *Privacy Act 1988* (Cth), the 13 Australian Privacy Principles (APPs), and the *Health Records and Information Privacy Act 2002* (NSW).

## 2. Information Collected
We collect personal, financial, and health information necessary for the safe, tailored delivery of disability support:
- Contact details, date of birth, emergency contacts
- NDIS plan details, goals, funding management type
- Medical, allergy, behavioural, and support requirements
- Raw Tax File Numbers (TFNs) are NEVER collected or stored in the CRM; statutory forms are forwarded directly to external STP payroll.

## 3. Use & Disclosure Boundaries
Personal data is disclosed only to authorized parties:
- Support workers allocated to the participant''s care
- Plan Managers for invoicing and payment claims
- Emergency services (000) or hospitals during medical emergencies
- Marketing or photographic materials require separate, unbundled, voluntary opt-in consent.',
  updated_at = now()
WHERE document_code = 'DOC-PRV-01';

UPDATE public.controlled_documents SET
  title = 'Participant Charter of Rights & Responsibilities',
  change_summary = 'Dignity, choice & control, advocacy rights, and participant responsibilities.',
  content_markdown = '# Participant Charter of Rights & Responsibilities
**Document Code:** DOC-RGT-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Safeguarding Lead | **Audience:** Participant / Nominee

## 1. Core Participant Rights
Every person receiving support from Opus Care has the right to:
- **Dignity & Respect:** Be treated with dignity, respect, and freedom from discrimination, exploitation, or abuse.
- **Choice & Self-Determination:** Make informed choices about supports, goals, and who delivers care.
- **Privacy & Confidentiality:** Personal information kept secure and private in line with Australian privacy law.
- **Independent Advocacy:** Access an independent advocate of their choice at any time.
- **Complaint without Retribution:** Lodge complaints or feedback without fear of negative consequences or withdrawal of support.

## 2. Participant Responsibilities
- Treat support workers with courtesy, mutual respect, and free from violence or harassment.
- Provide a safe domestic environment for support visits.
- Communicate schedule changes or cancellations as early as possible.',
  updated_at = now()
WHERE document_code = 'DOC-RGT-01';

UPDATE public.controlled_documents SET
  title = 'Complaints, Feedback & Dispute Resolution Guide',
  change_summary = 'Fair complaints process, external escalation to NDIS Commission, no fear of retribution.',
  content_markdown = '# Complaints, Feedback & Dispute Resolution Guide
**Document Code:** DOC-CMP-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Safeguarding Lead | **Audience:** All Stakeholders

## 1. Policy Statement
Opus Care Support Services welcomes feedback, compliments, and complaints as essential opportunities to improve service quality. All complaints are managed promptly, fairly, and confidentially.

## 2. How to Lodge a Complaint
- **Direct Discussion:** Speak directly with your support worker or coordinator.
- **Email:** complaints@opuscare.com.au
- **Online Form:** Lodge anonymously or identified via https://opuscare.com.au/complaints
- **Phone:** Call the Opus Care Operations Coordinator directly.

## 3. Resolution Protocol
- Acknowledgement within two (2) business days.
- Investigation and resolution proposal within fourteen (14) business days.
- Recording in the Continuous Improvement Register.

## 4. External Escalation
If you are unsatisfied with our response, you have the right to contact the NDIS Quality and Safeguards Commission:
- **Phone:** 1800 035 544 (free call)
- **Website:** https://www.ndiscommission.gov.au',
  updated_at = now()
WHERE document_code = 'DOC-CMP-01';

UPDATE public.controlled_documents SET
  title = 'Incident Management & Safeguarding Guide',
  change_summary = 'Participant safety, incident response, zero tolerance for abuse, management assessment.',
  content_markdown = '# Incident Management & Safeguarding Guide
**Document Code:** DOC-INC-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Safeguarding Lead | **Audience:** All Stakeholders

## 1. Overview & Framework
Opus Care Support Services maintains a comprehensive incident management system to prevent, report, investigate, and learn from unexpected events, accidents, injuries, and safeguarding concerns.

## 2. Immediate Response Duties
1. **Ensure Safety:** Provide first aid and eliminate immediate hazards. Call 000 if there is imminent danger, severe injury, or criminal conduct.
2. **Support Participant:** Provide emotional support, open disclosure, and notify family/nominees where authorized.
3. **Internal Reporting:** Lodge an Incident Report in the CRM within twenty-four (24) hours.

## 3. Management & Regulatory Assessment
- As an unregistered NDIS provider, Opus Care conducts an immediate **Management / Regulatory Reporting Assessment** for every high-severity event.
- External reporting duties are determined based on applicable law (e.g. Police notification, SafeWork NSW for workplace injuries).
- If operating as a subcontractor to a registered NDIS provider, Opus Care notifies the lead registered provider within 24 hours so they can meet their NDIS Commission 24h/5d reportable incident statutory deadlines.',
  updated_at = now()
WHERE document_code = 'DOC-INC-01';

UPDATE public.controlled_documents SET
  title = 'Participant Welcome & Onboarding Handbook',
  change_summary = 'Complete client handbook covering service delivery, worker matching, and portal access.',
  content_markdown = '# Participant Welcome & Onboarding Handbook
**Document Code:** DOC-HBK-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations Lead | **Audience:** Participant / Nominee

## 1. Welcome to Opus Care Support Services
We are dedicated to providing compassionate, reliable, and person-centred core disability supports across Northern NSW (Clarence Valley, Yamba, Maclean, Grafton) and Greater Sydney.

## 2. What We Provide
- Personal daily living assistance and self-care support
- Community access, social participation, and transport
- Domestic assistance, meal preparation, and lifestyle support
- Non-clinical medication prompting and Webster pack assistance

## 3. What We Do NOT Provide (Clinical Boundary)
As an unregistered core disability support provider, Opus Care does NOT deliver invasive clinical services (such as tracheostomy care, invasive bowel management, or PEG feeding) until a Clinical Governance Lead Registered Nurse is formally appointed and verified.

## 4. Participant Portal
Track your goals, view support schedules, and inspect service delivery records securely via https://opuscare.com.au/portal.',
  updated_at = now()
WHERE document_code = 'DOC-HBK-01';

UPDATE public.controlled_documents SET
  title = 'Emergency & After-Hours Support Protocol',
  change_summary = 'Critical incident triage, 000 protocols, and after-hours operational contact.',
  content_markdown = '# Emergency & After-Hours Support Protocol
**Document Code:** DOC-EMG-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations Lead | **Audience:** All Stakeholders

## 1. Medical & Safety Emergencies (Triple Zero)
For life-threatening emergencies, serious injury, fire, or acute mental health crisis:
**CALL 000 IMMEDIATELY** (Police, Fire, Ambulance).

## 2. After-Hours Operational Support
For urgent after-hours operational matters (e.g. support worker delay, access issues, emergency rescheduling):
- Operations On-Call Contact: info@opuscare.com.au
- Escalation Manager: As documented in the participant''s emergency plan.

## 3. Community Mental Health Contacts
- **Lifeline:** 13 11 14 (24/7 crisis support)
- **Beyond Blue:** 1300 22 4636
- **Suicide Call Back Service:** 1300 659 467
- **1800RESPECT:** 1800 737 732 (Domestic violence support)',
  updated_at = now()
WHERE document_code = 'DOC-EMG-01';

UPDATE public.controlled_documents SET
  title = 'Service Exit & Transition Policy',
  change_summary = 'Fair 14-day notice, orderly transition of support records, and unhindered exit rights.',
  content_markdown = '# Service Exit & Transition Policy
**Document Code:** DOC-EXT-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations Lead | **Audience:** Participant / Nominee

## 1. Unhindered Participant Exit
Participants have the absolute right to change providers, reduce services, or exit support at any time. Opus Care never imposes penalties, obstruction, or exit fees.

## 2. Notice Requirements
- Standard notice is fourteen (14) calendar days in writing or via email.
- Shorter notice may be mutually agreed on compassionate grounds or in cases of safety concerns.

## 3. Orderly Transition Protocol
- Provide the participant or incoming provider with relevant support summaries and goal progress notes upon written authorization.
- Final invoice reconciled and submitted within seven (7) business days.
- Participant records securely archived under our 7-year retention policy.',
  updated_at = now()
WHERE document_code = 'DOC-EXT-01';

UPDATE public.controlled_documents SET
  title = 'Information Sharing Authority Template & Policy',
  change_summary = 'Specific consent for sharing information with Plan Managers, Support Coordinators, and Allied Health.',
  content_markdown = '# Information Sharing Authority Template & Policy
**Document Code:** DOC-ISA-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Privacy Officer | **Audience:** Participant / Nominee

## 1. Principle of Specific Informed Consent
Opus Care Support Services shares participant information only where specific, informed, and time-limited consent has been granted by the participant or their legal nominee.

## 2. Authorized Third Parties
Consents may be designated for:
- **Plan Managers:** Invoices, service bookings, support item codes, and service hours.
- **Support Coordinators:** Goals, shift frequency, risk assessments, and progress notes.
- **Allied Health Professionals:** Functional observations and physical support notes.
- **Emergency Services:** Medical alerts and emergency contacts.

## 3. Revocation Rights
Consent may be revoked or modified at any time by notifying Opus Care in writing.',
  updated_at = now()
WHERE document_code = 'DOC-ISA-01';

UPDATE public.controlled_documents SET
  title = 'NDIS Worker Code of Conduct Policy & Guidance',
  change_summary = 'NDIS Quality and Safeguards Commission Worker Code of Conduct operational requirements and worker agreement.',
  content_markdown = '# NDIS Worker Code of Conduct Policy & Guidance
**Document Code:** DOC-COC-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations & Governance Lead | **Audience:** Support Worker

## 1. Statutory Obligation
All support workers engaged by Opus Care Support Services must strictly abide by the *NDIS Code of Conduct* pursuant to section 73V of the *National Disability Insurance Scheme Act 2013*.

## 2. Seven Core Conduct Obligations
1. Act with respect for individual rights to freedom of expression, self-determination, and decision-making.
2. Respect the privacy of people with disability.
3. Provide supports and services in a safe and competent manner with care and skill.
4. Act with integrity, honesty, and transparency.
5. Promptly take steps to raise and act on concerns about matters that may impact the quality and safety of supports.
6. Take all reasonable steps to prevent and respond to all forms of violence, exploitation, neglect, and abuse.
7. Take all reasonable steps to prevent and respond to sexual misconduct.

## 3. Penalties & Enforcement
Breaches of the NDIS Code of Conduct constitute gross misconduct, resulting in disciplinary action, termination of engagement, and reporting to the NDIS Commission.',
  updated_at = now()
WHERE document_code = 'DOC-COC-01';

UPDATE public.controlled_documents SET
  title = 'Participant Safeguarding & Zero-Tolerance Abuse Policy',
  change_summary = 'Zero-tolerance of abuse, neglect, exploitation, and discrimination with mandatory reporting duties.',
  content_markdown = '# Participant Safeguarding & Zero-Tolerance Abuse Policy
**Document Code:** DOC-SFG-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Safeguarding Lead | **Audience:** All Stakeholders

## 1. Zero Tolerance Mandate
Opus Care maintains a strict zero-tolerance policy towards any form of abuse, neglect, exploitation, discrimination, or unlawful physical/chemical restraint.

## 2. Definitions of Abuse
- **Physical Abuse:** Non-accidental bodily harm, force, or unlawful restraint.
- **Sexual Misconduct:** Any sexual act, harassment, sexualized comments, or exploitation.
- **Emotional & Psychological Abuse:** Humiliation, threats, harassment, or verbal degradation.
- **Financial Exploitation:** Theft, coercion, unauthorized spending, borrowing money, or receiving personal gifts.
- **Neglect:** Failure to provide essential care, nourishment, medical attention, or shelter.

## 3. Mandatory Reporting & Police Referral
Any worker who observes, suspects, or receives an allegation of abuse must immediately take steps to ensure participant safety and escalate to management. Allegations of criminal misconduct are referred to NSW Police immediately.',
  updated_at = now()
WHERE document_code = 'DOC-SFG-01';

UPDATE public.controlled_documents SET
  title = 'Professional Boundaries & Code of Ethics',
  change_summary = 'Standards for maintaining appropriate physical, financial, emotional, and social boundaries.',
  content_markdown = '# Professional Boundaries & Code of Ethics
**Document Code:** DOC-BND-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations & Governance Lead | **Audience:** Support Worker

## 1. Policy Purpose
Clear professional boundaries are fundamental to safe, objective, and therapeutic disability support relationships, preventing conflicts of interest, emotional dependency, or exploitation.

## 2. Boundary Standards
- **Financial Boundaries:** Workers must never borrow money, lend money, accept personal loans, or receive personal gifts from participants or families.
- **Personal & Social Boundaries:** Workers must not connect with participants via personal social media accounts (Facebook, Instagram, Snapchat, etc.). All communication must occur through official channels.
- **Emotional Boundaries:** Maintain professional warmth while avoiding over-involvement in family disputes or personal entanglements.
- **Physical Boundaries:** Physical contact is strictly limited to necessary personal care or transfer assistance outlined in the participant''s Support Plan.',
  updated_at = now()
WHERE document_code = 'DOC-BND-01';

UPDATE public.controlled_documents SET
  title = 'Work Health & Safety (WHS) and Hazard Management Policy',
  change_summary = 'Safe systems of work in domestic community environments, risk assessments, and PPE protocols.',
  content_markdown = '# Work Health & Safety (WHS) and Hazard Management Policy
**Document Code:** DOC-WHS-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** WHS Officer | **Audience:** All Stakeholders

## 1. Commitment & Legal Obligations
Opus Care complies with the *Work Health and Safety Act 2011* (NSW) and the *Work Health and Safety Regulation 2017* (NSW). We are committed to providing a safe working environment for all support workers, participants, and visitors.

## 2. Risk Management in Domestic Settings
Because disability support is frequently delivered in participants'' private homes, dynamic environmental risk assessments are conducted prior to service commencement:
- Physical hazards: Trip hazards, clutter, poor lighting, wet floors.
- Animal hazards: Unsecured dogs or dangerous pets.
- Environmental hazards: Smoke, ventilation, weapons, or hazardous chemicals.

## 3. Hazard Reporting
Workers must report hazards immediately via the CRM Hazard/Incident Form. Serious workplace incidents resulting in hospitalization or fatality must be notified to SafeWork NSW pursuant to Part 3 of the WHS Act.',
  updated_at = now()
WHERE document_code = 'DOC-WHS-01';

UPDATE public.controlled_documents SET
  title = 'Lone Worker & Community Safety Protocol',
  change_summary = 'Safety procedures for solitary home visits, duress check-ins, and dangerous situation withdrawal.',
  content_markdown = '# Lone Worker & Community Safety Protocol
**Document Code:** DOC-LNE-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** WHS Officer | **Audience:** Support Worker

## 1. Overview
Disability support workers routinely deliver supports as lone workers in the community and participants'' private residences. This protocol establishes robust safety mechanisms to protect field staff.

## 2. Field Safety Protocols
- **Shift Check-in / Check-out:** Workers must confirm arrival and departure times for every shift via the Worker Portal.
- **Emergency Duress:** In the event of immediate danger, threats of violence, or weapons, the worker must immediately withdraw to a place of safety and call 000.
- **Right of Withdrawal:** Workers have the statutory right under section 84 of the *WHS Act 2011* (NSW) to cease or refuse unsafe work where there is a reasonable concern of serious risk to health and safety.',
  updated_at = now()
WHERE document_code = 'DOC-LNE-01';

UPDATE public.controlled_documents SET
  title = 'Business Continuity & Emergency Disaster Management Plan',
  change_summary = 'Contingency plans for severe weather, power loss, workforce shortages, and critical participant support continuity.',
  content_markdown = '# Business Continuity & Emergency Disaster Management Plan
**Document Code:** DOC-BCP-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations & Governance Lead | **Audience:** All Stakeholders

## 1. Objective & Scope
This plan ensures the continuous delivery of critical disability support services during natural disasters (floods, bushfires, storms), pandemics, power outages, or IT failures.

## 2. Regional Disaster Management
- **Northern NSW (Clarence River Valley):** Flood monitoring via NSW SES; contingency rosters for Maclean, Yamba, and Grafton isolation risks.
- **Sydney Region:** Heatwave and severe storm protocols.
- **Priority Triage:** Participants categorized by vulnerability (Priority 1: Life-essential daily living; Priority 2: Routine support; Priority 3: Non-urgent social access).

## 3. Communication Redundancy
Backup offline records, secondary communications channels, and emergency welfare checks are initiated within 2 hours of disaster declaration.',
  updated_at = now()
WHERE document_code = 'DOC-BCP-01';

UPDATE public.controlled_documents SET
  title = 'Infection Prevention & Hygiene Protocol',
  change_summary = 'Hand hygiene, PPE use, cross-contamination prevention, and illness reporting standards.',
  content_markdown = '# Infection Prevention & Hygiene Protocol
**Document Code:** DOC-IPC-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations Lead | **Audience:** All Stakeholders

## 1. Standard Precautions
Standard infection control precautions must be applied during all support shifts:
- Hand hygiene: Hand washing with soap and water or alcohol-based hand rub before and after participant contact.
- Personal Protective Equipment (PPE): Single-use gloves for personal care, masks during respiratory illness.
- Respiratory etiquette: Cough and sneeze into elbows.

## 2. Worker Illness Policy
Workers experiencing symptoms of infectious illness (gastroenteritis, influenza, COVID-19) must NOT attend shifts and must notify the coordinator immediately for shift reassignment.',
  updated_at = now()
WHERE document_code = 'DOC-IPC-01';

UPDATE public.controlled_documents SET
  title = 'Participant Transport & Vehicle Safety Standard',
  change_summary = 'Driver licensing, comprehensive insurance, seatbelt adherence, roadworthiness, and transport incident management.',
  content_markdown = '# Participant Transport & Vehicle Safety Standard
**Document Code:** DOC-TRN-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations Lead | **Audience:** Support Worker

## 1. Vehicle Verification Requirements
Any vehicle used to transport an NDIS participant must satisfy:
- Valid NSW/State vehicle registration.
- Current Comprehensive Motor Vehicle Insurance or Third-Party Property Damage insurance including business use.
- Roadworthy condition and regular servicing.
- Working seatbelts for all occupants and clean interior.

## 2. Driver Requirements
- Current unrestricted Australian Driver Licence.
- Zero blood alcohol concentration (BAC 0.00) and zero illicit substances.
- Mobile phones must not be touched while driving under any circumstances.

## 3. Effective-Dated Vehicle Reimbursement
Reimbursement for private vehicle usage is calculated using statutory SCHADS Award rates:
- **1 Jul 2026 – 31 Aug 2026:** $1.01 per kilometre
- **1 Sep 2026 – 28 Feb 2027:** $1.05 per kilometre (temporary fuel allowance)
- **From 1 Mar 2027:** $1.01 per kilometre unless varied by the Fair Work Commission.',
  updated_at = now()
WHERE document_code = 'DOC-TRN-01';

UPDATE public.controlled_documents SET
  title = 'Money Handling & Financial Integrity Protocol',
  change_summary = 'Safeguards for handling participant cash during community shopping, mandatory receipts, and zero financial gifts.',
  content_markdown = '# Money Handling & Financial Integrity Protocol
**Document Code:** DOC-MNY-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Finance Lead | **Audience:** All Stakeholders

## 1. Principles & Safeguards
Support workers may assist participants with community shopping or financial transactions only when explicitly authorized in their Support Plan.

## 2. Mandatory Rules
- **No Cash Advances or Loans:** Workers must never lend money to or borrow money from a participant.
- **PIN Privacy:** Workers must NEVER ask for, accept, or memorize a participant''s credit/debit card PIN.
- **Itemised Receipts:** An itemised tax invoice/receipt must be obtained for every single cash transaction.
- **Transaction Log:** Both worker and participant (or nominee) sign the Money Handling Log at the end of the shift.',
  updated_at = now()
WHERE document_code = 'DOC-MNY-01';

UPDATE public.controlled_documents SET
  title = 'Conflict of Interest Policy & Register',
  change_summary = 'Disclosure requirements for personal, commercial, or relational conflicts affecting service delivery.',
  content_markdown = '# Conflict of Interest Policy & Register
**Document Code:** DOC-COI-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations & Governance Lead | **Audience:** Support Worker

## 1. Identification & Disclosure
Opus Care ensures all business and operational decisions are made objectively and transparently, free from inappropriate personal, financial, or familial bias.

## 2. Prohibited Interests
- Accepting referral commissions or gifts from third-party plan managers, allied health professionals, or equipment providers.
- Influencing a participant''s choice of provider for personal financial benefit.
- Unregistered secondary employment that compromises worker alertness or service delivery.',
  updated_at = now()
WHERE document_code = 'DOC-COI-01';

UPDATE public.controlled_documents SET
  title = 'Records Retention, Disposal & Archival Policy',
  change_summary = 'Strict compliance with Australian 7-year (adult) and age-25/7-year (child) NDIS record retention standards.',
  content_markdown = '# Records Retention, Disposal & Archival Policy
**Document Code:** DOC-REC-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Privacy Officer | **Audience:** All Stakeholders

## 1. Statutory Retention Periods
- **Adult Participant Records:** Retained for a minimum of seven (7) years post service exit pursuant to the *NDIS Quality and Safeguards Commission Rules*.
- **Child Participant Records (< 18 years):** Retained until the participant reaches age 25, or for seven (7) years after service cessation, whichever is longer.
- **Financial & Tax Records:** Retained for five (5) years in accordance with ATO rules.
- **Work Health & Safety Records:** Retained for five (5) to thirty (30) years depending on hazard exposure.

## 2. Secure Destruction
Records scheduled for disposal are permanently deleted from database tables and cloud storage buckets using cryptographic data erasure.',
  updated_at = now()
WHERE document_code = 'DOC-REC-01';

UPDATE public.controlled_documents SET
  title = 'Worker Screening, Background Check & Suitability Policy',
  change_summary = 'Mandatory NDIS Worker Screening Clearance for direct disability roles; conditional WWCC for <18 only; Police Checks; referee verification.',
  content_markdown = '# Worker Screening, Background Check & Suitability Policy
**Document Code:** DOC-SCR-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Operations & Governance Lead | **Audience:** Support Worker

## 1. Screening Baseline
To protect participants and ensure high-quality care, Opus Care enforces a rigorous worker screening process prior to roster allocation.

## 2. Screening Requirements
- **NDIS Worker Screening Clearance:** Mandatory internal policy for all direct disability support workers. Workers must hold a verified Clearance on the NDIS Worker Screening Database.
- **Working with Children Check (WWCC):** Mandatory when the role is child-related or involves services to participants under 18 years of age under the *Child Protection (Working with Children) Act 2012* (NSW). Opus Care''s initial launch scope is adult participants (18+); WWCC is conditionally enforced when child services are configured.
- **National Police Certificate:** Conducted prior to commencement and renewed every 3 years.
- **First Aid & CPR:** Current HLTAID011 Provide First Aid (3 years) and HLTAID009 Provide CPR (annual renewal).
- **Two Reference Checks:** Documented verification from previous healthcare or professional employers.',
  updated_at = now()
WHERE document_code = 'DOC-SCR-01';

UPDATE public.controlled_documents SET
  title = 'Medication Assistance Standard (Non-Clinical / Prompting)',
  change_summary = 'Protocols strictly limited to assistance with self-administration, Webster pack verification, and prompting.',
  content_markdown = '# Medication Assistance Standard (Non-Clinical / Prompting)
**Document Code:** DOC-MED-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Care Governance Lead | **Audience:** Support Worker

## 1. Non-Clinical Scope of Practice
Opus Care support workers provide non-clinical medication *assistance* only. Workers do NOT prescribe, calculate, or administer invasive medications.

## 2. Permitted Activities
- Reminding and prompting a participant to take their prescribed medication at scheduled times.
- Opening dose administration aids (e.g. Webster packs) prepared by a registered pharmacist.
- Providing a glass of water and assisting the participant to bring the medication to their mouth.
- Documenting medication assistance in the shift progress notes.

## 3. Prohibited Activities
- Workers must NEVER administer injections, adjust dosages, crush tablets without pharmacist instruction, or administer medication from unlabelled bottles.
- Any refusal or missed dose must be reported to the coordinator immediately.',
  updated_at = now()
WHERE document_code = 'DOC-MED-01';

UPDATE public.controlled_documents SET
  title = 'Manual Handling & Ergonomics Standard',
  change_summary = 'Ergonomic principles, participant transfer assistance rules, and no-manual-lifting hazardous load restrictions.',
  content_markdown = '# Manual Handling & Ergonomics Standard
**Document Code:** DOC-MNH-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** WHS Officer | **Audience:** Support Worker

## 1. Safe Transfer Principles
Support workers must apply safe manual handling principles to prevent musculoskeletal injuries to both workers and participants.

## 2. Hazardous Manual Tasks & No-Lift Rule
- Workers must NEVER manually lift a participant''s entire body weight unassisted.
- Mechanical hoists, slide sheets, standing lifters, and transfer belts must be used wherever indicated in the participant''s Mobility Assessment.
- All transfer equipment must be inspected prior to each use.

## 3. Training & Competency
Workers must hold verified competency in manual handling prior to roster placement for participants requiring physical transfer support.',
  updated_at = now()
WHERE document_code = 'DOC-MNH-01';

UPDATE public.controlled_documents SET
  title = 'Clinical Governance & Scope-of-Practice Standard',
  change_summary = 'Controlled definition of non-clinical boundary. High-intensity clinical supports disabled until clinical lead appointment.',
  content_markdown = '# Clinical Governance & Scope-of-Practice Standard
**Document Code:** DOC-CLN-01 | **Version:** 2026.1 | **Effective:** 2026-07-01 | **Review:** 2027-06-30
**Governing Authority:** Clinical Governance Lead | **Audience:** All Stakeholders

## 1. Scope-of-Practice Boundary
Opus Care Support Services operates strictly within an unregistered core disability support framework. High-intensity clinical supports (such as tracheostomy care, enteral feeding, and invasive bowel care) are **strictly disabled** in the CRM roster and booking engine.

## 2. Fail-Closed Clinical Gates
High-intensity supports cannot be rostered, booked, or billed until:
1. An Ahpra-registered Division 1 Registered Nurse is formally appointed and verified as Clinical Governance Lead.
2. Clinical Malpractice & Professional Indemnity insurance extension is purchased and verified.
3. Participant-specific clinical care plans are approved by a treating medical practitioner.
4. Assigned workers are assessed and deemed competent for the specific participant''s complex needs.

## 3. Duty of Escalation
If a participant''s health deteriorates or presents complex clinical symptoms, workers must contact emergency services (000) and notify the coordinator immediately.',
  updated_at = now()
WHERE document_code = 'DOC-CLN-01';