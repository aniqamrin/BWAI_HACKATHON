const { query } = require('../db/connection');
const { analyzeRelationshipHealth } = require('./relationshipService');
const { computeBehavioralSignals } = require('./behavioralService');
const logger = require('../utils/logger');

async function runLifecycleScan() {
  logger.info('[Lifecycle] Starting lifecycle scan...');
  const stats = { nudges: 0, escalations: 0, auto_completed: 0, health_checks: 0, errors: 0 };

  try {
    const result = await query(
      `SELECT r.*, rb.inactivity_alert_days, rb.escalation_threshold,
              rb.health_alert_threshold, rb.auto_complete_on_end_date,
              rb.auto_actions
       FROM relationships r
       LEFT JOIN relationship_blueprints rb ON r.blueprint_id = rb.id
       WHERE r.status = 'active'`
    );

    const relationships = result.rows;
    logger.info(`[Lifecycle] Scanning ${relationships.length} active relationships`);

    for (const rel of relationships) {
      try {
        await processRelationship(rel, stats);
      } catch (err) {
        stats.errors++;
        logger.error(`[Lifecycle] Error processing relationship ${rel.id}:`, err.message);
      }
    }

    // Compute behavioral signals for all active relationships
    for (const rel of relationships) {
      try {
        await computeBehavioralSignals(rel.id);
      } catch (err) {
        logger.warn(`[Lifecycle] Behavioral signals error for ${rel.id}:`, err.message);
      }
    }

    logger.info(`[Lifecycle] Scan complete:`, stats);
    return stats;
  } catch (err) {
    logger.error('[Lifecycle] Fatal scan error:', err);
    throw err;
  }
}

async function processRelationship(rel, stats) {
  const now = new Date();
  const inactivityDays = rel.inactivity_alert_days || 7;
  const escalationThreshold = rel.escalation_threshold || 40;
  const healthAlertThreshold = rel.health_alert_threshold || 60;

  // 1. Check auto-complete
  if (rel.auto_complete_on_end_date && rel.ended_at && new Date(rel.ended_at) < now) {
    await query(
      `UPDATE relationships SET status = 'completed', updated_at = NOW() WHERE id = $1`,
      [rel.id]
    );
    await logEvent(rel.id, 'auto_completed', 'scheduler', { ended_at: rel.ended_at });
    stats.auto_completed++;
    return;
  }

  // 2. Check inactivity
  const lastActivity = rel.last_activity_at ? new Date(rel.last_activity_at) : new Date(rel.created_at);
  const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);

  if (daysSinceActivity >= inactivityDays) {
    // Check if we already sent a nudge recently (within last 3 days)
    const recentNudge = await query(
      `SELECT id FROM lifecycle_events
       WHERE relationship_id = $1 AND event_type = 'nudge_sent'
       AND created_at > NOW() - INTERVAL '3 days'
       LIMIT 1`,
      [rel.id]
    );

    if (!recentNudge.rows.length) {
      await logEvent(rel.id, 'nudge_sent', 'scheduler', {
        days_inactive: Math.floor(daysSinceActivity),
        message: `No activity in ${Math.floor(daysSinceActivity)} days`
      });
      stats.nudges++;
    }
  }

  // 3. Run health check for low-health or not-recently-checked relationships
  const shouldHealthCheck = !rel.last_health_check ||
    (now - new Date(rel.last_health_check)) > (24 * 60 * 60 * 1000);

  if (shouldHealthCheck) {
    try {
      const health = await analyzeRelationshipHealth(rel.id);
      await query(
        'UPDATE relationships SET last_health_check = NOW() WHERE id = $1', [rel.id]
      );
      stats.health_checks++;

      // 4. Check escalation threshold
      if (health.health_score < escalationThreshold) {
        const recentEscalation = await query(
          `SELECT id FROM lifecycle_events
           WHERE relationship_id = $1 AND event_type = 'escalation'
           AND created_at > NOW() - INTERVAL '7 days'
           LIMIT 1`,
          [rel.id]
        );

        if (!recentEscalation.rows.length) {
          await logEvent(rel.id, 'escalation', 'scheduler', {
            health_score: health.health_score,
            message: `Health score ${health.health_score} below escalation threshold ${escalationThreshold}`
          });
          stats.escalations++;
        }
      }
    } catch (err) {
      logger.warn(`[Lifecycle] Health check failed for ${rel.id}:`, err.message);
    }
  }

  // 5. Check milestone due dates
  const overdueMilestones = await query(
    `SELECT * FROM relationship_milestones
     WHERE relationship_id = $1 AND status = 'pending'
     AND due_date < NOW()`,
    [rel.id]
  );

  for (const milestone of overdueMilestones.rows) {
    const alreadyLogged = await query(
      `SELECT id FROM lifecycle_events
       WHERE relationship_id = $1 AND event_type = 'milestone_due'
       AND payload->>'milestone_id' = $2
       LIMIT 1`,
      [rel.id, milestone.id]
    );

    if (!alreadyLogged.rows.length) {
      await logEvent(rel.id, 'milestone_due', 'scheduler', {
        milestone_id: milestone.id,
        milestone_title: milestone.title,
        due_date: milestone.due_date,
      });

      await query(
        'UPDATE relationship_milestones SET status = $1 WHERE id = $2',
        ['missed', milestone.id]
      );
    }
  }
}

async function logEvent(relationshipId, eventType, triggeredBy, payload) {
  try {
    await query(
      `INSERT INTO lifecycle_events (relationship_id, event_type, triggered_by, payload)
       VALUES ($1, $2, $3, $4)`,
      [relationshipId, eventType, triggeredBy, JSON.stringify(payload)]
    );
  } catch (err) {
    logger.error('Failed to log lifecycle event:', err.message);
  }
}

async function getLifecycleSummary() {
  const [atRisk, pendingMilestones, recentEvents] = await Promise.all([
    query(
      `SELECT r.id, r.relationship_type, r.health_score, r.engagement_health,
              s.startup_name, u.full_name as mentor_name
       FROM relationships r
       LEFT JOIN startups s ON r.startup_id = s.id
       LEFT JOIN mentors m ON r.mentor_id = m.id
       LEFT JOIN users u ON m.user_id = u.id
       WHERE r.status = 'active' AND (r.health_score < 60 OR r.engagement_health IN ('poor','inactive'))
       ORDER BY r.health_score ASC
       LIMIT 10`
    ),
    query(
      `SELECT rm.*, s.startup_name
       FROM relationship_milestones rm
       JOIN relationships r ON rm.relationship_id = r.id
       JOIN startups s ON r.startup_id = s.id
       WHERE rm.status = 'pending' AND rm.due_date <= NOW() + INTERVAL '7 days'
       ORDER BY rm.due_date ASC
       LIMIT 10`
    ),
    query(
      `SELECT le.*, s.startup_name
       FROM lifecycle_events le
       LEFT JOIN relationships r ON le.relationship_id = r.id
       LEFT JOIN startups s ON r.startup_id = s.id
       ORDER BY le.created_at DESC
       LIMIT 20`
    ),
  ]);

  return {
    at_risk: atRisk.rows,
    pending_milestones: pendingMilestones.rows,
    recent_events: recentEvents.rows,
  };
}

module.exports = { runLifecycleScan, logEvent, getLifecycleSummary };
