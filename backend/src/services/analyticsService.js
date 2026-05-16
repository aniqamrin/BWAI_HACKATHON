const { generateContent } = require('./geminiService');
const { query } = require('../db/connection');
const { buildEcosystemInsightPrompt } = require('../prompts/relationshipPrompt');
const logger = require('../utils/logger');

async function getDashboardOverview() {
  try {
    const [
      startupStats, mentorStats, programmeStats, relationshipStats,
      recentStartups, recentRelationships, verificationDist, industryDist
    ] = await Promise.all([
      query(`SELECT 
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE verification_status = 'verified') as verified,
               AVG(verification_score) as avg_score,
               COUNT(*) FILTER (WHERE risk_level = 'low') as low_risk,
               COUNT(*) FILTER (WHERE risk_level = 'high' OR risk_level = 'critical') as high_risk
             FROM startups WHERE is_active = true`),
      query(`SELECT 
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE availability = 'available') as available,
               AVG(rating) as avg_rating
             FROM mentors WHERE is_active = true`),
      query(`SELECT 
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'open') as open,
               COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing
             FROM programmes WHERE is_active = true`),
      query(`SELECT 
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'active') as active,
               COUNT(*) FILTER (WHERE ai_generated = true) as ai_generated,
               AVG(match_score) as avg_match_score,
               COUNT(*) FILTER (WHERE engagement_health = 'excellent') as excellent_health
             FROM relationships`),
      query(`SELECT s.id, s.startup_name, s.industry, s.stage, s.verification_score, 
               s.risk_level, s.created_at, u.full_name as founder_name
             FROM startups s JOIN users u ON s.user_id = u.id
             WHERE s.is_active = true ORDER BY s.created_at DESC LIMIT 5`),
      query(`SELECT r.id, r.relationship_type, r.match_score, r.engagement_health, r.status,
               r.created_at, s.startup_name,
               u_m.full_name as mentor_name, p.programme_name, i.firm_name as investor_name
             FROM relationships r
             LEFT JOIN startups s ON r.startup_id = s.id
             LEFT JOIN mentors m ON r.mentor_id = m.id
             LEFT JOIN users u_m ON m.user_id = u_m.id
             LEFT JOIN programmes p ON r.programme_id = p.id
             LEFT JOIN investors i ON r.investor_id = i.id
             ORDER BY r.created_at DESC LIMIT 5`),
      query(`SELECT verification_status, COUNT(*) as count FROM startups GROUP BY verification_status`),
      query(`SELECT industry, COUNT(*) as count FROM startups WHERE industry IS NOT NULL GROUP BY industry ORDER BY count DESC LIMIT 8`)
    ]);

    return {
      stats: {
        startups: startupStats.rows[0],
        mentors: mentorStats.rows[0],
        programmes: programmeStats.rows[0],
        relationships: relationshipStats.rows[0]
      },
      recent: {
        startups: recentStartups.rows,
        relationships: recentRelationships.rows
      },
      distributions: {
        verification: verificationDist.rows,
        industry: industryDist.rows
      }
    };
  } catch (error) {
    logger.error('Dashboard overview error:', error);
    throw error;
  }
}

async function getEcosystemInsights() {
  try {
    const overview = await getDashboardOverview();

    const prompt = buildEcosystemInsightPrompt({
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
      excellent_health_count: overview.stats.relationships.excellent_health,
      industry_distribution: overview.distributions.industry.map(i => `${i.industry}(${i.count})`).join(', ')
    });

    const insights = await generateContent(prompt, {
      mockType: 'ecosystem_insights',
      temperature: 0.4
    });

    return { ...overview, insights };
  } catch (error) {
    logger.error('Ecosystem insights error:', error);
    throw error;
  }
}

async function getAnalyticsSummary() {
  try {
    const [monthlyGrowth, topStartups, engagementTrend] = await Promise.all([
      query(`SELECT 
               DATE_TRUNC('month', created_at) as month,
               COUNT(*) as startups_added
             FROM startups 
             WHERE created_at > NOW() - INTERVAL '6 months'
             GROUP BY month ORDER BY month`),
      query(`SELECT startup_name, verification_score, industry, stage, risk_level
             FROM startups WHERE is_active = true
             ORDER BY verification_score DESC LIMIT 5`),
      query(`SELECT 
               DATE_TRUNC('week', created_at) as week,
               COUNT(*) as engagements
             FROM engagement_logs
             WHERE created_at > NOW() - INTERVAL '8 weeks'
             GROUP BY week ORDER BY week`)
    ]);

    return {
      monthly_growth: monthlyGrowth.rows,
      top_startups: topStartups.rows,
      engagement_trend: engagementTrend.rows
    };
  } catch (error) {
    logger.error('Analytics summary error:', error);
    throw error;
  }
}

module.exports = { getDashboardOverview, getEcosystemInsights, getAnalyticsSummary };
