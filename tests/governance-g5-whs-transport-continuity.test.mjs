import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  evaluateWhsReadiness,
  evaluateLoneWorkerWelfareStatus,
  calculateTransportAccounting,
  validateParticipantMoneyTransaction,
  REGIONAL_DISRUPTION_PROFILES,
} from '../lib/services/whsContinuityGovernance.ts';

test('Governance G5 - Home & Community WHS Assessment & Readiness Gate', async (t) => {
  await t.test('blocks readiness when WHS assessment is missing', () => {
    const check = evaluateWhsReadiness(null);
    assert.strictEqual(check.isReady, false);
    assert.strictEqual(check.requiresReview, true);
    assert.ok(check.blockers.some((b) => b.includes('Mandatory Home & Community WHS environment assessment is missing')));
  });

  await t.test('blocks readiness when WHS assessment is unsigned or pending approval', () => {
    const check = evaluateWhsReadiness({
      participant_id: 'part-1',
      whs_type: 'home_and_community',
      service_location_type: 'participant_home',
      whs_signed_off_at: null,
    });
    assert.strictEqual(check.isReady, false);
    assert.ok(check.blockers.some((b) => b.includes('pending sign-off')));
  });

  await t.test('blocks readiness when WHS assessment is expired', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const check = evaluateWhsReadiness({
      participant_id: 'part-1',
      whs_type: 'home_and_community',
      service_location_type: 'participant_home',
      whs_signed_off_at: '2025-09-01T00:00:00Z',
      review_date: yesterday,
    });
    assert.strictEqual(check.isReady, false);
    assert.ok(check.blockers.some((b) => b.includes('expired')));
  });

  await t.test('passes readiness when valid signed-off WHS assessment is current', () => {
    const futureDate = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
    const check = evaluateWhsReadiness({
      participant_id: 'part-1',
      whs_type: 'home_and_community',
      service_location_type: 'participant_home',
      whs_signed_off_at: new Date().toISOString(),
      review_date: futureDate,
    });
    assert.strictEqual(check.isReady, true);
    assert.strictEqual(check.blockers.length, 0);
  });
});

test('Governance G5 - Lone-Worker Check-In & Welfare Escalation', async (t) => {
  await t.test('detects missed check-out past grace period and produces alert state', () => {
    const now = new Date('2026-09-12T17:30:00Z');
    const expectedFinish = '2026-09-12T17:00:00Z'; // 30 mins ago, grace period is 15 mins

    const result = evaluateLoneWorkerWelfareStatus(
      {
        checkin_at: '2026-09-12T15:00:00Z',
        checkout_at: null,
        expected_finish_at: expectedFinish,
      },
      now,
      15
    );

    assert.strictEqual(result.status, 'missed_checkout_alert');
    assert.strictEqual(result.isAlert, true);
    assert.ok(result.alertReason?.includes('missed checkout deadline'));
  });

  await t.test('remains normal when within shift duration or checked out cleanly', () => {
    const now = new Date('2026-09-12T16:00:00Z');
    const expectedFinish = '2026-09-12T17:00:00Z';

    const duringShift = evaluateLoneWorkerWelfareStatus(
      {
        checkin_at: '2026-09-12T15:00:00Z',
        checkout_at: null,
        expected_finish_at: expectedFinish,
      },
      now,
      15
    );
    assert.strictEqual(duringShift.status, 'checked_in');
    assert.strictEqual(duringShift.isAlert, false);

    const completed = evaluateLoneWorkerWelfareStatus(
      {
        checkin_at: '2026-09-12T15:00:00Z',
        checkout_at: '2026-09-12T17:05:00Z',
        expected_finish_at: expectedFinish,
      },
      now,
      15
    );
    assert.strictEqual(completed.status, 'checked_out');
    assert.strictEqual(completed.isAlert, false);
  });
});

