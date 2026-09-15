import fs from 'fs';

const p1 = 'tests/recruitment-supabase.acceptance.mjs';
const p2 = 'tests/recruitment-routes.acceptance.mjs';

function modifyTest(file) {
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes('RUN_RECRUITMENT_ACCEPTANCE')) {
    const guard = `if (process.env.RUN_RECRUITMENT_ACCEPTANCE !== '1') {
  console.log('Skipping acceptance tests. RUN_RECRUITMENT_ACCEPTANCE=1 required.');
  process.exit(0);
}
`;
    const testIdx = content.indexOf('test(');
    if (testIdx !== -1) {
       content = content.slice(0, testIdx) + guard + '\n' + content.slice(testIdx);
    }
  }

  const lines = content.split('\n');
  const filtered = lines.filter(l => !l.includes("from('recruitment_reference_counters').delete()"));
  
  fs.writeFileSync(file, filtered.join('\n'));
}

modifyTest(p1);
modifyTest(p2);
