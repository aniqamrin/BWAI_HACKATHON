const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://ecosystemos:ecosystemos_pass@localhost:5432/ecosystemos_db'
});

async function fixPasswords() {
  const hash = await bcrypt.hash('Password123!', 10);
  console.log('Generated hash:', hash);
  
  const result = await pool.query(
    'UPDATE users SET password_hash = $1',
    [hash]
  );
  
  console.log(`Updated ${result.rowCount} users`);
  console.log('All users now have password: Password123!');
  await pool.end();
}

fixPasswords().catch(console.error);
