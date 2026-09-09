import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createAccounts() {
  const users = [
    { email: 'james.w@opuscare.com.au', password: 'Password123!', role: 'staff' },
    { email: 'sophie.c@opuscare.com.au', password: 'Password123!', role: 'staff' },
    { email: 'liam.d@opuscare.com.au', password: 'Password123!', role: 'participant' },
    { email: 'michael.t@opuscare.com.au', password: 'Password123!', role: 'participant' }
  ];

  console.log('Creating test accounts...');
  
  for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { role: u.role }
    });
    if (error) {
      console.log(`Error creating ${u.email}:`, error.message);
    } else {
      console.log(`Created: ${u.email}`);
    }
  }
}

createAccounts();
