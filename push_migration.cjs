const fs = require('fs');

async function run() {
  const sql = fs.readFileSync('supabase/migrations/20260424_init.sql', 'utf8');
  const token = 'sbp_189cf554ab7ac501b32f45cc936171fc88c7aea9';
  const projectId = 'mdgkarnumvvocpjodzyi';

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Migration failed:', res.status, errorText);
    process.exit(1);
  } else {
    console.log('Migration executed successfully!');
  }
}

run();
