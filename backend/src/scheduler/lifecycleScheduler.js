const cron = require('node-cron');
const { runLifecycleScan } = require('../services/lifecycleEngine');
const logger = require('../utils/logger');

let schedulerRunning = false;
let lastRun = null;
let lastStats = null;

function startScheduler() {
  if (process.env.LIFECYCLE_SCHEDULER_ENABLED === 'false') {
    logger.info('[Scheduler] Lifecycle scheduler disabled by env var');
    return;
  }

  logger.info('[Scheduler] Starting lifecycle scheduler (every 6 hours)');

  // Run every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    if (schedulerRunning) {
      logger.warn('[Scheduler] Previous scan still running, skipping');
      return;
    }
    await executeLifecycleScan();
  });

  // Also run once at startup after a 30-second delay
  setTimeout(async () => {
    logger.info('[Scheduler] Running initial lifecycle scan on startup');
    await executeLifecycleScan();
  }, 30000);
}

async function executeLifecycleScan() {
  schedulerRunning = true;
  try {
    const stats = await runLifecycleScan();
    lastRun = new Date().toISOString();
    lastStats = stats;
    logger.info('[Scheduler] Scan complete:', stats);
  } catch (err) {
    logger.error('[Scheduler] Scan failed:', err.message);
  } finally {
    schedulerRunning = false;
  }
}

function getStatus() {
  return {
    enabled: process.env.LIFECYCLE_SCHEDULER_ENABLED !== 'false',
    running: schedulerRunning,
    last_run: lastRun,
    last_stats: lastStats,
    next_run: 'Every 6 hours',
  };
}

module.exports = { startScheduler, getStatus, executeLifecycleScan };
