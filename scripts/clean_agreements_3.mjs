import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const ids = [
    '638c7540-a996-445e-933c-ce4bedfbedc5', // QA Agreement Variation v3 (active)
    '0a8bb960-b004-48ef-9341-aeb91be7d2d0', // QA Agreement Variation v2 (superseded)
    'af1e36f7-1ef4-4f4d-a3c2-ccc97e267186', // QA Agreement Participant (active)
  ];

  for (const id of ids) {
    const { error: updErr } = await supabase
      .from('agreement_records')
      .update({ status: 'terminated' })
      .eq('id', id);
    console.log(`Terminated immutable agreement ${id}:`, updErr ? updErr.message : 'OK');
  }
}

main().catch(console.error);
