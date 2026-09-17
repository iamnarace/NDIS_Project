import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(path, 'utf8');

test('individual CRM administrator access is private and revocable', async t => {
  const migration = read('supabase/migrations/20260917112325_crm_individual_admin_access.sql');
  const auth = read('lib/adminAuth.ts');
  const loginRoute = read('app/api/admin/auth/route.ts');
  const accessRoute = read('app/api/admin/access/route.ts');
  const manager = read('components/admin/AdminAccessManager.tsx');

  await t.test('database stores only key and session hashes behind forced RLS', () => {
    assert.match(migration, /create table if not exists public\.crm_admin_users/);
    assert.match(migration, /access_key_hash text not null unique/);
    assert.match(migration, /create table if not exists public\.crm_admin_sessions/);
    assert.match(migration, /token_hash text not null unique/);
    assert.match(migration, /force row level security/);
    assert.match(migration, /revoke all on table public\.crm_admin_users from public, anon, authenticated/);
    assert.doesNotMatch(migration, /access_key\s+text/i);
  });

  await t.test('chosen keys use a server-side keyed hash and sensible minimum', () => {
    assert.match(auth, /createHmac\('sha256', pepper\)/);
    assert.match(auth, /key\.length < 10/);
    assert.match(loginRoute, /crypto\.randomBytes\(32\)/);
    assert.match(loginRoute, /hashAdminSessionToken\(token\)/);
  });

  await t.test('owners can reset, lock, unlock and revoke while final-owner safeguards remain', () => {
    for (const action of ['reset_key', 'lock', 'unlock', 'revoke_sessions']) {
      assert.ok(accessRoute.includes(`action === '${action}'`), `Missing ${action} action`);
    }
    assert.match(accessRoute, /The final active owner cannot be locked/);
    assert.match(accessRoute, /You cannot lock the profile currently signed in/);
    assert.match(accessRoute, /\.from\('crm_admin_sessions'\)[\s\S]*revoked_at/);
  });

  await t.test('settings UI supports assigned keys and administrator controls', () => {
    assert.match(manager, /Add administrator/);
    assert.match(manager, /Assign access key/);
    assert.match(manager, /Reset key/);
    assert.match(manager, /Lock/);
    assert.match(manager, /Unlock/);
    assert.match(manager, /At least 10 characters\. A memorable phrase is allowed\./);
  });
});
