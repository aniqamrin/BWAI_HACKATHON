const express = require('express');
const { body } = require('express-validator');
const { query } = require('../db/connection');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { createRelationship, analyzeRelationshipHealth } = require('../services/relationshipService');
const { validateRelationship, logGovernanceViolation } = require('../services/governanceService');
const { computeBehavioralSignals, getSignals } = require('../services/behavioralService');
const { createMilestonesFromBlueprint } = require('../services/cohortService');
const { logEvent } = require('../services/lifecycleEngine');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/relationships
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, status, startup_id, health, cohort_id, limit = 20, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let p = 1;

    if (type)      { whereClause += ` AND r.relationship_type = $${p++}`; params.push(type); }
    if (status)    { whereClause += ` AND r.status = $${p++}`;            params.push(status); }
    if (startup_id){ whereClause += ` AND r.startup_id = $${p++}`;        params.push(startup_id); }
    if (health)    { whereClause += ` AND r.engagement_health = $${p++}`; params.push(health); }
    if (cohort_id) { whereClause += ` AND r.cohort_id = $${p++}`;         params.push(cohort_id); }

    params.push(parseInt(limit), parseInt(offset));

    const result = await query(
      `SELECT r.*,
              s.startup_name, s.industry as startup_industry,
              u_m.full_name as mentor_name, m.expertise as mentor_expertise,
              p.programme_name,
              i.firm_name as investor_name,
              rb.name as blueprint_name
       FROM relationships r
       LEFT JOIN startups s ON r.startup_id = s.id
       LEFT JOIN mentors m ON r.mentor_id = m.id
       LEFT JOIN users u_m ON m.user_id = u_m.id
       LEFT JOIN programmes p ON r.programme_id = p.id
       LEFT JOIN investors i ON r.investor_id = i.id
       LEFT JOIN relationship_blueprints rb ON r.blueprint_id = rb.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${p++} OFFSET $${p}`,
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
              i.firm_name as investor_name,
              rb.name as blueprint_name, rb.required_checkins_per_month,
              rb.milestone_week_schedule, rb.health_alert_threshold
       FROM relationships r
       LEFT JOIN startups s ON r.startup_id = s.id
       LEFT JOIN mentors m ON r.mentor_id = m.id
       LEFT JOIN users u_m ON m.user_id = u_m.id
       LEFT JOIN programmes p ON r.programme_id = p.id
       LEFT JOIN investors i ON r.investor_id = i.id
       LEFT JOIN relationship_blueprints rb ON r.blueprint_id = rb.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return notFound(res, 'Relationship not found');

    const [logs, milestones, signals, lifecycleEvents] = await Promise.all([
      query('SELECT * FROM engagement_logs WHERE relationship_id = $1 ORDER BY created_at DESC LIMIT 20', [req.params.id]),
      query('SELECT * FROM relationship_milestones WHERE relationship_id = $1 ORDER BY due_date ASC', [req.params.id]),
      getSignals(req.params.id),
      query('SELECT * FROM lifecycle_events WHERE relationship_id = $1 ORDER BY created_at DESC LIMIT 30', [req.params.id]),
    ]);

    return success(res, {
      ...result.rows[0],
      engagement_logs: logs.rows,
      milestones: milestones.rows,
      behavioral_signals: signals,
      lifecycle_events: lifecycleEvents.rows,
    });
  } catch (err) {
    logger.error('Get relationship error:', err);
    return error(res, 'Failed to fetch relationship');
  }
});

