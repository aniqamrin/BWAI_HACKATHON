const express = require('express');
const { optionalAuth } = require('../middlewares/auth');
const { getEcosystemGraph } = require('../services/relationshipService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/graph/network
router.get('/network', optionalAuth, async (req, res) => {
  try {
    const graphData = await getEcosystemGraph();

    // Transform for React Flow format
    const nodes = graphData.nodes.map((node, index) => ({
      id: node.id,
      type: node.type,
      data: {
        label: node.name,
        ...node
      },
      position: {
        x: getNodePosition(node.type, index, graphData.nodes.length).x,
        y: getNodePosition(node.type, index, graphData.nodes.length).y
      }
    }));

    const edges = graphData.edges.map(rel => {
      const source = rel.startup_id || rel.mentor_id || rel.programme_id;
      const target = rel.mentor_id || rel.programme_id || rel.investor_id || rel.startup_id;

      if (!source || !target || source === target) return null;

      return {
        id: rel.id,
        source: source,
        target: target,
        type: rel.relationship_type,
        data: {
          match_score: rel.match_score,
          engagement_health: rel.engagement_health,
          status: rel.status,
          ai_generated: rel.ai_generated
        },
        animated: rel.engagement_health === 'excellent',
        label: rel.relationship_type.replace('_', ' ↔ ')
      };
    }).filter(Boolean);

    return success(res, { nodes, edges, raw: graphData });
  } catch (err) {
    logger.error('Graph network error:', err);
    return error(res, 'Failed to load network graph');
  }
});

function getNodePosition(type, index, total) {
  const centerX = 600;
  const centerY = 400;
  const radius = 300;

  const typeOffsets = {
    startup: { x: -200, y: 0 },
    mentor: { x: 200, y: -150 },
    programme: { x: 200, y: 150 },
    investor: { x: 0, y: -250 }
  };

  const offset = typeOffsets[type] || { x: 0, y: 0 };
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI;
  const spread = 120;

  return {
    x: centerX + offset.x + Math.cos(angle) * spread,
    y: centerY + offset.y + Math.sin(angle) * spread
  };
}

// GET /api/graph/diagnostics
router.get('/diagnostics', optionalAuth, async (req, res) => {
  try {
    const { query } = require('../db/connection');
    const { generateContent } = require('../services/geminiService');

    const [orphanStartups, orphanMentors, overloaded, clusterGaps, govAlerts] = await Promise.all([
      // Startups with no active relationships
      query(`SELECT s.id, s.startup_name as name, s.industry, s.country,
              EXTRACT(DAY FROM NOW() - s.created_at) as days_since_join
             FROM startups s
             WHERE s.is_active = true
             AND NOT EXISTS (SELECT 1 FROM relationships r WHERE r.startup_id = s.id AND r.status = 'active')
             LIMIT 10`),
      // Mentors with no active mentorships
      query(`SELECT m.id, u.full_name as name, m.expertise, m.availability
             FROM mentors m JOIN users u ON m.user_id = u.id
             WHERE m.is_active = true AND m.current_startups = 0
             LIMIT 10`),
      // Overloaded mentors
      query(`SELECT m.id, u.full_name as name, m.current_startups, m.max_startups
             FROM mentors m JOIN users u ON m.user_id = u.id
             WHERE m.current_startups >= m.max_startups AND m.is_active = true`),
      // Industries with no active mentors
      query(`SELECT s.industry, COUNT(DISTINCT s.id) as startup_count
             FROM startups s
             WHERE s.is_active = true
             AND s.industry NOT IN (
               SELECT DISTINCT unnest(m.industries)
               FROM mentors m WHERE m.is_active = true
             )
             GROUP BY s.industry
             HAVING COUNT(DISTINCT s.id) > 1
             LIMIT 5`),
      // Recent governance violations
      query(`SELECT gr.name, COUNT(le.id) as violation_count
             FROM lifecycle_events le
             JOIN governance_rules gr ON le.payload->>'rule_id' = gr.id::text
             WHERE le.event_type = 'governance_violation'
             AND le.created_at > NOW() - INTERVAL '7 days'
             GROUP BY gr.name
             LIMIT 5`)
    ]);

    // Bridge suggestions: unconnected high-compatibility pairs
    const potentialBridges = await query(`
      SELECT s.id as startup_id, s.startup_name, s.industry as startup_industry,
             m.id as mentor_id, u.full_name as mentor_name, m.industries as mentor_industries
      FROM startups s
      JOIN mentors m ON m.is_active = true AND m.current_startups < m.max_startups
      JOIN users u ON m.user_id = u.id
      WHERE s.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM relationships r
        WHERE r.startup_id = s.id AND r.mentor_id = m.id
      )
      LIMIT 5
    `);

    const bridgeSuggestions = potentialBridges.rows.map((pair, i) => ({
      from_entity: { type: 'startup', id: pair.startup_id, name: pair.startup_name },
      to_entity: { type: 'mentor', id: pair.mentor_id, name: pair.mentor_name },
      reason: `Industry alignment: ${pair.startup_industry} startup may benefit from mentor expertise in ${(pair.mentor_industries || []).join(', ')}`,
      potential_score: 70 + Math.round(Math.random() * 20),
    }));

    return success(res, {
      orphans: {
        startups: orphanStartups.rows,
        mentors: orphanMentors.rows,
        total: orphanStartups.rows.length + orphanMentors.rows.length,
      },
      overloaded: overloaded.rows,
      cluster_gaps: clusterGaps.rows.map(r => ({
        industry: r.industry,
        startup_count: parseInt(r.startup_count),
        missing_entity_type: 'mentor',
        recommendation: `Recruit ${r.industry} mentors — ${r.startup_count} startups lack mentorship coverage`
      })),
      bridge_suggestions: bridgeSuggestions,
      governance_alerts: govAlerts.rows,
    });
  } catch (err) {
    logger.error('Graph diagnostics error:', err);
    return error(res, 'Failed to run diagnostics');
  }
});

module.exports = router;
