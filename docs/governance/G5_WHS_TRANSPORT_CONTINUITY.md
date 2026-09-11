# Governance G5 — WHS, Home Safety, Transport & Continuity

> Canonical autonomous execution specification. Implement directly after G4 passes.

## Status

`READY AFTER G4 PASSES`

## Objective

Create practical WHS, home/community safety, lone-worker, transport, participant-property, emergency and business-continuity governance integrated with participant onboarding and rostering.

## 1. Reuse existing architecture

Inspect and reuse existing participant risk, worker, roster, incident, document, notification and region/weather/emergency structures where suitable.

Do not create duplicate risk registers without need.

## 2. Home & Community WHS Assessment

Create/reuse a structured assessment supporting context such as:

- service location/type
- access/parking
- stairs/slips/trips
- manual-handling environment
- mobility/transfer environment
- smoking/smoke exposure
- pets/animals
- aggression/violence/security concerns
- sharps/biohazards/infection risks
- medication/chemical storage where relevant
- electrical/fire hazards
- bathroom/toileting access
- communication/network availability
- lone-work considerations
- emergency exits/evacuation
- community/outings risks
- transport-related risks
- participant-specific controls
- worker instructions
- review/expiry/event-triggered review

Do not treat a risk assessment as clinical diagnosis.

Link applicable WHS completion into G1 readiness rather than using a disconnected checkbox.

## 3. Lone-worker safety

Implement a proportionate workflow such as:

`shift start → check-in → expected finish → check-out → missed check-out alert → escalation`

Support:

- emergency contact/escalation chain
- worker mobile/contact confirmation
- configurable grace period
- manual welfare check status
- escalation outcome/audit

Do not build unnecessary continuous surveillance/location tracking.

Historical completed shifts remain intact.

## 4. Transport governance

Keep distinct:

- participant support-related transport/service delivery
- Activity Based Transport NDIS billing
- General Transport funding
- provider travel labour
- provider travel non-labour
- employee mileage/vehicle reimbursement

Do not conflate billing rules with worker reimbursement.

Before a worker transports a participant where Opus policy requires, enforce applicable controls from G2 such as:

- licence
- vehicle details
- registration/roadworthiness evidence
- relevant insurance
- participant transport consent/needs
- vehicle/accessibility suitability where needed

Do not infer that every community-access shift includes billable transport.

## 5. Participant money/property

Create/reuse controls for worker handling of participant money/property where the business allows it.

Support principles such as:

- participant consent/authority
- spending purpose
- amount/items
- receipt/evidence
- worker acknowledgement
- reconciliation
- discrepancy/escalation
- no borrowing, gifts/conflicts, or unauthorised use

Keep financial-support records separate from Opus invoice/payment ledger.

## 6. Emergency/disaster management

Support participant/service continuity information such as:

- participant emergency contacts
- critical service dependencies
- communication method
- evacuation/safe-location information where applicable
- medication/clinical dependency reference without duplicating clinical plan
- alternate worker/contact plan
- service cancellation/reschedule communication
- emergency service escalation
- post-event review

For regional operations, support practical consideration of:

- Northern NSW flood
- bushfire
- severe weather
- road closure/access disruption

and Sydney disruptions such as:

- severe weather
- heat
- transport/access disruption
- local emergencies

Do not hardcode live emergency assumptions; this is planning/governance architecture.

## 7. Business continuity

Create controlled continuity records/checklists for:

- staff unavailability
- system outage
- communications outage
- data/system recovery reference
- office/service-area disruption
- critical participant prioritisation
- backup contact arrangements
- service resumption/review

Do not expose sensitive continuity data publicly.

## 8. Roster integration

The shift decision must consider applicable WHS/transport blockers.

Examples:

- participant WHS assessment required but missing/expired → block/new-shift review
- transport requested but worker transport credentials missing → block transport assignment
- known critical environment risk without control/management clearance → block/review

Do not delete historical shifts.

## 9. Access/RLS

Least privilege:

- participant: own safe relevant safety/transport information where appropriate
- assigned worker: only operational safety instructions for assigned participant/shift
- unrelated worker: no access
- admin/WHS management: governed access
- public: none

Audit direct Supabase access.

## 10. Audit

Track:

- WHS assessment/review
- risk-control changes
- lone-worker missed checkout/escalation
- transport eligibility changes
- participant money/property record/reconciliation
- emergency/continuity activation/review

Server-derived actor identity.

## 11. Tests

At minimum verify:

- required WHS assessment blocks new service readiness/shift when absent
- ordinary historical shifts remain readable
- assigned worker sees relevant safe instructions only
- unrelated worker cannot read WHS details
- transport worker without licence/vehicle/insurance controls is blocked from transport assignment
- non-transport shift does not require irrelevant vehicle controls
- transport billing flags remain separate from employee reimbursement
- lone-worker missed checkout produces escalation state
- participant-money record requires reconciliation/evidence where policy requires
- emergency/continuity records are admin-restricted
- all audit actors trusted/server-derived

Run full repository quality gate.

## G5 exit criteria

- Home/Community WHS is integrated with participant/shift readiness;
- lone-worker check-in/escalation works without unnecessary surveillance;
- transport governance is enforced and billing concepts remain separated;
- participant money/property controls exist where applicable;
- emergency/disaster/business-continuity governance exists;
- least-privilege RLS passes;
- historical data preserved;
- all tests/typecheck/lint/build pass;
- committed/pushed;
- Vercel Production unchanged.

When complete, automatically start G6.