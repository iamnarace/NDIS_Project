# Opus Care Careers & Recruitment — Independent Acceptance Checklist

Use this after Antigravity returns its implementation.

## Baseline
- [ ] Agent fetched latest remote main before changes.
- [ ] Newer owner-approved work was preserved.
- [ ] Work is on the authorised non-production branch.
- [ ] Production was not changed during first implementation pass.

## Public Careers
- [ ] `/careers` exists.
- [ ] Careers link appears in desktop nav.
- [ ] Careers link appears in mobile nav.
- [ ] Careers link appears in footer.
- [ ] No fake vacancy is published.
- [ ] No-vacancy state is professional.
- [ ] EOI is available.
- [ ] Published vacancy appears.
- [ ] Draft vacancy cannot appear publicly.
- [ ] Closed vacancy rejects new application.
- [ ] Job page does not leak internal notes/counts/config.

## Public copy
- [ ] No registered-NDIS-provider claim.
- [ ] No guaranteed-hours claim.
- [ ] No unsupported immediate-start/capacity claim.
- [ ] NDISWC wording is Opus policy, not false universal legal requirement.
- [ ] WWCC is conditional on child-related work.
- [ ] Reasonable-adjustment wording present.
- [ ] No intrusive diagnosis/medical-history question.
- [ ] Pay wording does not invent an Award classification or unlawful rate.

## Application
- [ ] Vacancy application works.
- [ ] EOI works without a fake vacancy.
- [ ] APP reference generated.
- [ ] Privacy consent required.
- [ ] Accuracy declaration required.
- [ ] Form does not collect TFN.
- [ ] Form does not collect bank details.
- [ ] Form does not collect super account.
- [ ] Form does not collect DOB unnecessarily.
- [ ] Form does not collect screening numbers/IDs.
- [ ] Form does not collect licence number.
- [ ] Screening answers clearly labelled applicant-declared/unverified.
- [ ] Applicant cannot enumerate another application.

## Files
- [ ] Resume accepts PDF/DOC/DOCX.
- [ ] Resume max 8 MB.
- [ ] Cover max 5 MB.
- [ ] Unsafe file type rejected.
- [ ] Storage path uses recruitment/application namespace.
- [ ] Bucket is private.
- [ ] Anonymous direct file access denied.
- [ ] Admin access uses short-lived signed URL.
- [ ] Applicant files do not become `public.documents` Staff credentials.

## Persistence/email
- [ ] DB record is committed before email attempt.
- [ ] Applicant email acknowledgement works.
- [ ] Admin notification works.
- [ ] CV is not attached to email.
- [ ] Simulated email failure does not lose application.
- [ ] Safe email failure event/log exists without PII/secrets.

## Recruitment CRM
- [ ] Top-level Recruitment tab.
- [ ] Recruitment UI extracted from giant `app/admin/page.tsx`.
- [ ] Vacancy create.
- [ ] Vacancy edit.
- [ ] Vacancy preview.
- [ ] Vacancy publish.
- [ ] Vacancy unpublish/close.
- [ ] Vacancy archive.
- [ ] Application listing/filter/search.
- [ ] EOI separated/labeled.
- [ ] Candidate detail.
- [ ] Internal notes private.
- [ ] Immutable stage event.
- [ ] Interview record.
- [ ] Reference check.
- [ ] Retention Review Due.
- [ ] Owner can update Careers destination email/retention setting.

## Hire → Staff
- [ ] Candidate remains recruitment-only before Hire.
- [ ] Duplicate Staff check runs before creation.
- [ ] Existing Staff can be linked instead of duplicated.
- [ ] New Staff status = pending.
- [ ] New Staff lifecycle = onboarding.
- [ ] New Staff is_rosterable = false.
- [ ] NDIS screening explicitly = Unknown / Needs Verification.
- [ ] Credential fields remain unverified/null.
- [ ] Orientation false.
- [ ] Historical DB defaults do not create a fake rate/suburb/readiness state.
- [ ] engagement_type remains employee/contractor.
- [ ] employment_basis is separate.
- [ ] Application stores converted_staff_id.
- [ ] Hired event recorded.
- [ ] No partial “Hired without Staff link” failure state.
- [ ] Worker 360 handoff.
- [ ] Existing Agreement Generator handoff.
- [ ] Existing Worker Readiness handoff.
- [ ] Recruitment declarations are NOT copied as verified credential evidence.

## Database/security
- [ ] Recruitment tables are additive.
- [ ] RLS enabled.
- [ ] anon has no direct applicant table read.
- [ ] anon has no direct applicant table insert.
- [ ] public vacancy API exposes public fields only.
- [ ] Admin APIs return 401 anonymously.
- [ ] No service-role key in client.
- [ ] No admin credential in client.
- [ ] No public CV path.
- [ ] no published seed vacancy.

## Retention
- [ ] `recruitment_retention_months` is configurable.
- [ ] 12-month default is described as Opus policy, not statutory mandate.
- [ ] purge requires confirmation.
- [ ] purge removes applicant private files.
- [ ] purge/redaction behaviour documented.

## Accessibility
- [ ] Keyboard-only application pass.
- [ ] labels/description associations.
- [ ] visible focus.
- [ ] error summary.
- [ ] inline errors.
- [ ] aria-live success/error.
- [ ] mobile 320px layout usable.
- [ ] Admin tablet layout usable.

## Quality
- [ ] `git diff --check`
- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] recruitment-specific tests included.
- [ ] E2E fixtures cleaned.

## First-pass verdict
Accept only if:

**READY FOR INDEPENDENT REVIEW BEFORE PRODUCTION**

and Production remains unchanged.
