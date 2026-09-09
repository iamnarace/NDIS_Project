import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('--- Deleting Test Agreements ---');
  const ids = [
    'c8967ceb-8717-499a-9815-8009a31c372f', // James Wilson draft
    '638c7540-a996-445e-933c-ce4bedfbedc5', // QA Agreement Variation v3
    '0a8bb960-b004-48ef-9341-aeb91be7d2d0', // QA Agreement Variation v2
    'af1e36f7-1ef4-4f4d-a3c2-ccc97e267186', // QA Agreement Participant
    '94c1d33e-a14d-4df0-9ff1-b330e7f49d19'  // QA Agreement Participant draft
  ];

  // delete signatures first just in case
  const { error: sigErr } = await supabase
    .from('agreement_signatures')
    .delete()
    .in('agreement_id', ids);
  console.log('Deleted signatures:', sigErr ? sigErr.message : 'OK');

  const { error: err } = await supabase
    .from('agreement_records')
    .delete()
    .in('id', ids);
  console.log('Deleted agreements:', err ? err.message : 'OK');
}

main().catch(console.error);
