# Governance G7 — Website & Public Launch Compliance

> Canonical autonomous execution specification. Implement directly after G6 passes.

## Status

`STATUS: COMPLETE`

## Objective

Align the public website, referral journey and public resources with the actual governed service scope, business identity, funding model and launch readiness. Remove misleading or stale claims before public launch.

## 1. Brand/legal identity

Public brand:

`Opus Care Support Services`

Rules:

- no `CarePoint Support Services` current-brand remnants
- no `Pty Ltd` fabrication
- no claim that Opus is an NDIS registered/approved/endorsed provider
- no Registered NDIS Provider logo/tagline
- ABN may be shown where appropriate
- do not unnecessarily advertise `sole trader`
- formal legal identity rules remain separate from public marketing brand.

## 2. Current funding wording

Public current positioning should accurately support:

- Self-Managed participants
- Plan-Managed participants

NDIA-Managed participants must not be told Opus can directly claim from the NDIA.

Registered-provider partnership/subcontracting wording may only describe a possible/available relationship accurately; do not imply a specific partnership exists unless configured.

## 3. Public service catalogue

The website must consume/reuse the safe governed public service catalogue rather than a disconnected hardcoded list where practical.

Publicly advertise only services whose live governance status allows publication.

Current launch ordinary services may include governed `ACTIVE` / appropriate `ACTIVE_WITH_CONTROLS` services.

Do not advertise as currently available:

- Plan Management
- Specialist Behaviour Support / BSP development
- SIL
- SDA
- direct NDIA-managed service delivery
- regulated restrictive practices
- Group & Centre-Based Activities unless later explicitly authorised
- any conditional clinical service unless G6 readiness and explicit website publication criteria pass.

Clinical capability architecture existing internally is not permission to market it as active.

## 4. Locations

Use canonical service-region configuration.

Public wording should reflect Northern NSW and selected Sydney coverage, including the already authorised areas.

Include qualifier:

`Service availability depends on location, participant requirements and current worker capacity.`

Do not promise worker availability for every suburb.

## 5. Website information architecture

Ensure coherent navigation/content for at least:

- Home
- Our Supports / Services
- Locations
- About
- Referral
- Contact
- Funding / Self-Managed
- Funding / Plan-Managed
- Support Coordinators / Referrers
- Registered Provider / Service Partnership information where factually appropriate
- Privacy
- Complaints & Feedback
- Rights & Responsibilities
- Pricing / travel / cancellation resources
- Participant Handbook/resources
- Accessibility
- urgent/emergency support guidance
- Current Availability or availability qualifier where useful
- Careers/workforce where current

Avoid duplicate generic forms or conflicting support/referral forms.

## 6. Referral form alignment

Public referral should collect only necessary initial information.

Requirements:

- no pre-ticked consent
- no silent Plan-Managed default
- no invented suburb/service/transport/adult defaults
- service selection aligned with public governed catalogue
- funding explicitly selected/unknown allowed where appropriate
- postcode/suburb
- basic service/risk information sufficient for triage
- detailed clinical information deferred to secure intake where possible
- clear privacy collection notice link
- success message and form-clearing behaviour verified
- referral persists correctly into CRM

Do not allow public referral submission to bypass G1 suitability/onboarding.

## 7. Public resources

Publish only controlled/current versions from G3 where appropriate.

Public resources should be plain English and accessible.

Do not expose internal policy drafts, staff notes, waiver rationale, clinical details or governance metadata.

## 8. Pricing

Public pricing content must be current and accurately qualified.

Do not hardcode stale NDIS prices where a governed catalogue source is available.

Make clear that actual charges depend on agreed support, applicable current pricing arrangements and service agreement/schedule.

Preserve current GST rule: Opus is not GST registered; do not issue public tax wording implying GST registration.

## 9. Complaints/safeguarding guidance

Use G4-controlled current content.

Ensure complaint pathway is easy to find and accessible.

Do not overstate registered-provider reporting obligations.

## 10. Privacy/accessibility

Public pages/forms must follow the current Privacy Collection Notice and avoid excessive sensitive-data collection.

Review keyboard navigation, labels, contrast, error messages, mobile layout and plain-language presentation for modified pages.

## 11. SEO/social/structured claims

Audit metadata, page titles, descriptions, structured data, footer and old assets for stale business claims.

No metadata should call Opus registered when it is unregistered.

No old CarePoint brand should remain in live-current public surfaces except deliberate historical migration notes not served publicly.

## 12. Contact/email routing

Verify configured Opus contact/referral/support addresses against repository settings.

Do not invent unconfigured inboxes or claim forwarding works without evidence.

Where outbound email is used, verify failure/success handling and do not send real unsolicited test messages.

## 13. Tests/browser review

At minimum verify:

- public service list excludes future/registration-required/unready clinical services
- Self/Plan-Managed wording accurate
- NDIA direct claiming not implied
- no NDIS registered/endorsed claim/logo
- no Pty Ltd/CarePoint stale public branding
- authorised service regions and availability qualifier display
- referral has no silent defaults/pre-ticked consent
- referral persists and still enters G1 gate
- success message/form reset works
- privacy/resources render only published versions
- participant/internal data not exposed publicly
- mobile/responsive navigation/forms work
- basic accessibility checks pass
- pricing/GST wording current
- controlled complaints/privacy links work

Run full repository quality gate.

## G7 exit criteria

- website accurately reflects current governed services/funding/status;
- public referral cannot bypass G1;
- public resources are controlled/current;
- stale brand/legal/registration claims removed;
- regions/pricing/privacy/complaints are aligned;
- no internal/sensitive governance data exposed;
- accessibility/responsive checks pass;
- all tests/typecheck/lint/build pass;
- committed/pushed;
- Vercel Production remains unchanged unless separately authorised.

When complete, automatically start Final Go-Live Verification.
