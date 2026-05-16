const { query } = require('../db/connection');
const logger = require('../utils/logger');

async function loadActiveRules() {
  const result = await query(
    'SELECT * FROM governance_rules WHERE is_active = true ORDER BY created_at ASC'
  );
  return result.rows;
}

async function evaluateRule(rule, relationshipData) {
  const { condition_json, action_json } = rule;
  const { field, operator, value } = condition_json;

  let fieldValue;
  try {
    // Resolve field path e.g. "mentor.current_startups"
    if (field.includes('.')) {
      const [entity, prop] = field.split('.');
      fieldValue = relationshipData[entity]?.[prop];
    } else {
      fieldValue = relationshipData[field];
    }

    if (fieldValue === undefined || fieldValue === null) return null;

    let violated = false;
    switch (operator) {
      case '>=': violated = parseFloat(fieldValue) >= parseFloat(value); break;
      case '>':  violated = parseFloat(fieldValue) > parseFloat(value); break;
      case '<=': violated = parseFloat(fieldValue) <= parseFloat(value); break;
      case '<':  violated = parseFloat(fieldValue) < parseFloat(value); break;
      case '==': violated = String(fieldValue) === String(value); break;
      case '!=': violated = String(fieldValue) !== String(value); break;
      default: return null;
    }

    if (violated) {
      return {
        rule_id: rule.id,
        rule_name: rule.name,
        rule_type: rule.rule_type,
        action: action_json.type || 'block',
        message: action_json.message || `Governance rule "${rule.name}" violated`,
        severity: action_json.type === 'block' ? 'error' : 'warning',
      };
    }
  } catch (err) {
    logger.warn(`Rule evaluation error for rule ${rule.id}:`, err.message);
  }
  return null;
}

async function validateRelationship(relationshipData) {
  const rules = await loadActiveRules();
  const violations = [];
  const warnings = [];

  // Enrich relationship data with entity details
  const enriched = { ...relationshipData };

  if (relationshipData.mentor_id) {
    const m = await query('SELECT * FROM mentors WHERE id = $1', [relationshipData.mentor_id]);
    if (m.rows[0]) enriched.mentor = m.rows[0];
  }
  if (relationshipData.startup_id) {
    const s = await query('SELECT * FROM startups WHERE id = $1', [relationshipData.startup_id]);
    if (s.rows[0]) enriched.startup = s.rows[0];
  }

  for (const rule of rules) {
    const violation = await evaluateRule(rule, enriched);
    if (violation) {
      if (violation.action === 'block') violations.push(violation);
      else warnings.push(violation);

      // Increment violation count
      await query(
        'UPDATE governance_rules SET violation_count = violation_count + 1 WHERE id = $1',
        [rule.id]
      );
    }
  }

  return { violations, warnings, passed: violations.length === 0 };
}

async function logGovernanceViolation(relationshipId, violations) {
  if (!violations.length || !relationshipId) return;
  try {
    await query(
      `INSERT INTO lifecycle_events (relationship_id, event_type, triggered_by, payload)
       VALUES ($1, 'governance_violation', 'system', $2)`,
      [relationshipId, JSON.stringify({ violations })]
    );
  } catch (err) {
    logger.warn('Failed to log governance violation event:', err.message);
  }
}

async function createRule(data, userId) {
  const { name, description, rule_type, scope, scope_id, condition_json, action_json } = data;
  const result = await query(
    `INSERT INTO governance_rules (name, description, rule_type, scope, scope_id, condition_json, action_json, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [name, description, rule_type, scope || 'platform', scope_id || null,
     JSON.stringify(condition_json), JSON.stringify(action_json), userId]
  );
  return result.rows[0];
}

async function getDefaultRules() {
  return [
    {
      name: 'Mentor Capacity Cap',
      description: 'A mentor cannot exceed their maximum startup capacity',
      rule_type: 'capacity',
      condition_json: { field: 'mentor.current_startups', operator: '>=', value: 'mentor.max_startups' },
      action_json: { type: 'block', message: 'Mentor has reached maximum startup capacity' }
    },
    {
      name: 'Minimum Verification Score',
      description: 'Startups must have a minimum verification score of 40 for matching',
      rule_type: 'eligibility',
      condition_json: { field: 'startup.verification_score', operator: '<', value: '40' },
      action_json: { type: 'warn', message: 'Startup has a low verification score — proceed with caution' }
    },
    {
      name: 'Flagged Startup Block',
      description: 'Startups with critical risk cannot be matched',
      rule_type: 'eligibility',
      condition_json: { field: 'startup.risk_level', operator: '==', value: 'critical' },
      action_json: { type: 'block', message: 'Startup is flagged as critical risk — relationship blocked' }
    },
  ];
}

module.exports = { validateRelationship, logGovernanceViolation, createRule, loadActiveRules, getDefaultRules };
