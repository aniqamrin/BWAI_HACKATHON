const express = require('express');
const { body } = require('express-validator');
const { query } = require('../db/connection');
const { authenticate, requireRole, optionalAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { success, created, error, notFound } = require('../utils/response');

const router = express.Router();

// GET /api/programmes
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, country, limit = 20, offset = 0 } = req.query;

    let whereClause = 'WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND status = $${paramCount++}`;
      params.push(status);
    }
    if (country) {
      whereClause += ` AND country ILIKE $${paramCount++}`;
      params.push(`%${country}%`);
    }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT * FROM programmes ${whereClause}
       ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    return success(res, { programmes: result.rows, total: result.rows.length });
  } catch (err) {
    return error(res, 'Failed to fetch programmes');
  }
});

// GET /api/programmes/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM relationships r WHERE r.programme_id = p.id AND r.status = 'active') as enrolled_startups
       FROM programmes p WHERE p.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) return notFound(res, 'Programme not found');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch programme');
  }
});

// POST /api/programmes/create
router.post('/create', authenticate, requireRole('admin'), [
  body('programme_name').trim().notEmpty().withMessage('Programme name is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('focus_area').isArray().withMessage('Focus area must be an array'),
  validate
], async (req, res) => {
  try {
    const {
      programme_name, description, organizer, country, focus_area,
      cohort_size, duration_weeks, funding_offered, equity_taken,
      application_deadline, start_date, end_date, status,
      eligibility_criteria, benefits, website
    } = req.body;

    const result = await query(
      `INSERT INTO programmes 
       (programme_name, description, organizer, country, focus_area, cohort_size,
        duration_weeks, funding_offered, equity_taken, application_deadline,
        start_date, end_date, status, eligibility_criteria, benefits, website)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [programme_name, description, organizer, country, focus_area,
       cohort_size || 10, duration_weeks, funding_offered, equity_taken,
       application_deadline, start_date, end_date, status || 'open',
       eligibility_criteria, benefits || [], website]
    );

    return created(res, result.rows[0], 'Programme created successfully');
  } catch (err) {
    return error(res, 'Failed to create programme');
  }
});

module.exports = router;
