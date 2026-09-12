import fs from 'fs';
import path from 'path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export type GstStatus = 'registered' | 'not_registered' | 'unconfigured';
export type BusinessStructure = 'sole_trader' | 'company' | 'partnership' | 'trust' | 'unconfigured';

export interface OrganisationProfile {
  legalName: string;
  tradingName: string;
  businessStructure: BusinessStructure;
  abn: string | null;
  isAbnConfigured: boolean;
  acn: string | null;
  registeredAddress: string | null;
  phone: string | null;
  email: string;
  billingEmail: string;
  website: string;
  ndisRegistrationStatus: 'unregistered' | 'registered';
  gstStatus: GstStatus;
  isGstRegistered: boolean;
  canIssueTaxInvoice: boolean;
  proprietorLegalName: string | null;
  isProprietorConfigured: boolean;
  contractingEntityDisplay: string;
  designatedSignatoryName: string | null;
  designatedSignatoryTitle: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankBsb: string | null;
  bankAccountNumber: string | null;
  isBankConfigured: boolean;
  logoDataUri: string;
  websiteUrl: string;
  supportEmail: string;
  referralsEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  serviceRegions: string[];
  ageScope: string;
  isFullyInsured: boolean;
  insuranceStatus: 'NOT_SUPPLIED' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'NEEDS_REVIEW';
  operationalReadiness: 'READY' | 'BLOCKED';
  operationalBlockers: string[];
}

// Authoritative configured/owner-confirmed Australian Business Number
export const AUTHORISED_ABN = '41 267 197 576';
export const VERIFIED_ABN = AUTHORISED_ABN;

