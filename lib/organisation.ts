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
  designatedSignatoryName: string | null;
  designatedSignatoryTitle: string | null;
  bankName: string | null;
  bankBsb: string | null;
  bankAccountNumber: string | null;
  isBankConfigured: boolean;
  logoDataUri: string;
}

// Authoritative verified Australian Business Number
export const VERIFIED_ABN = '41 267 197 576';

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
    designatedSignatoryName: 'Director of Operations',
    designatedSignatoryTitle: 'Managing Director, Opus Care',
    bankName: null,
    bankBsb: null,
    bankAccountNumber: null,
    isBankConfigured: false,
    logoDataUri,
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

    return {
      legalName: config.legal_name?.trim() || fallback.legalName,
      tradingName: config.trading_name?.trim() || config.legal_name?.trim() || fallback.tradingName,
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
      designatedSignatoryName: config.designated_signatory_name?.trim() || fallback.designatedSignatoryName,
      designatedSignatoryTitle: config.designated_signatory_title?.trim() || fallback.designatedSignatoryTitle,
      bankName: isBankGenuine ? (config.bank_name?.trim() || null) : null,
      bankBsb: isBankGenuine ? rawBsb : null,
      bankAccountNumber: isBankGenuine ? rawAcc : null,
      isBankConfigured: isBankGenuine,
      logoDataUri,
    };
  } catch (err) {
    console.error('getOrganisationProfile error:', err);
    return fallback;
  }
}
