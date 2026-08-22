# Antigravity — START HERE

You are continuing the existing **CarePoint Support Services** project.

Repository:

`https://github.com/iamnarace/NDIS_Project`

Primary branch:

`main`

Before changing anything, read this file in full:

`docs/ANTIGRAVITY_HANDOFF.md`

Treat that handoff as the current project source of truth unless repository/Vercel evidence proves that something has changed since it was written.

## Execution instruction

Do **not** start a new product plan and do not redesign from scratch.

Continue the project exactly from the handoff.

Your first milestone is to stabilise the current website and deployment pipeline:

1. inspect repository status, branch, recent commits and all existing source files;
2. note that GitHub `package.json` currently declares vulnerable `next@15.5.2` while the verified live Vercel sample was successfully built using `next@15.5.21`;
3. upgrade/reconcile GitHub to a supported patched Next.js version and update the lockfile;
4. preserve/improve the existing CarePoint teal/mint design and existing routes;
5. run install/build/type/lint checks as available;
6. compare the repository output with the live website at `https://carepoint-support-services.vercel.app`;
7. fix mobile navigation and any obvious accessibility/UX defects;
8. connect **this exact GitHub repository** to the **existing Vercel project**, not a new duplicate project;
9. Vercel project name: `carepoint-support-services`;
10. Vercel project ID: `prj_tCb4viWhxNxIqJlxSF5Yz2i8TC4W`;
11. Vercel team ID: `team_2OnVfeLuiwliGpr4HjG5PspM`;
12. production branch must be `main`;
13. prove the connection with a Git-sourced READY production deployment tied to an exact commit SHA;
14. verify `https://carepoint-support-services.vercel.app` after deployment;
15. report using the exact continuation-report format defined in `docs/ANTIGRAVITY_HANDOFF.md`.

## Non-negotiable business rules

- Business working name: **CarePoint Support Services**.
- Current business model: unregistered provider foundation for self-managed and plan-managed NDIS participants.
- Do **not** claim CarePoint is a registered NDIS provider.
- Do **not** invent ABN, NDIS registration number, insurance details, phone number, office address, years in business, staff count, testimonials, awards, participant numbers or partnerships.
- The owner has stated that NDIS Worker Screening and First Aid are already held; verify CPR wording before treating CPR as separately confirmed.
- Current service area wording is a placeholder: Greater Sydney, NSW.
- Current email `support@carepointsupport.com.au` is a placeholder until domain/email ownership is confirmed.
- Do not add clinical/high-risk services unless actual capability and requirements are confirmed.
- Keep referral intake minimal and avoid unnecessary sensitive data.
- Keep all placeholders visibly distinguishable from confirmed business facts.

## Existing service direction

Preserve these initial services unless evidence/business decision changes them:

- Daily Living Support
- Community Participation
- Transport Support
- Life Skills & Independence
- Companionship & Social Support
- Household & Practical Assistance

## Existing required routes

- `/`
- `/services`
- `/about`
- `/referral`
- `/contact`
- `/faq`
- `/privacy`
- `/complaints`
- `/incident-management`
- `/code-of-conduct`

## Existing Vercel facts

Latest verified READY direct deployment at handoff:

`dpl_3phq9YVkya9pabmQJwmgrkzkZxHv`

Live alias:

`https://carepoint-support-services.vercel.app`

Important: that working deployment was a direct-file deployment. GitHub→Vercel automatic Git integration was not yet confirmed, which is why this is part of your first milestone.

## Agent behaviour

The user prefers execution over repeated planning.

Inspect evidence, make safe progress, verify everything, and report concrete results.

Do not claim success until the build/deployment/browser evidence supports it.
