const express = require('express');
const { body } = require('express-validator');
const { query } = require('../db/connection');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { runCohortMatching, approveCohort } = require('../services/cohortService');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/cohorts
router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, p.programme_name,
              rb.name as blueprint_name,
              u.full_name as created_by_name,
              array_length(c.startup_ids, 1) as startup_count,
              array_length(c.mentor_ids, 1) as mentor_count,
              (SELECT COUNT(*) FROM relationships r WHERE r.cohort_id = c.id) as relationship_count
       FROM cohorts c
       LEFT JOIN programmes p ON c.programme_id = p.id
       LEFT JOIN relationship_blueprints rb ON c.blueprint_id = rb.id
       LEFT JOIN users u ON c.created_by = u.id
       ORDER BY c.created_at DESC`
    );
    return success(res, { cohorts: result.rows, total: result.rows.length });
  } catch (err) {
    return error(res, 'Failed to fetch cohorts');
  }
});

// GET /api/cohorts/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, p.programme_name, rb.name as blueprint_name
       FROM cohorts c
       LEFT JOIN programmes p ON c.programme_id = p.id
       LEFT JOIN relationship_blueprints rb ON c.blueprint_id = rb.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return notFound(res, 'Cohort not found');

    const cohort = result.rows[0];

    // Fetch startup details
    let startups = [];
    if (cohort.startup_ids?.length) {
      const s = await query(
        'SELECT id, startup_name, industry, stage, country, verification_score FROM startups WHERE id = ANY($1)',
        [cohort.startup_ids]
      );
      startups = s.rows;
    }

    // Fetch mentor details
    let mentors = [];
    if (cohort.mentor_ids?.length) {
      const m = await query(
        `SELECT m.id, u.full_name, m.expertise, m.industries, m.rating, m.availability, m.current_startups, m.max_startups
         FROM mentors m JOIN users u ON m.user_id = u.id WHERE m.id = ANY($1)`,
        [cohort.mentor_ids]
      );
      mentors = m.rows;
    }

    const relationships = await query(
      `SELECT r.id, r.startup_id, r.mentor_id, r.match_score, r.status, r.health_score,
              s.startup_name
       FROM relationships r
       LEFT JOIN startups s ON r.startup_id = s.id
       WHERE r.cohort_id = $1`,
      [req.params.id]
    );

    return success(res, { ...cohort, startups, mentors, relationships: relationships.rows });
  } catch (err) {
    logger.error('Get cohort error:', err);
    return error(res, 'Failed to fetch cohort');
  }
});

// POST /api/cohorts/create
router.post('/create', authenticate, [
  body('name').notEmpty().withMessage('Name is required'),
  validate
], async (req, res) => {
  try {
    const { programme_id, name, country, description, startup_ids, mentor_ids, blueprint_id } = req.body;
    const result = await query(
      `INSERT INTO cohorts (programme_id, name, country, description, startup_ids, mentor_ids, blueprint_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [programme_id || null, name, country, description,
       startup_ids || [], mentor_ids || [], blueprint_id || null, req.user.id]
    );
    return created(res, result.rows[0], 'Cohort created');
  } catch (err) {
    logger.error('Create cohort error:', err);
    return error(res, 'Failed to create cohort');
  }
});

// POST /api/cohorts/:id/run-matching
router.post('/:id/run-matching', authenticate, async (req, res) => {
  try {
    const matrix = await runCohortMatching(req.params.id);
    return success(res, matrix, 'Cohort matching completed');
  } catch (err) {
    logger.error('Run cohort matching error:', err);
    return error(res, err.message || 'Matching failed');
  }
});

// POST /api/cohorts/:id/approve
router.post('/:id/approve', authenticate, async (req, res) => {
  try {
    const result = await approveCohort(req.params.id, req.user.id);
    return success(res, result, `${result.created_count} relationships created from cohort`);
  } catch (err) {
    logger.error('Approve cohort error:', err);
    return error(res, err.message || 'Approval failed');
  }
});

// GET /api/cohorts/:id/matrix
router.get('/:id/matrix', optionalAuth, async (req, res) => {
  try {
    const result = await query('SELECT match_matrix, status FROM cohorts WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return notFound(res, 'Cohort not found');
    return success(res, result.rows[0]);
  } catch (err) {
    return error(res, 'Failed to fetch matrix');
  }
});

// PATCH /api/cohorts/:id/update-members
router.patch('/:id/update-members', authenticate, async (req, res) => {
  try {
    const { startup_ids, mentor_ids } = req.body;
    const result = await query(
      `UPDATE cohorts SET
         startup_ids = COALESCE($1, startup_ids),
         mentor_ids = COALESCE($2, mentor_ids),
         status = 'draft',
         match_matrix = '{}',
         updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [startup_ids || null, mentor_ids || null, req.params.id]
    );
    if (!result.rows[0]) return notFound(res, 'Cohort not found');
    return success(res, result.rows[0], 'Cohort members updated');
  } catch (err) {
    return error(res, 'Failed to update cohort members');
  }
});

module.exports = router;
