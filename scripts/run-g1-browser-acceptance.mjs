import { randomBytes } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function readLocalEnvironment() {
  const values = {};
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith('NEXT_PUBLIC_') && match[1] !== 'NEXT_PUBLIC_SUPABASE_URL') continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

const localEnvironment = readLocalEnvironment();
const ephemeralAdminKey = randomBytes(48).toString('base64url');
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', 'e2e/g1-governance.spec.ts'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    ...localEnvironment,
    ADMIN_ACCESS_KEY: ephemeralAdminKey,
  },
  stdio: 'inherit',
});

function containsCredential(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (containsCredential(path)) return true;
    } else if (readFileSync(path).includes(ephemeralAdminKey)) {
      return true;
    }
  }
  return false;
}

if (containsCredential('.next/static')) {
  throw new Error('Ephemeral administrator credential was found in a browser bundle.');
}
console.log('G1 credential scan: ephemeral key absent from .next/static browser assets.');
process.exit(result.status ?? 1);
