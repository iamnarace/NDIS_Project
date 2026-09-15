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

async function cleanStorage() {
  console.log('=== 1. VERIFY NO APPLICATIONS EXIST ===');
  const apps = await client.from('job_applications').select('id, reference_number');
  console.log('Applications count:', apps.data?.length);

  if (apps.data?.length !== 0) {
    console.log('Applications exist. Aborting.');
    return;
  }

  const pathsToDelete = [
    'recruitment/applications/011e9523-b7b3-46be-afe9-a984edb400dc/1ec410d3-559a-4af7-a5dd-a3b16a9c12fa_cover_letter_TEST_mu2khvte.docx',
    'recruitment/applications/011e9523-b7b3-46be-afe9-a984edb400dc/369b32a3-2c02-493f-a7a6-6bccbaf7433c_candidate_resume_TEST_mu2khvte.pdf',
    // The directory itself might need removing if empty, but we'll try just the files first
  ];
  
  console.log('\n=== 2. DELETING TEST OBJECTS ===');
  const delResult = await client.storage.from('crm-documents').remove(pathsToDelete);
  console.log('Delete result:', delResult);

  console.log('\n=== 3. POST-CLEANUP STORAGE VERIFICATION ===');
  const postFiles = await client.storage.from('crm-documents').list('recruitment/applications/011e9523-b7b3-46be-afe9-a984edb400dc');
  console.log('Remaining test files in dir:', postFiles.data);
}

cleanStorage();
