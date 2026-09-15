import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const projectDir = 'C:\\Users\\NareshAdmin\\Documents\\NDIS_Project';
const localEnvPath = path.join(projectDir, '.env.local');
const envFile = fs.readFileSync(localEnvPath, 'utf8');

const env = {};
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
}

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function listStorage() {
  const { data: dirs } = await client.storage.from('crm-documents').list('recruitment/applications');
  for (const dir of (dirs || [])) {
     console.log('Dir:', dir.name);
     const { data: files } = await client.storage.from('crm-documents').list('recruitment/applications/' + dir.name);
     console.log(' Files:', files);
  }
}

listStorage();
