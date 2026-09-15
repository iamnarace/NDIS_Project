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

async function checkAndClean() {
  console.log('=== 1. PRE-CLEANUP STATUS QUERY ===');
  const [vac, app, files, events, interviews, refs, sessions, counters, staff] = await Promise.all([
    client.from('job_vacancies').select('id, reference_number, title, status'),
    client.from('job_applications').select('id, reference_number, email'),
    client.from('job_application_files').select('id'),
    client.from('job_application_events').select('id'),
    client.from('job_interviews').select('id'),
    client.from('job_reference_checks').select('id'),
    client.from('job_application_upload_sessions').select('id'),
    client.from('recruitment_reference_counters').select('*'),
    client.from('staff').select('id, reference_number, full_name, email').ilike('email', '%test%')
  ]);

  console.log('Vacancies:', vac.data);
  console.log('Applications count:', app.data?.length);
  console.log('Files count:', files.data?.length);
  console.log('Events count:', events.data?.length);
  console.log('Interviews count:', interviews.data?.length);
  console.log('References count:', refs.data?.length);
  console.log('Upload sessions count:', sessions.data?.length);
  console.log('Counters:', counters.data);
  console.log('Test staff:', staff.data);

  // Check if safe to clean
  const isOnlyTestVacancy = vac.data?.length === 1 && vac.data[0].title.includes('E2E Test');
  const noGenuineApps = (app.data?.length || 0) === 0;

  if (isOnlyTestVacancy && noGenuineApps) {
    console.log('\n=== 2. DELETING TEST FIXTURES & RESETTING COUNTERS ===');
    const delVac = await client.from('job_vacancies').delete().eq('id', vac.data[0].id);
    console.log('Deleted test vacancy:', delVac.error ? delVac.error : 'SUCCESS');

    const delCounters = await client.from('recruitment_reference_counters').delete().in('prefix', ['APP', 'JOB']);
    console.log('Deleted counters:', delCounters.error ? delCounters.error : 'SUCCESS');
  } else if (vac.data?.length === 0 && noGenuineApps) {
    console.log('\n=== 2. RESETTING COUNTERS (No vacancies exist) ===');
    const delCounters = await client.from('recruitment_reference_counters').delete().in('prefix', ['APP', 'JOB']);
    console.log('Deleted counters:', delCounters.error ? delCounters.error : 'SUCCESS');
  } else {
    console.log('Warning: Database state does not match expected test fixture pattern. Aborting automatic delete.');
  }

  console.log('\n=== 3. POST-CLEANUP STATUS VERIFICATION ===');
  const [postVac, postApp, postFiles, postEvents, postInterviews, postRefs, postSessions, postCounters, postStaff] = await Promise.all([
    client.from('job_vacancies').select('id, reference_number, title, status'),
    client.from('job_applications').select('id'),
    client.from('job_application_files').select('id'),
    client.from('job_application_events').select('id'),
    client.from('job_interviews').select('id'),
    client.from('job_reference_checks').select('id'),
    client.from('job_application_upload_sessions').select('id'),
    client.from('recruitment_reference_counters').select('*'),
    client.from('staff').select('id, reference_number, full_name, email').ilike('email', '%test%')
  ]);

  console.log('Post-cleanup Vacancies count:', postVac.data?.length);
  console.log('Post-cleanup Applications count:', postApp.data?.length);
  console.log('Post-cleanup Files count:', postFiles.data?.length);
  console.log('Post-cleanup Events count:', postEvents.data?.length);
  console.log('Post-cleanup Interviews count:', postInterviews.data?.length);
  console.log('Post-cleanup References count:', postRefs.data?.length);
  console.log('Post-cleanup Sessions count:', postSessions.data?.length);
  console.log('Post-cleanup Counters count:', postCounters.data?.length);
  console.log('Post-cleanup Test Staff count:', postStaff.data?.length);
}

checkAndClean();
