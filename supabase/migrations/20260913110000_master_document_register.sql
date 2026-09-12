-- SQL for 15 operational controlled policies
INSERT INTO public.controlled_documents (
  document_code, title, category, version, effective_date, review_date,
  status, owner_approver, acknowledgement_required, is_public, target_audience,
  change_summary, source_template_url
) VALUES
('DOC-COC-01', 'NDIS Worker Code of Conduct Policy & Guidance', 'Workforce & Governance', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations & Governance Lead', true, true, 'worker', 'NDIS Quality and Safeguards Commission Worker Code of Conduct operational requirements and worker agreement.', '/documents/worker-code-of-conduct'),
('DOC-SFG-01', 'Participant Safeguarding & Zero-Tolerance Policy', 'Quality & Safeguarding', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Safeguarding Lead', true, true, 'all', 'Zero-tolerance of abuse, neglect, exploitation, and discrimination with mandatory reporting duties.', '/documents/safeguarding-policy'),
('DOC-BND-01', 'Professional Boundaries & Conduct Policy', 'Workforce & Governance', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations & Governance Lead', true, true, 'worker', 'Standards for maintaining appropriate physical, financial, emotional, and social boundaries.', '/documents/professional-boundaries'),
('DOC-WHS-01', 'Work Health & Safety (WHS) and Hazard Policy', 'Work Health & Safety', '2026.1', '2026-07-01', '2027-06-30', 'current', 'WHS Officer', true, true, 'all', 'Safe systems of work in domestic community environments, risk assessments, and PPE protocols.', '/documents/whs-policy'),
('DOC-LNE-01', 'Lone Worker & Community Safety Protocol', 'Work Health & Safety', '2026.1', '2026-07-01', '2027-06-30', 'current', 'WHS Officer', true, true, 'worker', 'Safety procedures for solitary home visits, duress check-ins, and dangerous situation withdrawal.', '/documents/lone-worker-policy'),
('DOC-BCP-01', 'Business Continuity & Disaster Management Plan', 'Governance & Continuity', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations & Governance Lead', false, false, 'all', 'Contingency plans for severe weather, power loss, workforce shortages, and critical participant support continuity.', '/documents/business-continuity'),
('DOC-IPC-01', 'Infection Prevention & Hygiene Protocol', 'Health & Safety', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations Lead', true, true, 'all', 'Hand hygiene, PPE use, cross-contamination prevention, and illness reporting standards.', '/documents/infection-prevention'),
('DOC-TRN-01', 'Participant Transport & Vehicle Safety Standard', 'Transport & Safety', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations Lead', true, true, 'worker', 'Driver licensing, comprehensive insurance, seatbelt adherence, roadworthiness, and transport incident management.', '/documents/transport-safety'),
('DOC-MNY-01', 'Money Handling & Financial Integrity Protocol', 'Finance & Safeguarding', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Finance Lead', true, true, 'all', 'Safeguards for handling participant cash during community shopping, mandatory receipts, and zero financial gifts.', '/documents/money-handling'),
('DOC-COI-01', 'Conflict of Interest Policy & Register', 'Governance & Integrity', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations & Governance Lead', true, true, 'worker', 'Disclosure requirements for personal, commercial, or relational conflicts affecting service delivery.', '/documents/conflict-of-interest'),
('DOC-REC-01', 'Records Retention, Disposal & Archival Policy', 'Privacy & Compliance', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Privacy Officer', false, false, 'all', 'Strict compliance with Australian 7-year (adult) and age-25/7-year (child) NDIS record retention standards.', '/documents/records-retention'),
('DOC-SCR-01', 'Worker Screening, Background Check & Suitability Policy', 'Workforce & Governance', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Operations & Governance Lead', true, true, 'worker', 'Mandatory NDIS Worker Screening Check, National Police Check, WWCC, and referee verification before roster placement.', '/documents/worker-screening-policy'),
('DOC-MED-01', 'Medication Assistance Standard (Non-Clinical / Prompting)', 'Health & Care Governance', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Care Governance Lead', true, true, 'worker', 'Protocols strictly limited to assistance with self-administration, Webster pack verification, and prompting.', '/documents/medication-assistance'),
('DOC-MNH-01', 'Manual Handling & Ergonomics Standard', 'Work Health & Safety', '2026.1', '2026-07-01', '2027-06-30', 'current', 'WHS Officer', true, true, 'worker', 'Ergonomic principles, participant transfer assistance rules, and no-manual-lifting hazardous load restrictions.', '/documents/manual-handling'),
('DOC-CLN-01', 'Clinical Governance & Scope-of-Practice Standard', 'Clinical Governance', '2026.1', '2026-07-01', '2027-06-30', 'current', 'Clinical Governance Lead', true, true, 'all', 'Controlled definition of non-clinical boundary. High-intensity clinical supports disabled until clinical lead appointment.', '/documents/clinical-scope')
ON CONFLICT (document_code, version) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  effective_date = EXCLUDED.effective_date,
  review_date = EXCLUDED.review_date,
  status = EXCLUDED.status,
  owner_approver = EXCLUDED.owner_approver,
  acknowledgement_required = EXCLUDED.acknowledgement_required,
  is_public = EXCLUDED.is_public,
  target_audience = EXCLUDED.target_audience,
  change_summary = EXCLUDED.change_summary,
  source_template_url = EXCLUDED.source_template_url;
