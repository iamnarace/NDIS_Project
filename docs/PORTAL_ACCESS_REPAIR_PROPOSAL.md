# Portal access repair — awaiting approval

The design pass is blocked by existing portal access and response-contract issues. This proposal has not been applied.

## Verified findings

- The four supplied test Auth users had no `public.profiles` rows. Temporary linked profiles were added with the intended worker/participant roles.
- Worker password authentication succeeded, but profile lookup failed and the login fell through to the participant dashboard, which displayed a profile-load error.
- Live `profiles` SELECT access uses `is_opus_staff()`, which includes admin, manager, coordinator and staff, but excludes worker and participant. There is no own-profile SELECT policy.
- `app/api/workforce/shifts/route.ts` requires the admin session for GET, while the worker portal calls this endpoint with its Supabase user session.
- The worker timesheet loader expects a bare array, while the timesheet endpoint returns a `timesheets` object property.

## Proposed bounded repair

1. Add the following own-profile read policy through a reviewed migration. Preserve existing administrative policies and all write restrictions:

```sql
create policy "Portal users read own active profile"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  and is_active = true
  and role in ('worker', 'participant')
);
```

2. Make portal login report an unreadable or unsupported profile instead of silently routing it to the participant dashboard.
3. Allow authenticated active workers to read their own assigned shifts using the user-session client and existing RLS. Derive the staff identity from the authenticated profile; do not trust a staff ID supplied by the browser. Preserve the existing admin path and mutation restrictions.
4. Correct the worker timesheet response parsing to match the existing endpoint contract.

Validate own-profile access, denial of other profiles, assigned-shift isolation, worker/participant routing, inactive-account rejection and existing admin behaviour. Check current table columns and RLS coverage before coding the endpoint repair; this proposal does not authorize changes to other policies.

## Test-account cleanup

All four supplied test Auth users and their temporary profiles were deleted through the Supabase Auth admin API. A subsequent SQL check confirmed zero remaining test users/profiles and preservation of both staff and both participant records. No care or billing records were submitted.

The built local server is running at `http://127.0.0.1:3000` with network access. New temporary logins will be needed for acceptance after an approved repair; they should again be removed after testing.
