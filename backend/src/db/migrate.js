require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running database migrations...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Schema migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
