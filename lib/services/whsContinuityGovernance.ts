/**
 * Opus Care Support Services — Governance G5 WHS, Transport & Continuity Engine
 *
 * Implements:
 * 1. Home & Community WHS Assessment & Readiness Gate
 * 2. Lone-Worker Check-In & Welfare Escalation State Machine
 * 3. Transport Governance & Separation of NDIS Client Billing vs Worker Reimbursement
 * 4. Participant Money & Property Handling Controls
 * 5. Regional Emergency Disruption Profiles & Business Continuity Prioritisation
 */

export interface WhsAssessmentRecord {
  id?: string;
  participant_id: string;
  whs_type: string;
  service_location_type: string;
  access_parking_hazards?: string | null;
  slips_trips_hazards?: string | null;
  manual_handling_hazards?: string | null;
  mobility_transfer_hazards?: string | null;
  smoking_smoke_exposure?: string | null;
  pets_animals?: string | null;
  aggression_security_concerns?: string | null;
  sharps_infection_risks?: string | null;
  electrical_fire_hazards?: string | null;
  bathroom_toileting_access?: string | null;
  communication_network_coverage?: string | null;
  lone_worker_controls?: string | null;
  emergency_evacuation_plan?: string | null;
  participant_specific_whs_controls?: string[];
  worker_safety_instructions?: string | null;
  whs_signed_off_at?: string | null;
  whs_signed_off_by?: string | null;
  review_date?: string | null;
}

export function evaluateWhsReadiness(assessment: WhsAssessmentRecord | null | undefined): {
  isReady: boolean;
  blockers: string[];
  requiresReview: boolean;
} {
  const blockers: string[] = [];

  if (!assessment) {
    blockers.push('Mandatory Home & Community WHS environment assessment is missing.');
    return { isReady: false, blockers, requiresReview: true };
  }

  if (!assessment.whs_signed_off_at) {
    blockers.push('Home & Community WHS assessment is pending sign-off by Operations/WHS Lead.');
  }

  if (assessment.review_date) {
    const reviewDate = new Date(assessment.review_date);
    const today = new Date();
    if (reviewDate < today) {
      blockers.push(`Home & Community WHS assessment expired on ${assessment.review_date} and requires review.`);
    }
  }

  return {
    isReady: blockers.length === 0,
    blockers,
    requiresReview: blockers.length > 0,
  };
}

export type LoneWorkerWelfareStatus =
  | 'pending'
  | 'checked_in'
  | 'checked_out'
  | 'missed_checkout_alert'
  | 'escalated'
  | 'welfare_confirmed';

export function evaluateLoneWorkerWelfareStatus(
  shift: {
    checkin_at?: string | null;
    checkout_at?: string | null;
    expected_finish_at: string;
    welfare_status?: string;
  },
  now: Date = new Date(),
  gracePeriodMinutes: number = 15
): {
  status: LoneWorkerWelfareStatus;
  isAlert: boolean;
  alertReason?: string;
} {
  // If already checked out or resolved, keep completed state
  if (shift.checkout_at) {
    return { status: 'checked_out', isAlert: false };
  }
  if (shift.welfare_status === 'welfare_confirmed') {
    return { status: 'welfare_confirmed', isAlert: false };
  }
  if (shift.welfare_status === 'escalated') {
    return { status: 'escalated', isAlert: true, alertReason: 'Lone worker check-out overdue; escalation active.' };
  }

  const expectedFinish = new Date(shift.expected_finish_at);
  const alertThreshold = new Date(expectedFinish.getTime() + gracePeriodMinutes * 60000);

  if (shift.checkin_at) {
    if (now > alertThreshold) {
      return {
        status: 'missed_checkout_alert',
        isAlert: true,
        alertReason: `Worker checked in but missed checkout deadline by >${gracePeriodMinutes} minutes. Initiate welfare contact.`,
      };
    }
    return { status: 'checked_in', isAlert: false };
  }

  // Not checked in yet
  const shiftStart = new Date(expectedFinish.getTime() - 2 * 3600000); // approximate or pending
  if (now > shiftStart && now < alertThreshold) {
    return { status: 'pending', isAlert: false };
  }

  return { status: 'pending', isAlert: false };
}

export interface TransportAccountingResult {
  isTransportShift: boolean;
  activityBasedTransportBilled: number;
  providerTravelLabourBilled: number;
  providerTravelNonLabourBilled: number;
  employeeMileageReimbursement: number;
  validationErrors: string[];
}

