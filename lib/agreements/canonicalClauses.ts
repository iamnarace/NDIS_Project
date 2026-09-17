type ClauseSchema = Record<string, unknown>;

const PARTICIPANT_SERVICE_AGREEMENT: ClauseSchema = {
  '1. Purpose, parties and authority': [
    'This agreement records the supports that the participant has chosen Opus Care Support Services to provide, how those supports will be delivered and paid for, and the responsibilities of each party. It should be read with the individual Schedule of Supports, current pricing schedule, privacy notice and any participant-specific support or risk plans that the parties have accepted.',
    'The provider is the proprietor identified in the agreement particulars, trading as Opus Care Support Services. The participant is the person named in the agreement particulars. A nominee, guardian or other representative may act only within their lawful or recorded authority. Opus Care may ask for evidence of that authority before accepting instructions, changing services or sharing information.',
    'Opus Care currently supports self-managed and plan-managed participants as an unregistered provider. This agreement does not state or imply that Opus Care is an NDIS registered provider, an agent of the NDIA, a plan manager or a substitute decision-maker for the participant.',
    'The participant should take the time they need to understand this agreement. They may ask for an accessible version, an interpreter, a support person, an advocate or independent advice before signing. Questions and requested changes should be discussed before the agreement is accepted.',
  ],
  '2. Supports and individual schedule': [
    'The supports to be delivered are the items listed in the Schedule of Supports attached to or generated with this agreement. The schedule should identify the support description, relevant item or service reference, expected frequency or hours, location, agreed unit price and any agreed travel, transport or non-labour charges.',
    'Support is person-centred and will be planned with the participant. Workers will follow the participant\'s reasonable preferences, goals, communication needs and approved support instructions while respecting dignity, privacy, choice and control. The participant remains free to make decisions about their life and may involve a trusted person in planning and reviews.',
    'A listed weekly quantity is a planning estimate unless the schedule expressly states that a recurring roster has been confirmed. Funding estimates are not a guarantee that an NDIS plan will pay a claim. The participant or plan manager remains responsible for confirming that sufficient and appropriate funding is available.',
    'Opus Care will not add a materially different support, increase an agreed price, or substantially change the recurring service pattern without discussing the change and recording agreement. Clinical, restrictive-practice, registered-provider-only or other services outside the approved Opus service scope are not included merely because they appear in an NDIS plan.',
  ],
  '3. Service delivery and communication': [
    'The parties will agree where and when supports are ordinarily delivered. Times may change by mutual agreement, because of participant choice, worker availability, safety, emergencies or events outside reasonable control. Opus Care will communicate material delays, substitutions or cancellations as soon as reasonably practicable.',
    'Opus Care may match or change workers after considering participant preferences, service requirements, worker skills, clearances, availability, location and safety. The participant may raise concerns about a match and may request a different worker. Opus Care cannot guarantee a particular worker but will take reasonable steps to maintain continuity.',
    'The participant should provide current contact details and explain preferred communication methods, accessibility needs and who may receive service information. Routine communication may occur by phone, email, SMS or the participant portal. Emergency matters should not be sent only by email or portal message.',
    'Support workers will record information reasonably needed to evidence service delivery, participant outcomes, incidents, expenses, travel and billing. Records should be factual, respectful and limited to information relevant to the support relationship.',
  ],
  '4. Prices, invoices and payment': [
    'The participant agrees to pay the prices stated in the Schedule of Supports. Unless a fixed lower price is expressly recorded, an agreed reference to the applicable NDIS price limit means the price may change when the relevant NDIS Pricing Arrangements and Price Limits change. Opus Care will give reasonable notice of a price change before applying it to future supports.',
    'Invoices will identify the participant, service date, support description or item, quantity, unit price and amount payable. Opus Care is not registered for GST at the date of this template, so invoices must not add GST and should state that GST has not been charged because the supplier is not registered for GST. If that status changes, future invoicing will be updated lawfully and communicated.',
    'For self-managed funding, the participant or their authorised payer is responsible for payment. For plan-managed funding, invoices may be sent to the nominated plan manager using the details supplied by the participant. The participant remains responsible for telling Opus Care promptly if the plan manager, funding arrangement or invoice contact changes.',
    'If an invoice is disputed, the participant should identify the disputed service or amount promptly. The parties will review attendance, service records, the agreed schedule and applicable pricing rules. A genuine dispute will be investigated fairly; undisputed amounts remain payable. Opus Care must not describe an invoice as paid unless payment has actually been recorded.',
  ],
  '5. Travel, transport, expenses and cancellations': [
    'Provider travel, activity-based transport, participant transport and non-labour expenses are different charges. A charge will be made only where it is permitted, relevant to the support, within the applicable pricing rules and agreed in the Schedule of Supports or separately before it is incurred. Employee vehicle reimbursement is an internal employment matter and is not itself an NDIS charge.',
    'Where a worker uses a vehicle with the participant, the parties should agree the purpose, likely distance, applicable charge and any participant contribution before travel. Tolls, parking, entry fees or activity costs are payable only where disclosed and agreed. Opus Care will not treat a notional NDIS unit price as an automatic per-kilometre rate.',
    'The participant should give as much notice as possible when cancelling or changing a support. A short-notice cancellation may be charged only where the current NDIS pricing rules permit it, the cancellation terms were agreed, the conditions for claiming are met and the worker could not be productively reassigned. The Schedule of Supports should state the notice rule applying to the booked support.',
    'Opus Care will not charge merely because a cancellation occurred. The reason, notice received, roster commitment and applicable rule must be considered and recorded. If Opus Care cancels and cannot provide an acceptable alternative, the participant will not be charged for the undelivered support.',
  ],
  '6. Provider and participant responsibilities': [
    'Opus Care will provide supports with care and skill, respect the participant\'s rights, follow the NDIS Code of Conduct where it applies, maintain appropriate worker screening and competency controls, keep accurate service records, protect personal information, issue clear invoices and provide a practical way to raise feedback or complaints.',
    'Opus Care will take reasonable steps to deliver supports consistently and safely. It will not knowingly roster a worker where mandatory internal readiness checks are incomplete for the relevant service. It will explain when a requested service is outside scope, requires further assessment or needs a registered or specialist provider.',
    'The participant will treat workers respectfully, provide information reasonably needed for safe support, notify Opus Care of material changes to risks or service needs, maintain a reasonably safe service environment, use funding consistently with their plan and agreed supports, and pay valid invoices by the agreed method.',
    'Neither party is required to accept violence, abuse, harassment, discrimination, serious threats, unsafe instructions, unlawful conduct or unmanaged hazards. Immediate safety action may include pausing or ending a shift, contacting emergency services, seeking clinical assistance, notifying an authorised representative or arranging a review before supports resume.',
  ],
  '7. Safety, incidents and emergencies': [
    'The participant should tell Opus Care about known hazards, allergies, mobility or transfer needs, behaviour risks, emergency contacts and other information required for safe delivery. Opus Care will collect detailed health or clinical information only where relevant and will use participant-specific plans when a service requires them.',
    'In an emergency, the worker may contact 000, provide assistance within their competence, follow the participant\'s recorded emergency instructions and notify the appropriate contact. Opus Care does not replace emergency, medical, nursing, mental health or crisis services.',
    'Incidents, injuries, near misses, suspected abuse, neglect, exploitation or other safeguarding concerns will be documented and escalated under Opus Care procedures. The participant will be supported to understand what occurred and what follow-up is proposed, subject to privacy, safety and legal limits.',
    'A serious or unresolved risk may require temporary service changes or suspension while a safe plan is developed. Opus Care will avoid unnecessary disruption, consider reasonable alternatives and explain the operational reason for a safety decision.',
  ],
  '8. Privacy, records and information sharing': [
    'Opus Care may collect personal, disability, service, billing and limited health information needed to assess suitability, plan and deliver supports, manage safety, communicate with authorised people, invoice, respond to incidents and meet record-keeping obligations. The current privacy notice explains collection, use, storage, access and complaint options.',
    'Information will be shared only for an authorised or lawful purpose and limited to what is reasonably necessary. The participant may record nominees, plan managers, support coordinators, health professionals or other contacts with whom specified information may be shared. An information-sharing authority can be changed or withdrawn, subject to information already used lawfully and any continuing legal obligations.',
    'Records may be stored electronically, including in the Opus Care CRM and private document storage. Reasonable security, access controls and audit records will be used. Email and SMS carry inherent risks; highly sensitive documents should use the approved secure process where available.',
    'The participant may ask to access or correct personal information. Opus Care may retain service, billing, employment, incident and legal records for the period required by applicable law or a documented retention policy. Records will not be kept merely because they might be useful someday.',
  ],
  '9. Feedback, complaints, changes and ending the agreement': [
    'The participant may provide feedback or make a complaint without fear that reasonable supports will be withdrawn or reduced as retaliation. Complaints can be made directly to Opus Care, with help from a nominee, advocate or support person, or to an appropriate external body including the NDIS Quality and Safeguards Commission.',
    'Opus Care will acknowledge and assess complaints, address immediate safety concerns, communicate progress and record outcomes. The participant may request an accessible process and may choose not to identify themselves where an anonymous complaint can reasonably be investigated.',
    'Either party may propose a change to supports, prices, schedules, contacts or other terms. Material changes should be recorded in a variation or replacement agreement and accepted before they take effect. A new NDIS plan, changed funding arrangement or substantially different support need should trigger review.',
    'Either party may end this agreement by giving the notice stated in the agreement particulars or Schedule of Supports. Immediate or shorter termination may occur by agreement or where serious safety, non-payment, unlawful conduct, repeated material breach or another urgent circumstance makes continuation unreasonable. Accrued payment obligations and rights that logically continue after termination are not erased.',
  ],
  '10. General terms, review and signatures': [
    'This agreement begins on the recorded commencement date and continues until the recorded review or end date, replacement, termination or another event stated in the agreement. The parties should review it at least when the participant receives a new plan, support needs materially change, pricing arrangements change, or either party requests a review.',
    'If part of this agreement is invalid or cannot be enforced, the remaining parts continue to operate to the extent possible. A delay in enforcing a right does not automatically waive it. This agreement does not remove rights or guarantees available under Australian Consumer Law, the NDIS framework or other applicable law.',
    'The Schedule of Supports and any accepted written variation form part of this agreement. If documents conflict, the most recently accepted specific term ordinarily prevails over a general term, subject to applicable law. Informal discussions do not change a material term unless the change is recorded and accepted.',
    'Electronic records and electronic signatures may be used. Each signer confirms their name, capacity and authority and should retain a copy of the completed agreement. The executed PDF and associated audit record stored by Opus Care are the controlled record of the terms accepted by the parties.',
  ],
};

