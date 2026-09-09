import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('--- Inspecting disposable records ---');

  const { data: shift, error: shiftErr } = await supabase
    .from('shifts')
    .select('*')
    .eq('id', '7068c7a2-0dc0-450b-9b95-69a110d6e82c')
    .single();
    
  if (shift) console.log('Shift:', shift.shift_reference, shift.status);
  else console.log('Shift not found or already deleted', shiftErr?.message);

  const { data: budget, error: budgetErr } = await supabase
    .from('participant_funding_budgets')
    .select('*')
    .eq('id', '0b6deb5d-bf44-46b0-9623-9e718884d30a')
    .single();

  if (budget) console.log('Budget delivered_amount:', budget.delivered_amount);
  
  const { data: sr, error: srErr } = await supabase
    .from('service_records')
    .select('*')
    .eq('id', '90e6399a-0a98-4a0d-aa9d-5d76049fbd8c')
    .single();
    
  if (sr) console.log('Service Record total_amount:', sr.total_amount);

  const { data: note } = await supabase
    .from('progress_notes')
    .select('*')
    .eq('id', 'bc63b65b-4088-4d26-8530-f107adf34767')
    .single();
  if (note) console.log('Progress Note found');

  const { data: tsEntry } = await supabase
    .from('timesheet_entries')
    .select('*')
    .eq('id', 'e74a504c-bf94-477d-8148-ada771ed58d8')
    .single();
  if (tsEntry) console.log('Timesheet Entry found');

  const { data: ts } = await supabase
    .from('timesheets')
    .select('*')
    .eq('id', 'f35b1089-51d5-4775-a6b8-bd0bdd1baf14')
    .single();
  if (ts) console.log('Timesheet found');

  console.log('--- Checking for QA Agreements ---');
  const { data: agreements } = await supabase
    .from('agreements')
    .select('id, title, status, notes')
    .or('title.ilike.%test%,title.ilike.%QA%,notes.ilike.%test%,notes.ilike.%QA%');
  
  if (agreements) {
    console.log('Test Agreements found:', agreements.length);
    agreements.forEach(a => console.log(' -', a.id, a.title, a.status, a.notes));
  }
}

main().catch(console.error);
