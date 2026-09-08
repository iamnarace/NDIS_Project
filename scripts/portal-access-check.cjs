const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l && !l.startsWith('#') && l.includes('=')).map(l=>{ const i=l.indexOf('='); return [l.slice(0,i),l.slice(i+1).replace(/^['"]|['"]$/g,'')]; }));
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
const manifest = path.join(os.tmpdir(),'opus-portal-access-test-users.json');
async function main() {
 if(process.argv[2]==='admin') {
  const key=env.ADMIN_ACCESS_KEY||env.ADMIN_PASSWORD;
  if(!key) throw new Error('Configured administrator credential unavailable');
  for(const endpoint of ['/api/crm/participants','/api/crm/staff','/api/workforce/shifts','/api/crm/agreements','/api/portal/participant/goals','/api/portal/participant/support-plans','/api/portal/participant/risk-assessments','/api/safeguarding/incidents','/api/training/courses','/api/billing/service-records']) {
   const res=await fetch('http://localhost:3000'+endpoint,{headers:{'x-admin-key':key}});
   if(!res.ok) throw new Error('Admin regression: '+endpoint+' status '+res.status);
   console.log('PASS admin '+endpoint);
  }
  return;
 }
 if(process.argv[2]==='verify') {
  const {createServerClient}=require('@supabase/ssr');
  const rows=JSON.parse(fs.readFileSync(manifest,'utf8'));
  for(const row of rows) {
   const jar=new Map();
   const client=createServerClient(env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:values=>values.forEach(v=>jar.set(v.name,v.value))}});
   const login=await client.auth.signInWithPassword({email:row.email,password:process.env.OPUS_TEST_PASSWORD});
   if(login.error) throw login.error;
   const headers={cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')};
   for(const endpoint of ['/api/portal/me','/api/workforce/shifts?staff_id=962cef5a-ebbf-4911-a961-b42aa2dd79c5&participant_id=dfecdfa0-f2a3-4db8-93b3-75f890e69b33','/api/portal/participant/goals','/api/portal/participant/support-plans']) {
    const res=await fetch('http://localhost:3000'+endpoint,{headers}); const body=await res.json();
    if(!res.ok) throw new Error(`${row.role} endpoint failed: ${endpoint}`);
    if(Array.isArray(body) && body.some(s=>s.participant_id!=='ab2d7f8d-28b4-4794-adab-f2f7f24d5046')) throw new Error('Cross-user shift leak');
   }
   const own=await client.from('profiles').select('id'); if(own.error || own.data.length!==1 || own.data[0].id!==row.id) throw new Error('Profile isolation failed');
   for(const table of ['participants','staff','risk_assessments','provider_config','agreement_records','shift_progress_notes']) {
    const r=await client.from(table).select('id',{count:'exact',head:true});
    console.log(`${row.role}: ${table} visible count=${r.count ?? 'denied'}`);
    if (['provider_config','agreement_records'].includes(table) && r.count > 0) throw new Error('Internal administrator data exposed');
    if (row.role === 'participant' && ['staff','risk_assessments','shift_progress_notes'].includes(table) && r.count > 0) throw new Error('Participant isolation failed');
   }
   await client.auth.signOut();
   console.log(`PASS: ${row.role} authenticated app identity and shift scoping`);
  }
  for(const endpoint of ['/api/portal/me','/api/workforce/shifts','/api/workforce/timesheets']) {
   const res=await fetch('http://localhost:3000'+endpoint); if(res.status!==401) throw new Error('Anonymous endpoint denial failed');
  }
  console.log('PASS: anonymous protected APIs denied'); return;
 }
 if(process.argv[2]==='cleanup') {
  const rows=JSON.parse(fs.readFileSync(manifest,'utf8'));
  for(const row of rows) {
   const {data,error}=await admin.auth.admin.getUserById(row.id);
   if(error || data.user.email!==row.email) throw new Error('Cleanup identity mismatch');
   const removed=await admin.auth.admin.deleteUser(row.id); if(removed.error) throw removed.error;
  }
  const {data,error}=await admin.from('profiles').select('id').in('id',rows.map(r=>r.id));
  if(error || data.length) throw new Error('Profile cleanup failed');
  fs.unlinkSync(manifest); console.log('PASS: temporary auth users and profiles deleted'); return;
 }
 if(fs.existsSync(manifest)) throw new Error('Existing test manifest must be cleaned up first');
 const rows=[];
 for(const [role,link] of [['worker','f14f7cc1-d978-4876-9f01-c4f0d79b844a'],['participant','ab2d7f8d-28b4-4794-adab-f2f7f24d5046']]) {
  const email=`portal-check-${role}-20260908@example.invalid`;
  const {data,error}=await admin.auth.admin.createUser({email,password:process.env.OPUS_TEST_PASSWORD,email_confirm:true});
  if(error) throw error;
  rows.push({id:data.user.id,email,role}); fs.writeFileSync(manifest,JSON.stringify(rows));
  const p=await admin.from('profiles').insert({id:data.user.id,email,full_name:'Temporary Portal Check',role,is_active:true,[role==='worker'?'portal_staff_id':'portal_participant_id']:link});
  if(p.error) throw p.error;
 }
 console.log('Created two temporary linked portal accounts; no business records changed.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
