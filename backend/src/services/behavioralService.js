const { query } = require('../db/connection');
const logger = require('../utils/logger');

async function computeBehavioralSignals(relationshipId) {
  try {
    const logsResult = await query(
      `SELECT * FROM engagement_logs WHERE relationship_id = $1 ORDER BY created_at ASC`,
      [relationshipId]
    );
    const logs = logsResult.rows;

    const milestonesResult = await query(
      `SELECT * FROM relationship_milestones WHERE relationship_id = $1`,
      [relationshipId]
    );
    const milestones = milestonesResult.rows;

    // avg_response_latency_hours: avg hours between consecutive logs
    let avgResponseLatency = 0;
    if (logs.length >= 2) {
      let totalHours = 0;
      for (let i = 1; i < logs.length; i++) {
        const diff = new Date(logs[i].created_at) - new Date(logs[i - 1].created_at);
        totalHours += diff / (1000 * 60 * 60);
      }
      avgResponseLatency = totalHours / (logs.length - 1);
    }

    // meeting_commitment_ratio
    const withCommitment = logs.filter(l => l.commitment_fulfilled !== false);
    const meetingCommitmentRatio = logs.length > 0
      ? withCommitment.length / logs.length : 0;

    // milestone_completion_rate
    const dueMilestones = milestones.filter(m =>
      m.status !== 'pending' || (m.due_date && new Date(m.due_date) < new Date())
    );
    const completedOnTime = milestones.filter(m => {
      if (m.status !== 'completed' || !m.due_date || !m.completed_at) return false;
      return new Date(m.completed_at) <= new Date(m.due_date);
    });
    const milestoneCompletionRate = dueMilestones.length > 0
      ? completedOnTime.length / dueMilestones.length : 0;

    // next_action_followthrough_rate: ratio of logs that follow through (commitment_fulfilled)
    const nextActionFollowthroughRate = meetingCommitmentRatio;

    // engagement_velocity: compare last 30 days vs previous 30 days log count
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(l => new Date(l.created_at) >= thirtyDaysAgo).length;
    const olderLogs = logs.filter(l => {
      const d = new Date(l.created_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    }).length;
    let engagementVelocity = 0.5;
    if (recentLogs > olderLogs) engagementVelocity = 1.0;
    else if (recentLogs < olderLogs) engagementVelocity = 0;

    // composite_index: weighted average
    const latencyScore = avgResponseLatency > 0
      ? Math.max(0, 1 - (avgResponseLatency / (7 * 24))) : 0.7;
    const composite = (
      latencyScore * 0.2 +
      meetingCommitmentRatio * 0.25 +
      milestoneCompletionRate * 0.3 +
      nextActionFollowthroughRate * 0.15 +
      engagementVelocity * 0.1
    ) * 100;

    const signals = {
      relationship_id: relationshipId,
      avg_response_latency_hours: parseFloat(avgResponseLatency.toFixed(2)),
      meeting_commitment_ratio: parseFloat(meetingCommitmentRatio.toFixed(3)),
      milestone_completion_rate: parseFloat(milestoneCompletionRate.toFixed(3)),
      next_action_followthrough_rate: parseFloat(nextActionFollowthroughRate.toFixed(3)),
      engagement_velocity: parseFloat(engagementVelocity.toFixed(3)),
      composite_index: parseFloat(Math.min(100, composite).toFixed(2)),
      computed_at: new Date().toISOString(),
    };

    // Upsert into behavioral_signals
    await query(
      `INSERT INTO behavioral_signals
         (relationship_id, avg_response_latency_hours, meeting_commitment_ratio,
          milestone_completion_rate, next_action_followthrough_rate,
          engagement_velocity, composite_index, computed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (relationship_id)
       DO UPDATE SET
         avg_response_latency_hours = EXCLUDED.avg_response_latency_hours,
         meeting_commitment_ratio = EXCLUDED.meeting_commitment_ratio,
         milestone_completion_rate = EXCLUDED.milestone_completion_rate,
         next_action_followthrough_rate = EXCLUDED.next_action_followthrough_rate,
         engagement_velocity = EXCLUDED.engagement_velocity,
         composite_index = EXCLUDED.composite_index,
         computed_at = NOW()`,
      [relationshipId, signals.avg_response_latency_hours, signals.meeting_commitment_ratio,
       signals.milestone_completion_rate, signals.next_action_followthrough_rate,
       signals.engagement_velocity, signals.composite_index]
    );

    // Also update engagement_index on relationships table
    await query(
      'UPDATE relationships SET engagement_index = $1 WHERE id = $2',
      [signals.composite_index, relationshipId]
    );

    return signals;
  } catch (err) {
    logger.error('Behavioral signals computation error:', err);
    throw err;
  }
}

async function getSignals(relationshipId) {
  const result = await query(
    'SELECT * FROM behavioral_signals WHERE relationship_id = $1',
    [relationshipId]
  );
  return result.rows[0] || null;
}

module.exports = { computeBehavioralSignals, getSignals };
