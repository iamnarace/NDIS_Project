import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('--- Checking for Agreements ---');
  const { data: agreements } = await supabase
    .from('agreement_records')
    .select('id, title, status, version_number, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (agreements) {
    console.log('Recent Agreements:');
    agreements.forEach(a => console.log(' -', a.id, a.title, a.status, a.created_at));
  } else {
    console.log('No agreements or error');
  }
}

main().catch(console.error);