// GET /api/relationships/:id/timeline
router.get('/:id/timeline', optionalAuth, async (req, res) => {
  try {
    const [logs, milestones, events] = await Promise.all([
      query(`SELECT *, 'log' as entry_type, created_at as ts FROM engagement_logs WHERE relationship_id = $1`, [req.params.id]),
      query(`SELECT *, 'milestone' as entry_type, COALESCE(completed_at, due_date::timestamptz) as ts FROM relationship_milestones WHERE relationship_id = $1`, [req.params.id]),
      query(`SELECT *, 'event' as entry_type, created_at as ts FROM lifecycle_events WHERE relationship_id = $1`, [req.params.id]),
    ]);

    const timeline = [...logs.rows, ...milestones.rows, ...events.rows]
      .sort((a, b) => new Date(b.ts) - new Date(a.ts));

    return success(res, { timeline });
  } catch (err) {
    return error(res, 'Failed to fetch timeline');
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
    // 1. Governance validation
    const govResult = await validateRelationship(req.body);

    if (!govResult.passed) {
      await logGovernanceViolation(null, govResult.violations);
      return res.status(400).json({
        success: false,
        message: 'Relationship blocked by governance rules',
        data: { violations: govResult.violations, warnings: govResult.warnings }
      });
    }

    // 2. Create relationship
    const relationship = await createRelationship(req.body);

    // 3. Auto-create milestones if blueprint provided
    if (req.body.blueprint_id) {
      await createMilestonesFromBlueprint(relationship.id, req.body.blueprint_id, relationship.started_at);
    }

    // 4. Log lifecycle event
    await logEvent(relationship.id, 'created', 'user', { created_by: req.user.id });

    // 5. Log any governance warnings
    if (govResult.warnings.length) {
      await logGovernanceViolation(relationship.id, govResult.warnings);
      await query(
        'UPDATE relationships SET governance_violations = $1 WHERE id = $2',
        [JSON.stringify(govResult.warnings), relationship.id]
      );
    }

    return created(res, { relationship, warnings: govResult.warnings }, 'Relationship created successfully');
  } catch (err) {
    logger.error('Create relationship error:', err);
    return error(res, 'Failed to create relationship');
  }
});

// POST /api/relationships/:id/health
router.post('/:id/health', authenticate, async (req, res) => {
  try {
    const health = await analyzeRelationshipHealth(req.params.id);
    await query('UPDATE relationships SET last_health_check = NOW() WHERE id = $1', [req.params.id]);
    await logEvent(req.params.id, 'health_check', 'user', { health_score: health.health_score, triggered_by: req.user.id });
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
    const { activity_type, notes, outcome, duration_minutes, commitment_fulfilled } = req.body;

    // Calculate response latency
    const lastLog = await query(
      'SELECT created_at FROM engagement_logs WHERE relationship_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );
    let responseLatencyHours = null;
    if (lastLog.rows[0]) {
      responseLatencyHours = (Date.now() - new Date(lastLog.rows[0].created_at)) / (1000 * 60 * 60);
    }

    const result = await query(
      `INSERT INTO engagement_logs (relationship_id, activity_type, notes, outcome, duration_minutes, logged_by, response_latency_hours, commitment_fulfilled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.id, activity_type, notes, outcome, duration_minutes, req.user.id,
       responseLatencyHours, commitment_fulfilled !== false]
    );

    // Update last_activity_at
    await query('UPDATE relationships SET last_activity_at = NOW() WHERE id = $1', [req.params.id]);

    // Log lifecycle event
    await logEvent(req.params.id, 'log_added', 'user', { activity_type, outcome });

    // Recompute behavioral signals in background
    computeBehavioralSignals(req.params.id).catch(err =>
      logger.warn('Behavioral signals update failed:', err.message)
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
    if (!validStatuses.includes(status)) return error(res, 'Invalid status', 400);

    const result = await query(
      'UPDATE relationships SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows[0]) return notFound(res, 'Relationship not found');

    await logEvent(req.params.id, 'status_changed', 'user', { new_status: status, changed_by: req.user.id });

    return success(res, result.rows[0], 'Status updated');
  } catch (err) {
    return error(res, 'Failed to update status');
  }
});

// POST /api/relationships/:id/milestone/:milestone_id/complete
router.post('/:id/milestone/:milestone_id/complete', authenticate, async (req, res) => {
  try {
    const result = await query(
      `UPDATE relationship_milestones
       SET status = 'completed', completed_at = NOW(), notes = COALESCE($1, notes)
       WHERE id = $2 AND relationship_id = $3
       RETURNING *`,
      [req.body.notes, req.params.milestone_id, req.params.id]
    );
    if (!result.rows[0]) return notFound(res, 'Milestone not found');

    await logEvent(req.params.id, 'milestone_completed', 'user', {
      milestone_id: req.params.milestone_id,
      milestone_title: result.rows[0].title
    });

    computeBehavioralSignals(req.params.id).catch(() => {});

    return success(res, result.rows[0], 'Milestone completed');
  } catch (err) {
    return error(res, 'Failed to complete milestone');
  }
});

module.exports = router;
