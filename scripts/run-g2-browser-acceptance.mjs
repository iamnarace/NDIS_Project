import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const local = {};
for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (!match || match[1].startsWith('NEXT_PUBLIC_') && match[1] !== 'NEXT_PUBLIC_SUPABASE_URL') continue;
  let value = match[2];
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  local[match[1]] = value;
}
const ephemeral = randomBytes(48).toString('base64url');
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', 'e2e/g2-worker-readiness.spec.ts'], {
  cwd: process.cwd(), env: { ...process.env, ...local, ADMIN_ACCESS_KEY: ephemeral }, stdio: 'inherit',
});
function containsCredential(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() ? containsCredential(path) : readFileSync(path).includes(ephemeral)) return true;
  }
  return false;
}
if (containsCredential('.next/static')) throw new Error('Ephemeral administrator credential was found in a browser bundle.');
console.log('G2 credential scan: ephemeral key absent from .next/static browser assets.');
process.exit(result.status ?? 1);

