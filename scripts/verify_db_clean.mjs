import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const localEnvPath = path.join(rootDir, '.env.local');
const envFile = fs.existsSync(localEnvPath) ? fs.readFileSync(localEnvPath, 'utf8') : '';
for (const line of envFile.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error('Missing Supabase configuration in environment.');
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  console.log('--- INDEPENDENT FINAL DB CHECK ---');
  let clean = true;

  const tables = [
    'job_vacancies',
    'job_applications',
    'job_application_files',
    'job_application_events',
    'job_application_upload_sessions',
    'job_interviews',
    'job_reference_checks'
  ];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`Error querying ${table}:`, error.message);
      clean = false;
    } else {
      console.log(`Table ${table} count: ${count}`);
      if (count > 0) clean = false;
    }
  }

  // Check Storage
  console.log('Checking Storage bucket crm-documents...');
  const checkFolder = async (folder) => {
    const { data, error } = await supabase.storage.from('crm-documents').list(folder);
    if (error) {
      console.error(`Error listing folder ${folder}:`, error.message);
      return false;
    }
    let ok = true;
    for (const item of data) {
      if (item.name === '.emptyFolderPlaceholder') continue;
      
      const fullPath = folder ? `${folder}/${item.name}` : item.name;
      if (item.id === null) {
        // It's a folder
        const folderOk = await checkFolder(fullPath);
        if (!folderOk) ok = false;
      } else {
        console.log(`FOUND FILE: ${fullPath} (${item.id})`);
        if (fullPath.includes('TEST_')) ok = false;
      }
    }
    return ok;
  };
  
  const storageOk = await checkFolder('recruitment');
  if (!storageOk) clean = false;
  
  if (clean) {
    console.log('ALL CLEAR. 0 TEST ARTIFACTS REMAIN.');
  } else {
    console.log('FAIL: Test artifacts or unpurged items found in DB/Storage.');
  }
}

run().catch(console.error);