const WORKER_EMPLOYMENT_AGREEMENT: ClauseSchema = {
  '1. Parties, appointment and commencement': [
    'Opus Care Support Services employs the person named in the agreement particulars in the recorded position from the commencement date. The employee reports to the manager or delegate identified by Opus Care and accepts the employment basis stated in the particulars.',
    'The employee will perform the duties in the attached position description, deliver respectful participant support, maintain required records, follow lawful and reasonable directions, and perform other duties reasonably within the role, skills and classification.',
    'Any probation or minimum-employment period recorded in the particulars is an assessment period and does not reduce a right or entitlement under applicable law. Opus Care will explain performance concerns and provide a reasonable opportunity to respond before making an employment decision, except where immediate action is lawfully required.',
  ],
  '2. Employment status, award and classification': [
    'The employment status, classification, pay point and industrial instrument are those recorded in the particulars. These details must be confirmed against current role duties and workplace information before the agreement is issued.',
    'The National Employment Standards and any applicable modern award, enterprise agreement or legislation apply to the employment relationship. This agreement does not exclude or provide less than a minimum legal entitlement. Where a minimum entitlement is more beneficial than an inconsistent term, the minimum entitlement applies.',
    'A change in duties does not automatically change classification. Opus Care will review classification when duties materially change or when the employee raises a reasonable classification concern.',
  ],
  '3. Hours, rosters, breaks and place of work': [
    'Ordinary hours, availability and any guaranteed pattern are those recorded in the particulars. Additional or changed shifts are offered and managed in accordance with the employment basis, applicable industrial instrument and operational needs. A participant cancellation does not itself determine the employee\'s lawful pay entitlement.',
    'Work may occur in participant homes and community locations across approved service regions. Travel, breaks, minimum engagements, overtime, penalties and allowances are managed under the applicable instrument and confirmed employment settings.',
    'The employee must accurately record start and finish times, breaks, travel and approved expenses using the nominated system. Working outside an approved roster requires prior approval unless urgent action is reasonably necessary to protect health or safety.',
    'Opus Care will consult where required about material changes to regular rosters or ordinary hours. The employee must promptly identify availability changes, fatigue concerns or circumstances that could make an assigned shift unsafe.',
  ],
  '4. Remuneration, allowances, expenses and superannuation': [
    'The ordinary rate and superannuation percentage are recorded in the particulars. Applicable penalties, overtime, allowances and reimbursements are handled separately under the relevant industrial instrument and verified work records. Payroll deductions will be made only where authorised or required by law.',
    'Wages will be paid at the frequency and by the method recorded in the particulars or payroll settings. The employee will receive a payslip and should promptly raise any apparent error so it can be investigated and corrected.',
    'Approved work expenses will be reimbursed under the applicable policy and industrial instrument after sufficient evidence is supplied. Participant transport, provider travel and employee vehicle reimbursement are distinct records and must not be combined or claimed twice.',
  ],
  '5. Leave and absence': [
    'Leave entitlements arise under the National Employment Standards, applicable industrial instrument and Opus Care policies. The employee should request planned leave as early as practicable and must notify the designated manager of an unexpected absence before the affected shift, or as soon as reasonably possible.',
    'Evidence may be requested where permitted by law. The employee must not attend work when unfit to provide safe support and must immediately report a communicable illness, injury, medication effect or other condition that creates a material work health and safety risk.',
  ],
  '6. Conditions before participant-facing work': [
    'Employment and independent rostering are subject to identity and work-right checks, Opus Care screening policy, required clearances, qualifications, induction, training, current First Aid or CPR where required, and role-specific competency. A declaration made during recruitment is not treated as verified evidence.',
    'The employee must keep required credentials current, notify Opus Care of a suspension, restriction, charge or other relevant change where lawful and reasonably connected to the role, and provide updated evidence by the requested date. Opus Care may withhold participant-facing duties where a mandatory readiness requirement is not verified.',
  ],
  '7. Participant rights, professional conduct and boundaries': [
    'The employee must protect participant dignity, privacy, choice and safety; follow the NDIS Code of Conduct where applicable; report incidents and safeguarding concerns; comply with reasonable WHS instructions; and work only within competence and approved participant plans. Violence, abuse, neglect, exploitation, falsification and unauthorised restrictive practices are prohibited.',
    'The employee must maintain professional boundaries, disclose actual or potential conflicts of interest, decline inappropriate gifts or financial arrangements, and never borrow from, lend to, trade with or become a beneficiary of a participant except where expressly lawful and approved under policy.',
    'The employee must not provide clinical, restrictive-practice, medication, financial or other specialised support outside their verified competence, delegation and approved participant instructions. Unclear or unsafe directions must be escalated before proceeding unless immediate emergency action is required.',
  ],
  '8. Work health and safety, incidents and emergencies': [
    'Opus Care and the employee share responsibilities for a safe workplace. The employee must take reasonable care, use supplied equipment correctly, follow risk controls, report hazards and injuries promptly, and participate in reasonable consultation, training and incident review.',
    'In an emergency the employee must prioritise immediate safety, contact emergency services where appropriate, act within training and competence, preserve relevant evidence and notify Opus Care as soon as practicable. Incident and near-miss reports must be factual, timely and complete.',
    'The employee may stop or decline work where they reasonably believe there is a serious and immediate safety risk, while remaining available for reasonable alternative safe duties and following the escalation process.',
  ],
  '9. Confidentiality, privacy, records and systems': [
    'Confidential participant, worker and business information may be used only for authorised work. Records must be accurate, timely and stored in approved systems. Access credentials must not be shared. Confidentiality continues after employment ends, subject to lawful disclosure and protected workplace rights.',
    'Participant information must not be stored on personal devices, personal cloud accounts or unapproved applications. Photography, audio, video and social-media activity involving participants or service information require documented authority and compliance with policy and law.',
    'Employment and service records created in the course of duties remain Opus Care records. Nothing in this clause prevents the employee from accessing their lawful rights, making a protected disclosure, obtaining professional advice or communicating with a regulator or representative as permitted by law.',
  ],
  '10. Property, intellectual property and conflicts': [
    'The employee must take reasonable care of keys, devices, identification, documents, vehicles and other property provided for work and return them when requested or when employment ends. Loss, damage or unauthorised access must be reported promptly.',
    'Materials created specifically in the course of employment for Opus Care belong to Opus Care to the extent permitted by law. This does not transfer ownership of the employee\'s pre-existing material, personal knowledge or legally protected rights.',
    'Other work or business activity must not create unmanaged fatigue, misuse confidential information, divert an Opus Care opportunity, interfere with roster commitments or create an undisclosed conflict with participant interests.',
  ],
  '11. Performance, policies and workplace concerns': [
    'The employee must follow lawful and reasonable workplace policies and procedures as amended from time to time. Policies provide operational direction but do not form part of this agreement unless expressly stated and do not reduce a contractual or statutory entitlement.',
    'Performance, conduct and attendance concerns will be addressed fairly and proportionately. The employee will ordinarily be told the concern, given relevant information and a reasonable opportunity to respond, with a support person available where applicable.',
    'Workplace concerns may be raised with the manager, owner or another nominated contact without victimisation. The parties should first try to resolve a dispute through direct discussion and the applicable workplace process, while preserving any right to seek external assistance.',
  ],
  '12. Changes, stand down and ending employment': [
    'Material changes to classification, employment basis, guaranteed hours, ordinary rate or other core terms require an appropriate written variation accepted by the parties, except where a lawful change applies independently of agreement.',
    'Notice, final pay, redundancy, abandonment, stand down and termination are governed by this agreement, the applicable industrial instrument, the National Employment Standards and other applicable law. Nothing in this agreement authorises an unlawful deduction, stand down or termination.',
    'When employment ends, the employee must return property, complete outstanding records, protect continuing confidentiality and reasonably assist with a safe participant handover. Opus Care will provide final pay and employment records within the legally required timeframe.',
  ],
  '13. General terms and acceptance': [
    'This agreement, its particulars, the position description and any signed written variation record the contractual terms between the parties. If a provision is invalid or unenforceable, it is severed to the minimum extent necessary and the remaining provisions continue.',
    'A failure or delay in exercising a right does not automatically waive that right. Electronic records and signatures may be used. The agreement is governed by the applicable laws of New South Wales and the Commonwealth of Australia.',
    'The employee confirms they have reviewed the agreement and particulars, had an opportunity to ask questions and seek independent advice, and received or been directed to the information statements applicable to their employment basis. The parties must resolve any uncertain award, classification or entitlement before issue or obtain appropriate professional advice.',
  ],
};

