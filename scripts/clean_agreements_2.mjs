import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('--- Cleaning Test Agreements ---');
  const ids = [
    'c8967ceb-8717-499a-9815-8009a31c372f', // James Wilson draft
    '638c7540-a996-445e-933c-ce4bedfbedc5', // QA Agreement Variation v3 (active)
    '0a8bb960-b004-48ef-9341-aeb91be7d2d0', // QA Agreement Variation v2 (superseded)
    'af1e36f7-1ef4-4f4d-a3c2-ccc97e267186', // QA Agreement Participant (active)
    '94c1d33e-a14d-4df0-9ff1-b330e7f49d19'  // QA Agreement Participant draft
  ];

  for (const id of ids) {
    // try delete first (works for drafts)
    const { error: delErr } = await supabase.from('agreement_records').delete().eq('id', id);
    if (!delErr) {
      console.log(`Deleted agreement ${id}`);
    } else if (delErr.message.includes('immutable')) {
      // update to terminated if it is immutable
      const { error: updErr } = await supabase
        .from('agreement_records')
        .update({ status: 'terminated', notes: 'CLEANED UP TEST RECORD' })
        .eq('id', id);
      console.log(`Terminated immutable agreement ${id}:`, updErr ? updErr.message : 'OK');
    } else {
      console.log(`Error deleting ${id}:`, delErr.message);
    }
  }
}

main().catch(console.error);
