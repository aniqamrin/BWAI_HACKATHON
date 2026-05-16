const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { verifyStartup } = require('../services/verificationService');
const { query } = require('../db/connection');
const { success, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/verify/startup
router.post('/startup', authenticate, [
  body('startup_id').notEmpty().withMessage('Startup ID is required'),
  validate
], async (req, res) => {
  try {
    const { startup_id } = req.body;

    // Check startup exists and user has access
    const startupResult = await query(
      'SELECT * FROM startups WHERE id = $1',
      [startup_id]
    );

    if (!startupResult.rows[0]) {
      return notFound(res, 'Startup not found');
    }

    const startup = startupResult.rows[0];

    // Only owner or admin can verify
    if (startup.user_id !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'Not authorized to verify this startup', 403);
    }

    const result = await verifyStartup(startup_id);

    logger.info(`Startup ${startup_id} verified successfully`);
    return success(res, result, 'Startup verification completed');
  } catch (err) {
    logger.error('Verification route error:', err);
    return error(res, 'Verification failed: ' + err.message);
  }
});

// GET /api/verify/history/:startup_id
router.get('/history/:startup_id', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM verification_attempts 
       WHERE startup_id = $1 
       ORDER BY created_at DESC LIMIT 10`,
      [req.params.startup_id]
    );

    return success(res, { history: result.rows });
  } catch (err) {
    return error(res, 'Failed to fetch verification history');
  }
});

module.exports = router;