export function calculateTransportAccounting(input: {
  isTransportShift: boolean;
  distanceKm: number;
  travelLabourMinutes?: number;
  hourlyRate?: number;
  tollsAndParkingAmount?: number;
  workerUsesOwnVehicle?: boolean;
  mmmZone?: number; // 1-3 = max 30 min, 4-5 = max 60 min
}): TransportAccountingResult {
  const errors: string[] = [];

  if (!input.isTransportShift && input.distanceKm > 0) {
    // Distance recorded on a non-transport shift should be verified
  }

  const ratePerKm = 1.00; // Standard NDIS Activity-Based Transport benchmark rate
  const schadsReimbursementPerKm = 0.96; // SCHADS Award private vehicle reimbursement rate

  let activityBilled = 0;
  if (input.isTransportShift && input.distanceKm > 0) {
    activityBilled = Math.round(input.distanceKm * ratePerKm * 100) / 100;
  }

  // Provider travel labour cap (MMM 1-3: 30 min max, MMM 4-5: 60 min max)
  const maxTravelMinutes = (input.mmmZone && input.mmmZone >= 4) ? 60 : 30;
  const actualTravelMinutes = Math.min(input.travelLabourMinutes || 0, maxTravelMinutes);
  if ((input.travelLabourMinutes || 0) > maxTravelMinutes) {
    errors.push(`Provider travel minutes (${input.travelLabourMinutes}m) exceeded NDIS regional limit (${maxTravelMinutes}m) for MMM ${input.mmmZone || '1-3'}; capped at ${maxTravelMinutes}m.`);
  }

  const standardHourlyRate = input.hourlyRate || 73.58;
  const travelLabourBilled = Math.round((actualTravelMinutes / 60) * standardHourlyRate * 100) / 100;

  const travelNonLabourBilled = Math.round((input.tollsAndParkingAmount || 0) * 100) / 100;

  // Employee expense reimbursement (strictly separated from NDIS participant billing)
  let employeeReimbursement = 0;
  if (input.workerUsesOwnVehicle && input.distanceKm > 0) {
    employeeReimbursement = Math.round(input.distanceKm * schadsReimbursementPerKm * 100) / 100;
  }

  return {
    isTransportShift: input.isTransportShift,
    activityBasedTransportBilled: activityBilled,
    providerTravelLabourBilled: travelLabourBilled,
    providerTravelNonLabourBilled: travelNonLabourBilled,
    employeeMileageReimbursement: employeeReimbursement,
    validationErrors: errors,
  };
}

export function validateParticipantMoneyTransaction(input: {
  amount: number;
  paymentMethod: string;
  receiptObtained: boolean;
  receiptNumber?: string | null;
  participantAuthorityConfirmed: boolean;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.amount <= 0) {
    errors.push('Transaction amount must be greater than $0.00.');
  }

  if (!input.participantAuthorityConfirmed) {
    errors.push('Prior written or verbal authority from participant or guardian is mandatory before handling money.');
  }

  if (!input.receiptObtained) {
    errors.push('Itemised receipt or tax invoice is mandatory for all participant money transactions.');
  }

  const validMethods = ['cash', 'participant_card', 'direct_deposit'];
  if (!validMethods.includes(input.paymentMethod)) {
    errors.push(`Invalid payment method: ${input.paymentMethod}. Must be cash, participant_card, or direct_deposit.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface RegionalDisruptionProfile {
  region: 'Northern NSW' | 'Sydney';
  primaryHazards: string[];
  statutoryEmergencyContacts: { agency: string; phone: string }[];
  operatingProcedures: string;
}

export const REGIONAL_DISRUPTION_PROFILES: Record<'Northern NSW' | 'Sydney', RegionalDisruptionProfile> = {
  'Northern NSW': {
    region: 'Northern NSW',
    primaryHazards: [
      'Riverine flooding (Clarence River, Richmond River)',
      'Bushfire emergencies in rural / hinterland zones',
      'Road closures (Pacific Hwy / Summerland Way disruptions)',
      'Subtropical storms and prolonged power outages',
    ],
    statutoryEmergencyContacts: [
      { agency: 'NSW State Emergency Service (SES)', phone: '132 500' },
      { agency: 'NSW Rural Fire Service (RFS)', phone: '1800 679 737' },
      { agency: 'Emergency Services (Police, Ambulance, Fire)', phone: '000' },
      { agency: 'Live Traffic NSW (Road Closures)', phone: '132 701' },
    ],
    operatingProcedures: 'Prioritise P1 daily living participants who require critical food/hygiene. Confirm alternate rural access routes. Coordinate with Clarence Valley / Northern Rivers Local Emergency Management Committee if isolation occurs.',
  },
  'Sydney': {
    region: 'Sydney',
    primaryHazards: [
      'Extreme urban heatwaves (>40°C in Western Sydney / Parramatta / Blacktown)',
      'Public transport rail/bus network outages',
      'Flash flooding in urban storm corridors',
      'Severe power outages impacting air conditioning / essential medical gear',
    ],
    statutoryEmergencyContacts: [
      { agency: 'Emergency Services (000)', phone: '000' },
      { agency: 'NSW State Emergency Service (SES)', phone: '132 500' },
      { agency: 'Transport for NSW Info', phone: '131 500' },
      { agency: 'NSW Health Heat Health Line', phone: '1800 022 222' },
    ],
    operatingProcedures: 'Enforce heat safety protocols for outdoor community access. Confirm active hydration and home cooling for vulnerable participants. Plan worker public transport buffer times.',
  },
};
