const express = require('express');
const { body, query: queryValidator } = require('express-validator');
const { query } = require('../db/connection');
const { authenticate, requireRole, optionalAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { success, created, error, notFound, badRequest } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/startups
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { industry, stage, country, limit = 20, offset = 0 } = req.query;

    let whereClause = 'WHERE s.is_active = true';
    const params = [];
    let paramCount = 1;

    if (industry) {
      whereClause += ` AND s.industry ILIKE $${paramCount++}`;
      params.push(`%${industry}%`);
    }
    if (stage) {
      whereClause += ` AND s.stage = $${paramCount++}`;
      params.push(stage);
    }
    if (country) {
      whereClause += ` AND s.country ILIKE $${paramCount++}`;
      params.push(`%${country}%`);
    }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT s.*, u.full_name as founder_name, u.email as founder_email
       FROM startups s
       JOIN users u ON s.user_id = u.id
       ${whereClause}
       ORDER BY s.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM startups s ${whereClause}`,
      params.slice(0, -2)
    );

    return success(res, {
      startups: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    logger.error('Get startups error:', err);
    return error(res, 'Failed to fetch startups');
  }
});

// GET /api/startups/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*, u.full_name as founder_name, u.email as founder_email,
              (SELECT COUNT(*) FROM relationships r WHERE r.startup_id = s.id AND r.status = 'active') as active_relationships
       FROM startups s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = $1 AND s.is_active = true`,
      [req.params.id]
    );

    if (!result.rows[0]) return notFound(res, 'Startup not found');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch startup');
  }
});

// POST /api/startups/create
router.post('/create', authenticate, [
  body('startup_name').trim().notEmpty().withMessage('Startup name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('industry').trim().notEmpty().withMessage('Industry is required'),
  body('stage').isIn(['idea', 'pre-seed', 'seed', 'series-a', 'series-b', 'growth', 'mature']).withMessage('Invalid stage'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  validate
], async (req, res) => {
  try {
    const {
      startup_name, description, industry, stage, country, website,
      team_size, founded_year, revenue_model, target_market,
      problem_statement, solution, traction, funding_raised, funding_needed, tags
    } = req.body;

    // Check if user already has a startup
    const existing = await query('SELECT id FROM startups WHERE user_id = $1', [req.user.id]);
    if (existing.rows[0]) {
      return badRequest(res, 'You already have a registered startup');
    }

    const result = await query(
      `INSERT INTO startups 
       (user_id, startup_name, description, industry, stage, country, website,
        team_size, founded_year, revenue_model, target_market, problem_statement,
        solution, traction, funding_raised, funding_needed, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [req.user.id, startup_name, description, industry, stage, country, website,
       team_size || 1, founded_year, revenue_model, target_market,
       problem_statement, solution, traction, funding_raised || 0, funding_needed,
       tags || []]
    );

    // Update user role to startup
    await query('UPDATE users SET role = $1 WHERE id = $2', ['startup', req.user.id]);

    logger.info(`New startup created: ${startup_name} by user ${req.user.id}`);
    return created(res, result.rows[0], 'Startup registered successfully');
  } catch (err) {
    logger.error('Create startup error:', err);
    return error(res, 'Failed to create startup');
  }
});

// PUT /api/startups/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const startup = await query('SELECT * FROM startups WHERE id = $1', [req.params.id]);
    if (!startup.rows[0]) return notFound(res, 'Startup not found');

    if (startup.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'Not authorized', 403);
    }

    const {
      startup_name, description, industry, stage, country, website,
      team_size, revenue_model, target_market, problem_statement,
      solution, traction, funding_raised, funding_needed, tags
    } = req.body;

    const result = await query(
      `UPDATE startups SET
         startup_name = COALESCE($1, startup_name),
         description = COALESCE($2, description),
         industry = COALESCE($3, industry),
         stage = COALESCE($4, stage),
         country = COALESCE($5, country),
         website = COALESCE($6, website),
         team_size = COALESCE($7, team_size),
         revenue_model = COALESCE($8, revenue_model),
         target_market = COALESCE($9, target_market),
         problem_statement = COALESCE($10, problem_statement),
         solution = COALESCE($11, solution),
         traction = COALESCE($12, traction),
         funding_raised = COALESCE($13, funding_raised),
         funding_needed = COALESCE($14, funding_needed),
         tags = COALESCE($15, tags),
         updated_at = NOW()
       WHERE id = $16 RETURNING *`,
      [startup_name, description, industry, stage, country, website,
       team_size, revenue_model, target_market, problem_statement,
       solution, traction, funding_raised, funding_needed, tags, req.params.id]
    );

    return success(res, result.rows[0], 'Startup updated successfully');
  } catch (err) {
    logger.error('Update startup error:', err);
    return error(res, 'Failed to update startup');
  }
});

module.exports = router;
