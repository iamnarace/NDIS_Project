import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('--- Deleting disposable records ---');

  // Service Record
  const { error: srErr } = await supabase
    .from('service_records')
    .delete()
    .eq('id', '90e6399a-0a98-4a0d-aa9d-5d76049fbd8c');
  console.log('Deleted service record:', srErr ? srErr.message : 'OK');

  // Timesheet Entry
  const { error: tsEntryErr } = await supabase
    .from('timesheet_entries')
    .delete()
    .eq('id', 'e74a504c-bf94-477d-8148-ada771ed58d8');
  console.log('Deleted timesheet entry:', tsEntryErr ? tsEntryErr.message : 'OK');

  // Timesheet (if empty, or just delete it)
  const { error: tsErr } = await supabase
    .from('timesheets')
    .delete()
    .eq('id', 'f35b1089-51d5-4775-a6b8-bd0bdd1baf14');
  console.log('Deleted timesheet:', tsErr ? tsErr.message : 'OK');

  // Progress note
  const { error: noteErr } = await supabase
    .from('progress_notes')
    .delete()
    .eq('id', 'bc63b65b-4088-4d26-8530-f107adf34767');
  console.log('Deleted progress note:', noteErr ? noteErr.message : 'OK');

  // Shift assignment
  const { error: saErr } = await supabase
    .from('shift_assignments')
    .delete()
    .eq('shift_id', '7068c7a2-0dc0-450b-9b95-69a110d6e82c');
  console.log('Deleted shift assignments:', saErr ? saErr.message : 'OK');

  // Shift
  const { error: shiftErr } = await supabase
    .from('shifts')
    .delete()
    .eq('id', '7068c7a2-0dc0-450b-9b95-69a110d6e82c');
  console.log('Deleted shift:', shiftErr ? shiftErr.message : 'OK');

  // Restore budget amount
  const { error: budgetErr } = await supabase
    .from('participant_funding_budgets')
    .update({ delivered_amount: 0 })
    .eq('id', '0b6deb5d-bf44-46b0-9623-9e718884d30a');
  console.log('Restored budget delivered_amount to 0:', budgetErr ? budgetErr.message : 'OK');
}

main().catch(console.error);
