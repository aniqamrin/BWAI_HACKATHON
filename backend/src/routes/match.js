const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { matchMentorsForStartup, matchProgrammesForStartup } = require('../services/matchingService');
const { success, error, notFound } = require('../utils/response');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/match/mentor
router.post('/mentor', authenticate, [
  body('startup_id').notEmpty().withMessage('Startup ID is required'),
  validate
], async (req, res) => {
  try {
    const { startup_id, limit = 5 } = req.body;

    const startupCheck = await query('SELECT id FROM startups WHERE id = $1', [startup_id]);
    if (!startupCheck.rows[0]) return notFound(res, 'Startup not found');

    const matches = await matchMentorsForStartup(startup_id, limit);

    logger.info(`Generated ${matches.length} mentor matches for startup ${startup_id}`);
    return success(res, { matches, total: matches.length }, 'Mentor matches generated');
  } catch (err) {
    logger.error('Mentor match error:', err);
    return error(res, 'Mentor matching failed: ' + err.message);
  }
});

// POST /api/match/programme
router.post('/programme', authenticate, [
  body('startup_id').notEmpty().withMessage('Startup ID is required'),
  validate
], async (req, res) => {
  try {
    const { startup_id, limit = 5 } = req.body;

    const startupCheck = await query('SELECT id FROM startups WHERE id = $1', [startup_id]);
    if (!startupCheck.rows[0]) return notFound(res, 'Startup not found');

    const matches = await matchProgrammesForStartup(startup_id, limit);

    return success(res, { matches, total: matches.length }, 'Programme matches generated');
  } catch (err) {
    logger.error('Programme match error:', err);
    return error(res, 'Programme matching failed: ' + err.message);
  }
});

// GET /api/match/recommendations/:startup_id
router.get('/recommendations/:startup_id', authenticate, async (req, res) => {
  try {
    const { startup_id } = req.params;

    const [mentorMatches, programmeMatches] = await Promise.all([
      matchMentorsForStartup(startup_id, 3),
      matchProgrammesForStartup(startup_id, 3)
    ]);

    return success(res, {
      mentor_recommendations: mentorMatches,
      programme_recommendations: programmeMatches
    }, 'Recommendations generated');
  } catch (err) {
    logger.error('Recommendations error:', err);
    return error(res, 'Failed to generate recommendations');
  }
});

module.exports = router;