test('Governance G5 - Transport Accounting & Separation of Billing vs Reimbursement', async (t) => {
  await t.test('strictly separates NDIS client Activity-Based Transport from employee mileage reimbursement', () => {
    const result = calculateTransportAccounting({
      isTransportShift: true,
      distanceKm: 25.0,
      travelLabourMinutes: 20,
      hourlyRate: 73.58,
      tollsAndParkingAmount: 14.50,
      workerUsesOwnVehicle: true,
      mmmZone: 2,
    });

    // Client NDIS billing
    assert.strictEqual(result.activityBasedTransportBilled, 25.00, '25km @ $1.00/km billed to client');
    assert.strictEqual(result.providerTravelLabourBilled, 24.53, '20 min travel labour billed to client');
    assert.strictEqual(result.providerTravelNonLabourBilled, 14.50, 'Tolls/parking billed to client');

    // Worker employee expense reimbursement (SCHADS Award rate $0.96/km)
    assert.strictEqual(result.employeeMileageReimbursement, 24.00, '25km @ $0.96/km reimbursed to worker');
    assert.notStrictEqual(result.activityBasedTransportBilled, result.employeeMileageReimbursement);
  });

  await t.test('caps provider travel labour minutes according to regional MMM rules', () => {
    const metroResult = calculateTransportAccounting({
      isTransportShift: false,
      distanceKm: 0,
      travelLabourMinutes: 45, // exceeds 30m cap for MMM 1-3
      hourlyRate: 73.58,
      mmmZone: 2,
    });

    assert.strictEqual(metroResult.providerTravelLabourBilled, 36.79, 'Capped at 30 min (0.5 hr * 73.58)');
    assert.ok(metroResult.validationErrors.some((e) => e.includes('exceeded NDIS regional limit (30m)')));
  });
});

test('Governance G5 - Participant Money & Property Governance', async (t) => {
  await t.test('rejects transaction without receipt or authority', () => {
    const noReceipt = validateParticipantMoneyTransaction({
      amount: 45.00,
      paymentMethod: 'cash',
      receiptObtained: false,
      participantAuthorityConfirmed: true,
    });
    assert.strictEqual(noReceipt.isValid, false);
    assert.ok(noReceipt.errors.some((e) => e.includes('receipt or tax invoice is mandatory')));

    const noAuthority = validateParticipantMoneyTransaction({
      amount: 20.00,
      paymentMethod: 'cash',
      receiptObtained: true,
      receiptNumber: 'REC-991',
      participantAuthorityConfirmed: false,
    });
    assert.strictEqual(noAuthority.isValid, false);
    assert.ok(noAuthority.errors.some((e) => e.includes('Prior written or verbal authority')));
  });

  await t.test('accepts compliant transaction with full audit evidence', () => {
    const valid = validateParticipantMoneyTransaction({
      amount: 32.50,
      paymentMethod: 'cash',
      receiptObtained: true,
      receiptNumber: 'COLES-4819',
      participantAuthorityConfirmed: true,
    });
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.errors.length, 0);
  });
});

test('Governance G5 - Regional Disaster & Business Continuity Profiles', async (t) => {
  await t.test('defines regional hazards and statutory contacts for Northern NSW and Sydney', () => {
    assert.ok(REGIONAL_DISRUPTION_PROFILES['Northern NSW']);
    assert.ok(REGIONAL_DISRUPTION_PROFILES['Sydney']);

    const nsw = REGIONAL_DISRUPTION_PROFILES['Northern NSW'];
    assert.ok(nsw.primaryHazards.some((h) => h.includes('Riverine flooding')));
    assert.ok(nsw.statutoryEmergencyContacts.some((c) => c.agency.includes('SES')));

    const sydney = REGIONAL_DISRUPTION_PROFILES['Sydney'];
    assert.ok(sydney.primaryHazards.some((h) => h.includes('heatwaves')));
    assert.ok(sydney.statutoryEmergencyContacts.some((c) => c.agency.includes('Transport for NSW')));
  });
});

test('Governance G5 - Migration and Schema Validation', async (t) => {
  await t.test('migration creates participant_money_transactions and emergency_continuity_plans tables with RLS', () => {
    const migration = readFileSync('supabase/migrations/20260912220000_governance_g5_whs_transport_continuity.sql', 'utf8');
    assert.ok(migration.includes('participant_money_transactions'));
    assert.ok(migration.includes('emergency_continuity_plans'));
    assert.ok(migration.includes('lone_worker_checkin_required'));
    assert.ok(migration.includes('activity_based_transport_billed'));
    assert.ok(migration.includes('employee_mileage_reimbursement_amount'));
    assert.ok(migration.includes('whs_signed_off_at'));
  });
});
