const express = require('express');
const { body } = require('express-validator');
const { query } = require('../db/connection');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createRelationship, analyzeRelationshipHealth } = require('../services/relationshipService');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/relationships
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, status, startup_id, limit = 20, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (type) {
      whereClause += ` AND r.relationship_type = $${paramCount++}`;
      params.push(type);
    }
    if (status) {
      whereClause += ` AND r.status = $${paramCount++}`;
      params.push(status);
    }
    if (startup_id) {
      whereClause += ` AND r.startup_id = $${paramCount++}`;
      params.push(startup_id);
    }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT r.*,
              s.startup_name, s.industry as startup_industry,
              u_m.full_name as mentor_name, m.expertise as mentor_expertise,
              p.programme_name,
              i.firm_name as investor_name
       FROM relationships r
       LEFT JOIN startups s ON r.startup_id = s.id
       LEFT JOIN mentors m ON r.mentor_id = m.id
       LEFT JOIN users u_m ON m.user_id = u_m.id
       LEFT JOIN programmes p ON r.programme_id = p.id
       LEFT JOIN investors i ON r.investor_id = i.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    return success(res, { relationships: result.rows, total: result.rows.length });
  } catch (err) {
    logger.error('Get relationships error:', err);
    return error(res, 'Failed to fetch relationships');
  }
});

// GET /api/relationships/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*,
              s.startup_name, s.industry as startup_industry, s.stage,
              u_m.full_name as mentor_name, m.expertise,
              p.programme_name, p.organizer,
              i.firm_name as investor_name
       FROM relationships r
       LEFT JOIN startups s ON r.startup_id = s.id
       LEFT JOIN mentors m ON r.mentor_id = m.id
       LEFT JOIN users u_m ON m.user_id = u_m.id
       LEFT JOIN programmes p ON r.programme_id = p.id
       LEFT JOIN investors i ON r.investor_id = i.id
       WHERE r.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) return notFound(res, 'Relationship not found');

    // Get engagement logs
    const logs = await query(
      'SELECT * FROM engagement_logs WHERE relationship_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );

    return success(res, { ...result.rows[0], engagement_logs: logs.rows });
  } catch (err) {
    return error(res, 'Failed to fetch relationship');
  }
});

// POST /api/relationships/create
router.post('/create', authenticate, [
  body('relationship_type').isIn([
    'mentor_startup', 'startup_programme', 'startup_investor',
    'mentor_programme', 'investor_programme', 'partner_startup'
  ]).withMessage('Invalid relationship type'),
  validate
], async (req, res) => {
  try {
    const relationship = await createRelationship(req.body);
    return created(res, relationship, 'Relationship created successfully');
  } catch (err) {
    logger.error('Create relationship error:', err);
    return error(res, 'Failed to create relationship');
  }
});

// POST /api/relationships/:id/health
router.post('/:id/health', authenticate, async (req, res) => {
  try {
    const health = await analyzeRelationshipHealth(req.params.id);
    return success(res, health, 'Health analysis completed');
  } catch (err) {
    logger.error('Health analysis error:', err);
    return error(res, 'Health analysis failed');
  }
});

// POST /api/relationships/:id/log
router.post('/:id/log', authenticate, [
  body('activity_type').notEmpty().withMessage('Activity type is required'),
  validate
], async (req, res) => {
  try {
    const { activity_type, notes, outcome, duration_minutes } = req.body;

    const result = await query(
      `INSERT INTO engagement_logs (relationship_id, activity_type, notes, outcome, duration_minutes, logged_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, activity_type, notes, outcome, duration_minutes, req.user.id]
    );

    return created(res, result.rows[0], 'Engagement logged');
  } catch (err) {
    return error(res, 'Failed to log engagement');
  }
});

// PATCH /api/relationships/:id/status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'active', 'paused', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return error(res, 'Invalid status', 400);
    }

    const result = await query(
      'UPDATE relationships SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (!result.rows[0]) return notFound(res, 'Relationship not found');
    return success(res, result.rows[0], 'Status updated');
  } catch (err) {
    return error(res, 'Failed to update status');
  }
});

module.exports = router;
