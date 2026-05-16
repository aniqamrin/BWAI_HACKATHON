const express = require('express');
const { body } = require('express-validator');
const { query } = require('../db/connection');
const { authenticate, requireRole, optionalAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/blueprints
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type } = req.query;
    let sql = `SELECT rb.*, u.full_name as created_by_name,
               (SELECT COUNT(*) FROM relationships r WHERE r.blueprint_id = rb.id) as usage_count,
               (SELECT AVG(ro.overall_rating) FROM relationship_outcomes ro
                JOIN relationships r ON ro.relationship_id = r.id
                WHERE r.blueprint_id = rb.id) as avg_outcome_rating
               FROM relationship_blueprints rb
               LEFT JOIN users u ON rb.created_by = u.id
               WHERE rb.is_active = true`;
    const params = [];
    if (type) { sql += ` AND rb.relationship_type = $1`; params.push(type); }
    sql += ' ORDER BY rb.created_at DESC';
    const result = await query(sql, params);
    return success(res, { blueprints: result.rows, total: result.rows.length });
  } catch (err) {
    logger.error('Get blueprints error:', err);
    return error(res, 'Failed to fetch blueprints');
  }
});

// GET /api/blueprints/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT rb.*, u.full_name as created_by_name,
       (SELECT COUNT(*) FROM relationships r WHERE r.blueprint_id = rb.id) as usage_count,
       (SELECT AVG(ro.overall_rating) FROM relationship_outcomes ro
        JOIN relationships r ON ro.relationship_id = r.id
        WHERE r.blueprint_id = rb.id) as avg_outcome_rating,
       (SELECT AVG(r.health_score) FROM relationships r WHERE r.blueprint_id = rb.id) as avg_health_score
       FROM relationship_blueprints rb
       LEFT JOIN users u ON rb.created_by = u.id
       WHERE rb.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return notFound(res, 'Blueprint not found');

    const relationships = await query(
      `SELECT r.id, r.status, r.health_score, r.engagement_health, r.created_at,
              s.startup_name
       FROM relationships r
       LEFT JOIN startups s ON r.startup_id = s.id
       WHERE r.blueprint_id = $1
       ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    return success(res, { ...result.rows[0], relationships: relationships.rows });
  } catch (err) {
    return error(res, 'Failed to fetch blueprint');
  }
});

// POST /api/blueprints/create
router.post('/create', authenticate, [
  body('name').notEmpty().withMessage('Name is required'),
  body('relationship_type').isIn(['mentor_startup', 'startup_programme', 'startup_investor', 'partner_startup'])
    .withMessage('Invalid relationship type'),
  validate
], async (req, res) => {
  try {
    const {
      name, description, relationship_type, duration_weeks,
      required_checkins_per_month, milestone_week_schedule,
      health_alert_threshold, escalation_threshold, inactivity_alert_days,
      auto_complete_on_end_date, eligibility_rules, auto_actions
    } = req.body;

    const result = await query(
      `INSERT INTO relationship_blueprints
         (name, description, relationship_type, duration_weeks, required_checkins_per_month,
          milestone_week_schedule, health_alert_threshold, escalation_threshold,
          inactivity_alert_days, auto_complete_on_end_date, eligibility_rules, auto_actions, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [name, description, relationship_type, duration_weeks || 12,
       required_checkins_per_month || 2,
       milestone_week_schedule || [4, 8, 12],
       health_alert_threshold || 60, escalation_threshold || 40,
       inactivity_alert_days || 7, auto_complete_on_end_date !== false,
       JSON.stringify(eligibility_rules || {}),
       JSON.stringify(auto_actions || { on_inactivity: 'nudge', on_health_below_threshold: 'escalate', on_completion: 'capture_outcome' }),
       req.user.id]
    );
    return created(res, result.rows[0], 'Blueprint created');
  } catch (err) {
    logger.error('Create blueprint error:', err);
    return error(res, 'Failed to create blueprint');
  }
});

// PUT /api/blueprints/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, duration_weeks, required_checkins_per_month,
            milestone_week_schedule, health_alert_threshold, escalation_threshold,
            inactivity_alert_days, auto_complete_on_end_date, eligibility_rules, auto_actions } = req.body;

    const result = await query(
      `UPDATE relationship_blueprints SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         duration_weeks = COALESCE($3, duration_weeks),
         required_checkins_per_month = COALESCE($4, required_checkins_per_month),
         milestone_week_schedule = COALESCE($5, milestone_week_schedule),
         health_alert_threshold = COALESCE($6, health_alert_threshold),
         escalation_threshold = COALESCE($7, escalation_threshold),
         inactivity_alert_days = COALESCE($8, inactivity_alert_days),
         auto_complete_on_end_date = COALESCE($9, auto_complete_on_end_date),
         eligibility_rules = COALESCE($10, eligibility_rules),
         auto_actions = COALESCE($11, auto_actions),
         updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [name, description, duration_weeks, required_checkins_per_month,
       milestone_week_schedule, health_alert_threshold, escalation_threshold,
       inactivity_alert_days, auto_complete_on_end_date,
       eligibility_rules ? JSON.stringify(eligibility_rules) : null,
       auto_actions ? JSON.stringify(auto_actions) : null,
       req.params.id]
    );
    if (!result.rows[0]) return notFound(res, 'Blueprint not found');
    return success(res, result.rows[0], 'Blueprint updated');
  } catch (err) {
    return error(res, 'Failed to update blueprint');
  }
});

// DELETE /api/blueprints/:id (soft delete)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await query('UPDATE relationship_blueprints SET is_active = false WHERE id = $1', [req.params.id]);
    return success(res, null, 'Blueprint deactivated');
  } catch (err) {
    return error(res, 'Failed to delete blueprint');
  }
});

module.exports = router;
