/**
 * Agent Tool Endpoints
 *
 * These GET endpoints are called by the Vertex AI Agent Builder agent.
 * They are secured by the x-agent-key header (set in Agent Builder tool config).
 * Do NOT add JWT auth here — the agent cannot pass user tokens.
 */

const express = require('express');
const { query } = require('../db/connection');
const { matchMentorsForStartup, matchProgrammesForStartup } = require('../services/matchingService');
const { getDashboardOverview, getEcosystemInsights } = require('../services/analyticsService');
const logger = require('../utils/logger');

const router = express.Router();

// Validate agent key on all tool routes
router.use((req, res, next) => {
  const agentKey = process.env.AGENT_TOOLS_API_KEY;
  if (agentKey && req.headers['x-agent-key'] !== agentKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// GET /api/agent/tools/ecosystem-overview
router.get('/ecosystem-overview', async (req, res) => {
  try {
    const overview = await getDashboardOverview();
    res.json({
      total_startups: overview.stats.startups.total,
      verified_startups: overview.stats.startups.verified,
      avg_verification_score: parseFloat(overview.stats.startups.avg_score || 0).toFixed(1),
      high_risk_startups: overview.stats.startups.high_risk,
      total_mentors: overview.stats.mentors.total,
      available_mentors: overview.stats.mentors.available,
      avg_mentor_rating: parseFloat(overview.stats.mentors.avg_rating || 0).toFixed(1),
      total_programmes: overview.stats.programmes.total,
      open_programmes: overview.stats.programmes.open,
      ongoing_programmes: overview.stats.programmes.ongoing,
      total_relationships: overview.stats.relationships.total,
      active_relationships: overview.stats.relationships.active,
      ai_generated_matches: overview.stats.relationships.ai_generated,
      avg_match_score: parseFloat(overview.stats.relationships.avg_match_score || 0).toFixed(1),
      industry_distribution: overview.distributions.industry,
      recent_startups: overview.recent.startups,
    });
  } catch (err) {
    logger.error('Agent tool - ecosystem-overview error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/tools/startups?industry=&stage=&country=&limit=
router.get('/startups', async (req, res) => {
  try {
    const { industry, stage, country, limit = 10 } = req.query;
    let sql = `
      SELECT s.id, s.startup_name, s.industry, s.stage, s.country,
             s.description, s.verification_score, s.verification_status,
             s.risk_level, s.traction, s.funding_raised, s.created_at,
             u.full_name as founder_name
      FROM startups s
      JOIN users u ON s.user_id = u.id
      WHERE s.is_active = true
    `;
    const params = [];
    if (industry) { params.push(industry); sql += ` AND s.industry ILIKE $${params.length}`; }
    if (stage)    { params.push(stage);    sql += ` AND s.stage = $${params.length}`; }
    if (country)  { params.push(country);  sql += ` AND s.country ILIKE $${params.length}`; }
    params.push(Math.min(parseInt(limit), 20));
    sql += ` ORDER BY s.verification_score DESC LIMIT $${params.length}`;

    const result = await query(sql, params);
    res.json({ startups: result.rows, total: result.rows.length });
  } catch (err) {
    logger.error('Agent tool - startups error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/tools/mentors?availability=&limit=
router.get('/mentors', async (req, res) => {
  try {
    const { availability, limit = 10 } = req.query;
    let sql = `
      SELECT m.id, m.title, m.company, m.expertise, m.industries,
             m.years_experience, m.availability, m.rating, m.total_reviews,
             m.location, m.current_startups, m.max_startups,
             u.full_name, u.country
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      WHERE m.is_active = true
    `;
    const params = [];
    if (availability) { params.push(availability); sql += ` AND m.availability = $${params.length}`; }
    params.push(Math.min(parseInt(limit), 20));
    sql += ` ORDER BY m.rating DESC LIMIT $${params.length}`;

    const result = await query(sql, params);
    res.json({ mentors: result.rows, total: result.rows.length });
  } catch (err) {
    logger.error('Agent tool - mentors error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/tools/programmes?status=&limit=
router.get('/programmes', async (req, res) => {
  try {
    const { status, limit = 10 } = req.query;
    let sql = `
      SELECT id, programme_name, organizer, focus_area, country,
             duration_weeks, funding_offered, cohort_size, status,
             benefits, eligibility_criteria, deadline
      FROM programmes
      WHERE is_active = true
    `;
    const params = [];
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    params.push(Math.min(parseInt(limit), 20));
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    const result = await query(sql, params);
    res.json({ programmes: result.rows, total: result.rows.length });
  } catch (err) {
    logger.error('Agent tool - programmes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/tools/match-mentors?startup_id=&limit=
router.get('/match-mentors', async (req, res) => {
  try {
    const { startup_id, limit = 5 } = req.query;
    if (!startup_id) return res.status(400).json({ error: 'startup_id is required' });

    const matches = await matchMentorsForStartup(startup_id, parseInt(limit));
    res.json({ matches, total: matches.length });
  } catch (err) {
    logger.error('Agent tool - match-mentors error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/tools/match-programmes?startup_id=&limit=
router.get('/match-programmes', async (req, res) => {
  try {
    const { startup_id, limit = 5 } = req.query;
    if (!startup_id) return res.status(400).json({ error: 'startup_id is required' });

    const matches = await matchProgrammesForStartup(startup_id, parseInt(limit));
    res.json({ matches, total: matches.length });
  } catch (err) {
    logger.error('Agent tool - match-programmes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agent/tools/insights
router.get('/insights', async (req, res) => {
  try {
    const insights = await getEcosystemInsights();
    res.json(insights.insights || insights);
  } catch (err) {
    logger.error('Agent tool - insights error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
