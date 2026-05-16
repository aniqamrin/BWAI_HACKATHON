const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { getLifecycleSummary, runLifecycleScan } = require('../services/lifecycleEngine');
const { getStatus, executeLifecycleScan } = require('../scheduler/lifecycleScheduler');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/lifecycle/summary
router.get('/summary', async (req, res) => {
  try {
    const summary = await getLifecycleSummary();
    return success(res, summary);
  } catch (err) {
    logger.error('Lifecycle summary error:', err);
    return error(res, 'Failed to fetch lifecycle summary');
  }
});

// GET /api/lifecycle/status
router.get('/status', async (req, res) => {
  try {
    return success(res, getStatus());
  } catch (err) {
    return error(res, 'Failed to get scheduler status');
  }
});

// POST /api/lifecycle/run (manual trigger)
router.post('/run', authenticate, async (req, res) => {
  try {
    const stats = await runLifecycleScan();
    return success(res, stats, 'Lifecycle scan completed');
  } catch (err) {
    logger.error('Manual lifecycle run error:', err);
    return error(res, 'Lifecycle scan failed');
  }
});

module.exports = router;
