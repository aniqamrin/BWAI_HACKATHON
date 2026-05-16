const { generateContent } = require('./geminiService');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

const HEALTH_ANALYSIS_PROMPT = (relationship, logs) => `
You are an ecosystem relationship health analyst. Analyze this relationship and its engagement history.

RELATIONSHIP:
- Type: ${relationship.relationship_type}
- Status: ${relationship.status}
- Match Score: ${relationship.match_score}/100
- Current Health: ${relationship.engagement_health}
- Created: ${relationship.created_at}
- AI Generated: ${relationship.ai_generated}

RECENT ENGAGEMENT LOGS (last 10):
${logs.length > 0 ? logs.map(l => `- ${l.activity_type}: ${l.notes} (${l.created_at})`).join('\n') : 'No engagement logs yet'}

Return ONLY valid JSON:
{
  "engagement_health": "<excellent|good|fair|poor|inactive>",
  "health_score": <number 0-100>,
  "risk_of_inactivity": "<low|medium|high>",
  "momentum_indicators": ["<indicator 1>", "<indicator 2>"],
  "recommended_next_actions": ["<action 1>", "<action 2>", "<action 3>"],
  "intervention_suggestions": ["<suggestion if needed>"],
  "ai_summary": "<2-3 sentence health assessment>"
}
`;

async function analyzeRelationshipHealth(relationshipId) {
  try {
    const relResult = await query('SELECT * FROM relationships WHERE id = $1', [relationshipId]);
    if (!relResult.rows[0]) throw new Error('Relationship not found');
    const relationship = relResult.rows[0];

    const logsResult = await query(
      'SELECT * FROM engagement_logs WHERE relationship_id = $1 ORDER BY created_at DESC LIMIT 10',
      [relationshipId]
    );

    const aiResult = await generateContent(
      HEALTH_ANALYSIS_PROMPT(relationship, logsResult.rows),
      { mockType: 'relationship_health', temperature: 0.3 }
    );

    const health = ['excellent', 'good', 'fair', 'poor', 'inactive'].includes(aiResult.engagement_health)
      ? aiResult.engagement_health : 'fair';

    // Update relationship health
    await query(
      `UPDATE relationships SET engagement_health = $1, next_action = $2, updated_at = NOW() WHERE id = $3`,
      [health, aiResult.recommended_next_actions?.[0] || null, relationshipId]
    );

    return {
      relationship_id: relationshipId,
      engagement_health: health,
      health_score: aiResult.health_score || 70,
      risk_of_inactivity: aiResult.risk_of_inactivity || 'low',
      momentum_indicators: aiResult.momentum_indicators || [],
      recommended_next_actions: aiResult.recommended_next_actions || [],
      intervention_suggestions: aiResult.intervention_suggestions || [],
      ai_summary: aiResult.ai_summary || 'Relationship health analysis completed'
    };
  } catch (error) {
    logger.error('Relationship health analysis error:', error);
    throw error;
  }
}

async function createRelationship(data) {
  const {
    relationship_type, startup_id, mentor_id, programme_id, investor_id,
    match_score, confidence_score, ai_generated, ai_reasoning, notes
  } = data;

  const result = await query(
    `INSERT INTO relationships 
     (relationship_type, startup_id, mentor_id, programme_id, investor_id,
      match_score, confidence_score, ai_generated, ai_reasoning, notes, status, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW())
     RETURNING *`,
    [relationship_type, startup_id, mentor_id, programme_id, investor_id,
     match_score || 0, confidence_score || 0, ai_generated || false, ai_reasoning, notes]
  );

  // Update mentor's current_startups count if mentor_startup relationship
  if (relationship_type === 'mentor_startup' && mentor_id) {
    await query(
      'UPDATE mentors SET current_startups = current_startups + 1 WHERE id = $1',
      [mentor_id]
    );
  }

  return result.rows[0];
}

async function getEcosystemGraph() {
  try {
    const [startups, mentors, programmes, investors, relationships] = await Promise.all([
      query(`SELECT s.id, s.startup_name as name, s.industry, s.stage, s.country, 
              s.verification_score, s.risk_level, 'startup' as type
             FROM startups s WHERE s.is_active = true`),
      query(`SELECT m.id, u.full_name as name, m.expertise, m.industries, 
              m.rating, m.availability, 'mentor' as type
             FROM mentors m JOIN users u ON m.user_id = u.id WHERE m.is_active = true`),
      query(`SELECT p.id, p.programme_name as name, p.country, p.focus_area, 
              p.status, 'programme' as type
             FROM programmes p WHERE p.is_active = true`),
      query(`SELECT i.id, i.firm_name as name, i.focus_industries, 
              i.investment_stages, 'investor' as type
             FROM investors i WHERE i.is_active = true`),
      query(`SELECT r.*, 
              s.startup_name,
              u_m.full_name as mentor_name,
              p.programme_name,
              i.firm_name as investor_name
             FROM relationships r
             LEFT JOIN startups s ON r.startup_id = s.id
             LEFT JOIN mentors m ON r.mentor_id = m.id
             LEFT JOIN users u_m ON m.user_id = u_m.id
             LEFT JOIN programmes p ON r.programme_id = p.id
             LEFT JOIN investors i ON r.investor_id = i.id
             WHERE r.status = 'active'`)
    ]);

    return {
      nodes: [
        ...startups.rows,
        ...mentors.rows,
        ...programmes.rows,
        ...investors.rows
      ],
      edges: relationships.rows
    };
  } catch (error) {
    logger.error('Graph data error:', error);
    throw error;
  }
}

module.exports = { analyzeRelationshipHealth, createRelationship, getEcosystemGraph };