// Format and sanitize ABN string into standard 'XX XXX XXX XXX' format
export function formatAbn(abn?: string | null): string | null {
  if (!abn) return null;
  const clean = abn.replace(/\s+/g, '');
  if (clean.length !== 11) return abn;
  return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5, 8)} ${clean.slice(8, 11)}`;
}

// Known dummy / placeholder strings that must NEVER be presented on legal / financial documents
const KNOWN_DUMMY_ABNS = new Set([
  '89 654 321 098',
  '89654321098',
  '54 678 912 345',
  '54678912345',
  '54 689 123 456',
  '54689123456',
  '00 000 000 000',
  '00000000000',
  '12 345 678 901',
  '12345678901',
]);

const KNOWN_DUMMY_BANKS = [
  { bsb: '062-000', acc: '1234 5678' },
  { bsb: '062000', acc: '12345678' },
  { bsb: '082-057', acc: '89-214-5561' },
  { bsb: '082057', acc: '892145561' },
];

// Service regions or unverified strings must never be treated as legal registered business address
const UNVERIFIED_ADDRESSES = new Set([
  'clarence valley & northern rivers nsw',
  'clarence valley and northern rivers nsw',
  'suite 2, 18 coldstream street, yamba nsw 2464',
  'suite 2, 18 coldstream street, yamba',
]);

export function isDummyAbn(abn?: string | null): boolean {
  if (!abn) return true;
  const clean = abn.replace(/\s+/g, '');
  if (clean.length !== 11) return true;
  if (KNOWN_DUMMY_ABNS.has(abn) || KNOWN_DUMMY_ABNS.has(clean)) return true;
  if (/^(\d)\1+$/.test(clean)) return true;
  return false;
}

export function isDummyBank(bsb?: string | null, acc?: string | null): boolean {
  if (!bsb || !acc) return true;
  const cleanBsb = bsb.replace(/[\s-]+/g, '');
  const cleanAcc = acc.replace(/[\s-]+/g, '');
  for (const dummy of KNOWN_DUMMY_BANKS) {
    if (
      dummy.bsb.replace(/[\s-]+/g, '') === cleanBsb &&
      dummy.acc.replace(/[\s-]+/g, '') === cleanAcc
    ) {
      return true;
    }
  }
  return false;
}

export function isUnverifiedAddress(addr?: string | null): boolean {
  if (!addr) return true;
  const clean = addr.toLowerCase().trim();
  return UNVERIFIED_ADDRESSES.has(clean);
}

// In-memory cache for canonical base64 logo to avoid reading disk on every request
let cachedLogoDataUri: string | null = null;

export function getCanonicalLogoDataUri(): string {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'brand', 'Opus_Care_Logo_Transparent.png');
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      cachedLogoDataUri = `data:image/png;base64,${buffer.toString('base64')}`;
      return cachedLogoDataUri;
    }
  } catch (err) {
    console.error('Failed to load canonical logo asset from disk:', err);
  }
  return '/brand/Opus_Care_Logo_Transparent.png';
}

export async function getOrganisationProfile(
  customSupabase?: SupabaseClient | null
): Promise<OrganisationProfile> {
  const logoDataUri = getCanonicalLogoDataUri();
  const supabase = customSupabase || createAdminClient();

  const fallback: OrganisationProfile = {
    legalName: 'Opus Care Support Services',
    tradingName: 'Opus Care Support Services',
    businessStructure: 'sole_trader',
    abn: VERIFIED_ABN,
    isAbnConfigured: true,
    acn: null,
    registeredAddress: null, // genuine legal business/correspondence address pending configuration
    phone: null,
    email: 'support@opuscare.com.au',
    billingEmail: 'support@opuscare.com.au',
    website: 'opuscare.com.au',
    ndisRegistrationStatus: 'unregistered',
    gstStatus: 'not_registered',
    isGstRegistered: false,
    canIssueTaxInvoice: false,
    proprietorLegalName: null,
    isProprietorConfigured: false,
    contractingEntityDisplay: 'Opus Care Support Services',
    designatedSignatoryName: 'Director of Operations',
    designatedSignatoryTitle: 'Managing Director, Opus Care',
    bankName: null,
    bankAccountName: null,
    bankBsb: null,
    bankAccountNumber: null,
    isBankConfigured: false,
    logoDataUri,
    websiteUrl: 'https://opuscare.com.au',
    supportEmail: 'support@opuscare.com.au',
    referralsEmail: 'referrals@opuscare.com.au',
    facebookUrl: 'https://opuscare.com.au',
    instagramUrl: 'https://opuscare.com.au',
    linkedinUrl: 'https://opuscare.com.au',
    serviceRegions: ['Northern NSW', 'Sydney'],
    ageScope: '18+',
    isFullyInsured: false,
    insuranceStatus: 'NOT_SUPPLIED',
    operationalReadiness: 'BLOCKED',
    operationalBlockers: ['Operational insurance (Public Liability) has not been supplied.'],
  };

  if (!supabase) return fallback;

  try {
    const { data: config } = await supabase
      .from('provider_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!config) return fallback;

    const rawAbn = config.abn?.trim() || null;
    const isAbnGenuine = rawAbn ? !isDummyAbn(rawAbn) : false;
    const abn = isAbnGenuine ? formatAbn(rawAbn) : VERIFIED_ABN;

    const rawBsb = config.bank_bsb?.trim() || null;
    const rawAcc = config.bank_account_number?.trim() || null;
    const isBankGenuine = rawBsb && rawAcc ? !isDummyBank(rawBsb, rawAcc) : false;

    // Determine GST registration status safely: default to 'not_registered' as authorized
    let gstStatus: GstStatus = 'not_registered';
    if (config.gst_status === 'registered' || config.is_gst_registered === true || process.env.PROVIDER_GST_REGISTERED === 'true') {
      gstStatus = 'registered';
    } else if (config.gst_status === 'not_registered' || config.is_gst_registered === false || process.env.PROVIDER_GST_REGISTERED === 'false') {
      gstStatus = 'not_registered';
    }

    const isGstRegistered = gstStatus === 'registered';
    // Under Australian tax law (ATO), an entity must be registered for GST and have an ABN to issue a "Tax Invoice"
    const canIssueTaxInvoice = Boolean(abn) && isGstRegistered;

    const rawAddress = config.registered_address?.trim() || null;
    const registeredAddress = rawAddress && !isUnverifiedAddress(rawAddress) ? rawAddress : null;

    const tradingName = config.trading_name?.trim() || config.legal_name?.trim() || fallback.tradingName;
    const rawProprietor = config.proprietor_legal_name?.trim() || null;
    const isProprietorConfigured = Boolean(rawProprietor);
    const contractingEntityDisplay = tradingName;

    // Evaluate real-world insurance status from organisation_insurance
    let isFullyInsured = false;
    let insuranceStatus: 'NOT_SUPPLIED' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'NEEDS_REVIEW' = 'NOT_SUPPLIED';
    const operationalBlockers: string[] = [];

    const { data: policies } = await supabase
      .from('organisation_insurance')
      .select('*')
      .neq('status', 'cancelled');

    const activePolicies = (policies || []).filter((p: any) => p.status === 'active');
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (!policies || policies.length === 0) {
      insuranceStatus = 'NOT_SUPPLIED';
      operationalBlockers.push('Required operational insurance (Public Liability) has not been supplied.');
    } else {
      const plPolicy = activePolicies.find((p: any) => p.policy_type === 'Public Liability');
      if (!plPolicy) {
        insuranceStatus = 'NOT_SUPPLIED';
        operationalBlockers.push('Public Liability insurance policy is required.');
      } else {
        const expiryTime = new Date(plPolicy.expiry_date).getTime();
        const isExpired = expiryTime < now;
        const isExpiringSoon = !isExpired && (expiryTime - now) <= thirtyDaysMs;

        if (isExpired) {
          insuranceStatus = 'EXPIRED';
          operationalBlockers.push(`Public Liability insurance expired on ${plPolicy.expiry_date}.`);
        } else if (plPolicy.verified_state === 'needs_review' || plPolicy.verified_state === 'rejected') {
          insuranceStatus = 'NEEDS_REVIEW';
          operationalBlockers.push('Insurance documentation requires review or verification.');
        } else if (isExpiringSoon) {
          insuranceStatus = 'EXPIRING';
          isFullyInsured = true;
        } else {
          insuranceStatus = 'ACTIVE';
          isFullyInsured = true;
        }
      }
    }

    if (!isBankGenuine) {
      operationalBlockers.push('Remittance details (EFT) must be configured for billing.');
    }

    const operationalReadiness = operationalBlockers.length === 0 ? 'READY' : 'BLOCKED';

    const websiteUrl = config.website_url?.trim() || 'https://opuscare.com.au';
    const supportEmail = config.support_email?.trim() || config.email?.trim() || fallback.email;
    const referralsEmail = config.referrals_email?.trim() || 'referrals@opuscare.com.au';
    const facebookUrl = config.facebook_url?.trim() || 'https://opuscare.com.au';
    const instagramUrl = config.instagram_url?.trim() || 'https://opuscare.com.au';
    const linkedinUrl = config.linkedin_url?.trim() || 'https://opuscare.com.au';
    const serviceRegions = Array.isArray(config.service_regions) ? config.service_regions : ['Northern NSW', 'Sydney'];
    const ageScope = config.age_scope?.trim() || '18+';

    return {
      legalName: config.legal_name?.trim() || fallback.legalName,
      tradingName,
      businessStructure: 'sole_trader',
      abn,
      isAbnConfigured: true,
      acn: null, // Sole trader structure does not possess an ACN
      registeredAddress,
      phone: config.phone?.trim() || null,
      email: config.email?.trim() || fallback.email,
      billingEmail: config.email?.trim() || fallback.billingEmail,
      website: 'opuscare.com.au',
      ndisRegistrationStatus: 'unregistered',
      gstStatus,
      isGstRegistered,
      canIssueTaxInvoice,
      proprietorLegalName: rawProprietor,
      isProprietorConfigured,
      contractingEntityDisplay,
      designatedSignatoryName: config.designated_signatory_name?.trim() || fallback.designatedSignatoryName,
      designatedSignatoryTitle: config.designated_signatory_title?.trim() || fallback.designatedSignatoryTitle,
      bankName: isBankGenuine ? (config.bank_name?.trim() || null) : null,
      bankAccountName: isBankGenuine ? (config.bank_account_name?.trim() || config.legal_name?.trim() || fallback.legalName) : null,
      bankBsb: isBankGenuine ? rawBsb : null,
      bankAccountNumber: isBankGenuine ? rawAcc : null,
      isBankConfigured: isBankGenuine,
      logoDataUri,
      websiteUrl,
      supportEmail,
      referralsEmail,
      facebookUrl,
      instagramUrl,
      linkedinUrl,
      serviceRegions,
      ageScope,
      isFullyInsured,
      insuranceStatus,
      operationalReadiness,
      operationalBlockers,
    };
  } catch (err) {
    console.error('getOrganisationProfile error:', err);
    return fallback;
  }
}
