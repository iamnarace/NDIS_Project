import { NextResponse } from 'next/server';
import { getOrganisationProfile } from '@/lib/organisation';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profile = await getOrganisationProfile();
    return NextResponse.json({
      legalName: profile.legalName,
      tradingName: profile.tradingName,
      businessStructure: profile.businessStructure,
      abn: profile.abn,
      isAbnConfigured: profile.isAbnConfigured,
      registeredAddress: profile.registeredAddress,
      phone: profile.phone,
      email: profile.email,
      billingEmail: profile.billingEmail,
      website: profile.website,
      ndisRegistrationStatus: profile.ndisRegistrationStatus,
      gstStatus: profile.gstStatus,
      isGstRegistered: profile.isGstRegistered,
      canIssueTaxInvoice: profile.canIssueTaxInvoice,
      proprietorLegalName: null,
      isProprietorConfigured: profile.isProprietorConfigured,
      contractingEntityDisplay: profile.contractingEntityDisplay,
      designatedSignatoryName: profile.designatedSignatoryName,
      designatedSignatoryTitle: profile.designatedSignatoryTitle,
      isBankConfigured: profile.isBankConfigured,
      websiteUrl: profile.websiteUrl,
      supportEmail: profile.supportEmail,
      referralsEmail: profile.referralsEmail,
      facebookUrl: profile.facebookUrl,
      instagramUrl: profile.instagramUrl,
      linkedinUrl: profile.linkedinUrl,
      isFullyInsured: profile.isFullyInsured,
      insuranceStatus: profile.insuranceStatus,
      operationalReadiness: profile.operationalReadiness,
      ageScope: profile.ageScope,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve organisation profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
