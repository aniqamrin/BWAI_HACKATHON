require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Running database seed...');
    const seedData = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seedData);
    console.log('✅ Seed data inserted successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
