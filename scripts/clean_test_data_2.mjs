import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('--- Deleting disposable records ---');

  const { error: noteErr } = await supabase
    .from('shift_progress_notes')
    .delete()
    .eq('id', 'bc63b65b-4088-4d26-8530-f107adf34767');
  console.log('Deleted shift progress note:', noteErr ? noteErr.message : 'OK');

  console.log('--- Checking for Agreements ---');
  const { data: agreements } = await supabase
    .from('agreements')
    .select('id, title, status, notes, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (agreements) {
    console.log('Recent Agreements:');
    agreements.forEach(a => console.log(' -', a.id, a.title, a.status, a.created_at));
  }
}

main().catch(console.error);