const CONTRACTOR_SERVICES_AGREEMENT: ClauseSchema = {
  '1. Engagement and services': [
    'The contractor is engaged to provide the services recorded in the schedule. The parties must confirm that the practical relationship is genuinely one of independent contracting. A label in this document does not override the real legal character of the relationship.',
  ],
  '2. Fees, tax and superannuation': [
    'Fees, invoicing arrangements and approved expenses are recorded in the particulars or schedule. The contractor is responsible for their own tax, registrations and business obligations except where law places an obligation on Opus Care, including any superannuation obligation that may apply despite contractor terminology.',
  ],
  '3. Standards, screening and safety': [
    'Before participant-facing services, the contractor must provide verified evidence of required identity, work rights, screening, insurance, qualifications and competencies. The contractor must protect participant rights, comply with applicable conduct and safety requirements, report incidents and work only within approved scope and competence.',
  ],
  '4. Insurance and liability': [
    'Any required insurance type, limit and evidence must be expressly recorded and verified. The agreement must not state that insurance exists when it has not been supplied and checked. Each party remains responsible for loss to the extent determined by the agreement and applicable law.',
  ],
  '5. Confidentiality, privacy and records': [
    'Participant and business information may be used only for the contracted services and must be protected using approved systems and processes. Service records, incident reports and invoice evidence must be accurate, timely and returned or retained as lawfully directed when the engagement ends.',
  ],
  '6. Conflicts, substitution and subcontracting': [
    'The contractor must disclose conflicts of interest. Substitution or subcontracting is permitted only where expressly approved and where the proposed person meets all participant, screening, competency, privacy and insurance requirements. Approval does not remove the contractor\'s obligations.',
  ],
  '7. Term, changes and ending the engagement': [
    'The engagement continues for the recorded term unless varied or ended. Material service or fee changes must be recorded in writing. Either party may terminate on the stated notice, with immediate action available for serious safety, confidentiality, fraud, unlawful conduct or material breach, subject to applicable law.',
  ],
};

