const express = require('express');
const { body } = require('express-validator');
const { query } = require('../db/connection');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { captureOutcome, getOutcomeInsights } = require('../services/outcomeService');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/outcomes/insights
router.get('/insights', optionalAuth, async (req, res) => {
  try {
    const insights = await getOutcomeInsights();
    return success(res, insights);
  } catch (err) {
    logger.error('Outcome insights error:', err);
    return error(res, 'Failed to generate outcome insights');
  }
});

// GET /api/outcomes/:relationship_id
router.get('/:relationship_id', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT ro.*, r.relationship_type, r.match_score,
              s.startup_name, u.full_name as mentor_name
       FROM relationship_outcomes ro
       JOIN relationships r ON ro.relationship_id = r.id
       LEFT JOIN startups s ON ro.startup_id = s.id
       LEFT JOIN mentors m ON ro.mentor_id = m.id
       LEFT JOIN users u ON m.user_id = u.id
       WHERE ro.relationship_id = $1`,
      [req.params.relationship_id]
    );
    if (!result.rows[0]) return notFound(res, 'Outcome not found for this relationship');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch outcome');
  }
});

// POST /api/outcomes/capture
router.post('/capture', authenticate, [
  body('relationship_id').notEmpty().withMessage('relationship_id is required'),
  body('overall_rating').isInt({ min: 1, max: 5 }).withMessage('overall_rating must be 1-5'),
  validate
], async (req, res) => {
  try {
    const outcome = await captureOutcome(req.body);
    return created(res, outcome, 'Outcome captured successfully');
  } catch (err) {
    logger.error('Capture outcome error:', err);
    return error(res, err.message || 'Failed to capture outcome');
  }
});

// GET /api/outcomes (list all)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT ro.*, r.relationship_type,
              s.startup_name, s.industry,
              u.full_name as mentor_name
       FROM relationship_outcomes ro
       JOIN relationships r ON ro.relationship_id = r.id
       LEFT JOIN startups s ON ro.startup_id = s.id
       LEFT JOIN mentors m ON ro.mentor_id = m.id
       LEFT JOIN users u ON m.user_id = u.id
       ORDER BY ro.captured_at DESC
       LIMIT 50`
    );
    return success(res, { outcomes: result.rows, total: result.rows.length });
  } catch (err) {
    return error(res, 'Failed to fetch outcomes');
  }
});

module.exports = router;
