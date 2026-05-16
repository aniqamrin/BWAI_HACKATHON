const { Pool } = require('pg');
const logger = require('../utils/logger');

// Unix socket connections (Cloud SQL via /cloudsql/...) don't support SSL
const isUnixSocket = (process.env.DATABASE_URL || '').includes('host=/');
const sslConfig = isUnixSocket ? false
  : process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: sslConfig
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});

async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    return true;
  } finally {
    client.release();
  }
}

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn('Slow query detected', { text, duration });
    }
    return res;
  } catch (error) {
    logger.error('Database query error', { text, error: error.message });
    throw error;
  }
}

async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery(...args);
  };

  client.release = () => {
    client.query = originalQuery;
    return release();
  };

  return client;
}

module.exports = { pool, query, getClient, testConnection };
