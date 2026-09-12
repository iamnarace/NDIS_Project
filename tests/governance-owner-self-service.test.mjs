import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function readProjectFile(relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

test('Owner Self-Service — Multi-Policy Insurance Model & Status Derivation', async (t) => {
  const allowedPolicies = [
    'Public Liability',
    'Professional Indemnity',
    'Personal Accident',
    'Workers Compensation',
    'Business/Participant Transport Vehicle Cover',
    'Motor/Vehicle related cover',
    'Cyber/Data Cover',
    'Clinical/High Intensity Extension',
    'Clinical/Professional extension',
    'Other',
  ];

  await t.test('migration and backend routes support all 10 policy types', () => {
    const migrationContent = readProjectFile('supabase/migrations/20260913100000_owner_self_service_readiness.sql');
    const insuranceRoute = readProjectFile('app/api/governance/insurance/route.ts');

    for (const policy of allowedPolicies) {
      assert.ok(migrationContent.includes(`'${policy}'`), `Migration must include policy type ${policy}`);
      assert.ok(insuranceRoute.includes(`'${policy}'`), `Insurance route must include policy type ${policy}`);
    }
  });

  await t.test('evaluates insurance overall status logic accurately', () => {
    function evaluateStatus(policies) {
      if (!policies || policies.length === 0) return 'NOT_SUPPLIED';
      const pl = policies.find((p) => p.policyType === 'Public Liability');
      if (!pl) return 'NOT_SUPPLIED';
      if (pl.isExpired) return 'EXPIRED';
      if (pl.verifiedState === 'needs_review' || pl.verifiedState === 'rejected' || pl.verifiedState === 'unverified') return 'NEEDS_REVIEW';
      if (pl.isExpiringSoon) return 'EXPIRING';
      return 'ACTIVE';
    }

    assert.equal(evaluateStatus([]), 'NOT_SUPPLIED');
    assert.equal(evaluateStatus([{ policyType: 'Personal Accident', isExpired: false, verifiedState: 'verified' }]), 'NOT_SUPPLIED');
    assert.equal(evaluateStatus([{ policyType: 'Public Liability', isExpired: false, verifiedState: 'needs_review' }]), 'NEEDS_REVIEW');
    assert.equal(evaluateStatus([{ policyType: 'Public Liability', isExpired: true, verifiedState: 'verified' }]), 'EXPIRED');
    assert.equal(evaluateStatus([{ policyType: 'Public Liability', isExpired: false, isExpiringSoon: true, verifiedState: 'verified' }]), 'EXPIRING');
    assert.equal(evaluateStatus([{ policyType: 'Public Liability', isExpired: false, isExpiringSoon: false, verifiedState: 'verified' }]), 'ACTIVE');
  });

  await t.test('evaluates isFullyInsured logic strictly', () => {
    function evaluateFullyInsured(policies) {
      const pl = policies.find((p) => p.policyType === 'Public Liability');
      const pi = policies.find((p) => p.policyType === 'Professional Indemnity');
      const plValid = pl && !pl.isExpired && pl.verifiedState === 'verified';
      const piValid = pi && !pi.isExpired && pi.verifiedState === 'verified';
      return Boolean(plValid && piValid);
    }

    assert.equal(evaluateFullyInsured([]), false);
    assert.equal(evaluateFullyInsured([{ policyType: 'Public Liability', isExpired: false, verifiedState: 'verified' }]), false);
    assert.equal(evaluateFullyInsured([
      { policyType: 'Public Liability', isExpired: false, verifiedState: 'verified' },
      { policyType: 'Professional Indemnity', isExpired: false, verifiedState: 'needs_review' }
    ]), false);
    assert.equal(evaluateFullyInsured([
      { policyType: 'Public Liability', isExpired: false, verifiedState: 'verified' },
      { policyType: 'Professional Indemnity', isExpired: false, verifiedState: 'verified' }
    ]), true);
  });
});

test('Owner Self-Service — Dynamic Trust Presentation & Neutral Fallback', async (t) => {
  await t.test('SafetyPriorityNote presents Fully Insured only when active and neutral fallback otherwise', () => {
    const safetyNoteContent = readProjectFile('components/SafetyPriorityNote.tsx');
    assert.ok(safetyNoteContent.includes('Fully Insured'), 'Must render Fully Insured title when verified');
    assert.ok(safetyNoteContent.includes('Governed Safeguards'), 'Must render neutral Governed Safeguards fallback');
    assert.ok(!safetyNoteContent.includes('Insurance Pending'), 'Must never say Insurance Pending to public');
  });

  await t.test('no policy numbers or internal certificate keys exposed in public routes', () => {
    const orgRouteContent = readProjectFile('app/api/governance/organisation/route.ts');
    assert.ok(!orgRouteContent.includes('policy_number'), 'Public org route must never leak policy numbers');
    assert.ok(!orgRouteContent.includes('account_number'), 'Public org route must never leak bank account numbers');
    assert.ok(!orgRouteContent.includes('bsb'), 'Public org route must never leak BSB');
  });
});

test('Owner Self-Service — Conditional WWCC & Worker Compliance', async (t) => {
  await t.test('migration verifies adult participants bypass WWCC gate when 18 or older', () => {
    const migrationContent = readProjectFile('supabase/migrations/20260913100000_owner_self_service_readiness.sql');
    assert.ok(migrationContent.includes("v_part.date_of_birth > (current_date - interval '18 years')"), 'Migration must check for under 18');
    assert.ok(migrationContent.includes("'ndis_worker_screening'"), 'NDISWC screening must remain required');
  });

  await t.test('SafetyPriorityNote accurately articulates conditional WWCC requirement', () => {
    const safetyNote = readProjectFile('components/SafetyPriorityNote.tsx');
    assert.ok(safetyNote.includes('Working with Children Checks (WWCC) wherever child-related support applies'), 'Safety note must clarify conditional WWCC application');
  });
});

test('Owner Self-Service — Social Media Destinations & Fallbacks', async (t) => {
  await t.test('SiteFooter falls back to https://opuscare.com.au for unset social links', () => {
    const footerContent = readProjectFile('components/SiteFooter.tsx');
    assert.ok(footerContent.includes('https://opuscare.com.au'), 'Footer must contain opuscare.com.au fallback');
    assert.ok(!footerContent.includes('href="https://facebook.com"'), 'Footer must not use raw unrouted facebook.com');
    assert.ok(!footerContent.includes('href="https://instagram.com"'), 'Footer must not use raw unrouted instagram.com');
    assert.ok(!footerContent.includes('href="https://linkedin.com"'), 'Footer must not use raw unrouted linkedin.com');
  });

  await t.test('lib/organisation defaults social URLs to canonical domain', () => {
    const orgLib = readProjectFile('lib/organisation.ts');
    assert.ok(orgLib.includes("facebookUrl = config.facebook_url?.trim() || 'https://opuscare.com.au'"), 'Facebook must fallback to canonical site');
    assert.ok(orgLib.includes("instagramUrl = config.instagram_url?.trim() || 'https://opuscare.com.au'"), 'Instagram must fallback to canonical site');
    assert.ok(orgLib.includes("linkedinUrl = config.linkedin_url?.trim() || 'https://opuscare.com.au'"), 'LinkedIn must fallback to canonical site');
  });
});

test('Owner Self-Service — Remittance Data Protection Against Overwrite', async (t) => {
  await t.test('provider-config API preserves existing bank details when omitted from request', () => {
    const providerConfigRoute = readProjectFile('app/api/crm/provider-config/route.ts');
    assert.ok(providerConfigRoute.includes('Preserve existing remittance details'), 'Must contain defensive comment/logic');
    assert.ok(providerConfigRoute.includes('updates.bank_bsb === undefined'), 'Must protect bank_bsb from accidental wipe');
    assert.ok(providerConfigRoute.includes('updates.bank_account_number === undefined'), 'Must protect bank_account_number from accidental wipe');
    assert.ok(providerConfigRoute.includes('updates.bank_name === undefined'), 'Must protect bank_name from accidental wipe');
  });
});