function schemaIsPlaceholder(schema: unknown): boolean {
  if (!schema || typeof schema !== 'object') return true;
  const value = schema as { sections?: unknown };
  return Array.isArray(value.sections) && value.sections.every((section) => typeof section === 'string');
}

export function resolveAgreementClauseSchema(
  templateCode: string | undefined,
  schema: unknown,
  ownerType?: string
): ClauseSchema {
  if (!schemaIsPlaceholder(schema)) return (schema || {}) as ClauseSchema;

  if (
    templateCode === 'DOC-PART-01' ||
    (!templateCode && ownerType === 'participant') ||
    (templateCode === 'CONTROLLED AGREEMENT' && ownerType === 'participant')
  ) {
    return PARTICIPANT_SERVICE_AGREEMENT;
  }
  if (templateCode === 'DOC-CTR-01' || ownerType === 'contractor') {
    return CONTRACTOR_SERVICES_AGREEMENT;
  }
  if (templateCode === 'DOC-WRK-01' || ownerType === 'staff') {
    return WORKER_EMPLOYMENT_AGREEMENT;
  }

  return (schema || {}) as ClauseSchema;
}

export function isCanonicalParticipantAgreement(templateCode?: string, ownerType?: string): boolean {
  return (
    templateCode === 'DOC-PART-01' ||
    (!templateCode && ownerType === 'participant') ||
    (templateCode === 'CONTROLLED AGREEMENT' && ownerType === 'participant')
  );
}
