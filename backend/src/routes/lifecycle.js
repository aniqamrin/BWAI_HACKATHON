const express = require('express');
const { query } = require('../db/connection');
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

// GET /api/lifecycle/signals — all behavioral signals with relationship context
router.get('/signals', async (req, res) => {
  try {
    const result = await query(
      `SELECT bs.*,
              r.relationship_type, r.status, r.engagement_health,
              s.startup_name, u.full_name as mentor_name
       FROM behavioral_signals bs
       JOIN relationships r ON bs.relationship_id = r.id
       LEFT JOIN startups s ON r.startup_id = s.id
       LEFT JOIN mentors m ON r.mentor_id = m.id
       LEFT JOIN users u ON m.user_id = u.id
       ORDER BY bs.composite_index ASC`
    );
    const rows = result.rows;
    const atRisk = rows.filter(r => r.composite_index < 50).length;
    const avgIndex = rows.length
      ? parseFloat((rows.reduce((a, r) => a + parseFloat(r.composite_index || 0), 0) / rows.length).toFixed(1))
      : 0;
    return success(res, { signals: rows, total: rows.length, at_risk_count: atRisk, avg_composite_index: avgIndex });
  } catch (err) {
    return error(res, 'Failed to fetch behavioral signals');
  }
});

module.exports = router;
