const express = require('express');
const { body } = require('express-validator');
const { query } = require('../db/connection');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/mentors
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { availability, industry, limit = 20, offset = 0 } = req.query;

    let whereClause = 'WHERE m.is_active = true';
    const params = [];
    let paramCount = 1;

    if (availability) {
      whereClause += ` AND m.availability = $${paramCount++}`;
      params.push(availability);
    }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT m.*, u.full_name, u.email, u.country as user_country
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       ${whereClause}
       ORDER BY m.rating DESC, m.years_experience DESC
       LIMIT $${paramCount++} OFFSET $${paramCount}`,
      params
    );

    return success(res, { mentors: result.rows, total: result.rows.length });
  } catch (err) {
    logger.error('Get mentors error:', err);
    return error(res, 'Failed to fetch mentors');
  }
});

// GET /api/mentors/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, u.full_name, u.email, u.country as user_country,
              (SELECT COUNT(*) FROM relationships r WHERE r.mentor_id = m.id AND r.status = 'active') as active_mentorships
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = $1`,
      [req.params.id]
    );

    if (!result.rows[0]) return notFound(res, 'Mentor not found');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch mentor');
  }
});

// POST /api/mentors/create
router.post('/create', authenticate, [
  body('bio').trim().notEmpty().withMessage('Bio is required'),
  body('expertise').isArray().withMessage('Expertise must be an array'),
  body('industries').isArray().withMessage('Industries must be an array'),
  body('years_experience').isInt({ min: 0 }).withMessage('Years experience must be a positive number'),
  validate
], async (req, res) => {
  try {
    const {
      bio, expertise, industries, years_experience, availability,
      mentorship_style, max_startups, linkedin_url, company, title, location, timezone, languages
    } = req.body;

    const existing = await query('SELECT id FROM mentors WHERE user_id = $1', [req.user.id]);
    if (existing.rows[0]) {
      return error(res, 'Mentor profile already exists', 400);
    }

    const result = await query(
      `INSERT INTO mentors 
       (user_id, bio, expertise, industries, years_experience, availability,
        mentorship_style, max_startups, linkedin_url, company, title, location, timezone, languages)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [req.user.id, bio, expertise, industries, years_experience,
       availability || 'available', mentorship_style, max_startups || 3,
       linkedin_url, company, title, location, timezone, languages || []]
    );

    await query('UPDATE users SET role = $1 WHERE id = $2', ['mentor', req.user.id]);

    return created(res, result.rows[0], 'Mentor profile created');
  } catch (err) {
    logger.error('Create mentor error:', err);
    return error(res, 'Failed to create mentor profile');
  }
});

module.exports = router;
