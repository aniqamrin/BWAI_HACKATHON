const express = require('express');
const { body } = require('express-validator');
const { query } = require('../db/connection');
const { authenticate, requireRole, optionalAuth } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { validateRelationship, createRule, loadActiveRules } = require('../services/governanceService');
const { success, created, error, notFound } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/governance/rules
router.get('/rules', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT gr.*, u.full_name as created_by_name
       FROM governance_rules gr
       LEFT JOIN users u ON gr.created_by = u.id
       ORDER BY gr.created_at DESC`
    );
    return success(res, { rules: result.rows, total: result.rows.length });
  } catch (err) {
    return error(res, 'Failed to fetch governance rules');
  }
});

// POST /api/governance/rules/create
router.post('/rules/create', authenticate, [
  body('name').notEmpty().withMessage('Name is required'),
  body('rule_type').isIn(['capacity', 'eligibility', 'conflict', 'cooldown', 'quality'])
    .withMessage('Invalid rule type'),
  body('condition_json').isObject().withMessage('condition_json must be an object'),
  body('action_json').isObject().withMessage('action_json must be an object'),
  validate
], async (req, res) => {
  try {
    const rule = await createRule(req.body, req.user.id);
    return created(res, rule, 'Governance rule created');
  } catch (err) {
    logger.error('Create governance rule error:', err);
    return error(res, 'Failed to create rule');
  }
});

// PUT /api/governance/rules/:id
router.put('/rules/:id', authenticate, async (req, res) => {
  try {
    const { name, description, condition_json, action_json, is_active } = req.body;
    const result = await query(
      `UPDATE governance_rules SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         condition_json = COALESCE($3, condition_json),
         action_json = COALESCE($4, action_json),
         is_active = COALESCE($5, is_active),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, description,
       condition_json ? JSON.stringify(condition_json) : null,
       action_json ? JSON.stringify(action_json) : null,
       is_active, req.params.id]
    );
    if (!result.rows[0]) return notFound(res, 'Rule not found');
    return success(res, result.rows[0], 'Rule updated');
  } catch (err) {
    return error(res, 'Failed to update rule');
  }
});

// POST /api/governance/validate
router.post('/validate', authenticate, async (req, res) => {
  try {
    const validationResult = await validateRelationship(req.body);
    return success(res, validationResult, validationResult.passed ? 'Validation passed' : 'Validation failed');
  } catch (err) {
    return error(res, 'Validation error');
  }
});

// GET /api/governance/violations
router.get('/violations', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT le.*, s.startup_name, r.relationship_type
       FROM lifecycle_events le
       LEFT JOIN relationships r ON le.relationship_id = r.id
       LEFT JOIN startups s ON r.startup_id = s.id
       WHERE le.event_type = 'governance_violation'
       ORDER BY le.created_at DESC
       LIMIT 50`
    );
    return success(res, { violations: result.rows });
  } catch (err) {
    return error(res, 'Failed to fetch violations');
  }
});

module.exports = router;
