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

module.exports = router;
