const { generateContent } = require('./geminiService');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

const OUTCOME_ANALYSIS_PROMPT = (relationship, outcome, historicalContext) => `
You are an ecosystem outcome analyst. Analyze this completed relationship and capture learnings.

RELATIONSHIP:
- Type: ${relationship.relationship_type}
- Match Score: ${relationship.match_score}/100
- Duration: Started ${relationship.started_at}, Ended ${relationship.ended_at || 'now'}
- Blueprint Used: ${relationship.blueprint_id ? 'Yes' : 'No'}

OUTCOME DATA:
- Funding Raised After: $${outcome.funding_raised_after || 0}
- Milestone Completion Rate: ${Math.round((outcome.milestone_completion_rate || 0) * 100)}%
- Mentor NPS: ${outcome.mentor_nps ?? 'N/A'}/10
- Programme Graduation: ${outcome.programme_graduation ? 'Yes' : 'No'}
- Overall Rating: ${outcome.overall_rating || 'N/A'}/5
- Key Wins: ${(outcome.key_wins || []).join(', ') || 'None listed'}
- Key Challenges: ${(outcome.key_challenges || []).join(', ') || 'None listed'}

${historicalContext ? `HISTORICAL CONTEXT:\n${historicalContext}` : ''}

Return ONLY valid JSON:
{
  "success_classification": "<high|medium|low>",
  "key_success_factors": ["<factor 1>", "<factor 2>"],
  "learning_points": ["<learning 1>", "<learning 2>"],
  "pattern_tags": ["<tag1>", "<tag2>"],
  "ai_summary": "<3-4 sentence outcome analysis>"
}
`;

async function captureOutcome(data) {
  const {
    relationship_id, funding_raised_after, milestone_completion_rate,
    mentor_nps, programme_graduation, key_wins, key_challenges, overall_rating
  } = data;

  const relResult = await query('SELECT * FROM relationships WHERE id = $1', [relationship_id]);
  if (!relResult.rows[0]) throw new Error('Relationship not found');
  const relationship = relResult.rows[0];

  // Build historical context from previous outcomes of similar type
  const histResult = await query(
    `SELECT ro.*, s.industry, s.stage
     FROM relationship_outcomes ro
     JOIN relationships r ON ro.relationship_id = r.id
     JOIN startups s ON ro.startup_id = s.id
     WHERE r.relationship_type = $1
     ORDER BY ro.captured_at DESC LIMIT 5`,
    [relationship.relationship_type]
  );
  let historicalContext = '';
  if (histResult.rows.length > 0) {
    const avg = histResult.rows.reduce((a, b) => a + (b.overall_rating || 3), 0) / histResult.rows.length;
    historicalContext = `Similar ${relationship.relationship_type} relationships had avg rating: ${avg.toFixed(1)}/5`;
  }

  const aiResult = await generateContent(
    OUTCOME_ANALYSIS_PROMPT(relationship, data, historicalContext),
    { mockType: 'outcome_analysis', temperature: 0.4 }
  );

  const result = await query(
    `INSERT INTO relationship_outcomes
       (relationship_id, startup_id, mentor_id, programme_id,
        funding_raised_after, milestone_completion_rate, mentor_nps,
        programme_graduation, key_wins, key_challenges, overall_rating,
        success_classification, key_success_factors, learning_points,
        pattern_tags, ai_summary)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [relationship_id, relationship.startup_id, relationship.mentor_id, relationship.programme_id,
     funding_raised_after || 0, milestone_completion_rate || 0, mentor_nps || null,
     programme_graduation || false, key_wins || [], key_challenges || [],
     overall_rating || null,
     aiResult.success_classification || 'medium',
     aiResult.key_success_factors || [],
     aiResult.learning_points || [],
     aiResult.pattern_tags || [],
     aiResult.ai_summary || 'Outcome analysis completed']
  );

  // Log lifecycle event
  await query(
    `INSERT INTO lifecycle_events (relationship_id, event_type, triggered_by, payload)
     VALUES ($1, 'outcome_captured', 'user', $2)`,
    [relationship_id, JSON.stringify({ overall_rating, success_classification: aiResult.success_classification })]
  );

  return result.rows[0];
}

async function getOutcomeInsights() {
  const outcomes = await query(
    `SELECT ro.*, r.relationship_type, s.industry, s.stage, s.country,
            u.full_name as mentor_name, m.expertise
     FROM relationship_outcomes ro
     JOIN relationships r ON ro.relationship_id = r.id
     LEFT JOIN startups s ON ro.startup_id = s.id
     LEFT JOIN mentors m ON ro.mentor_id = m.id
     LEFT JOIN users u ON m.user_id = u.id
     ORDER BY ro.captured_at DESC`
  );

  if (outcomes.rows.length === 0) {
    return {
      total_outcomes: 0,
      avg_rating: 0,
      high_success_rate: 0,
      top_industries: [],
      ai_insights: 'No outcomes captured yet. Complete relationships and capture outcomes to see insights.',
    };
  }

  const rows = outcomes.rows;
  const avgRating = rows.reduce((a, b) => a + (b.overall_rating || 3), 0) / rows.length;
  const highSuccess = rows.filter(r => r.success_classification === 'high').length;

  const industryMap = {};
  rows.forEach(r => {
    if (r.industry) {
      if (!industryMap[r.industry]) industryMap[r.industry] = { count: 0, totalRating: 0 };
      industryMap[r.industry].count++;
      industryMap[r.industry].totalRating += r.overall_rating || 3;
    }
  });
  const topIndustries = Object.entries(industryMap)
    .map(([industry, data]) => ({
      industry,
      count: data.count,
      avg_rating: parseFloat((data.totalRating / data.count).toFixed(1))
    }))
    .sort((a, b) => b.avg_rating - a.avg_rating)
    .slice(0, 5);

  const prompt = `
  Analyze these ecosystem outcome patterns and provide strategic insights.
  Total outcomes: ${rows.length}
  Average rating: ${avgRating.toFixed(1)}/5
  High success rate: ${Math.round((highSuccess / rows.length) * 100)}%
  Top industries by outcomes: ${topIndustries.map(i => `${i.industry}(${i.avg_rating}/5)`).join(', ')}

  Return ONLY valid JSON:
  {
    "headline": "<key insight headline>",
    "key_insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
    "patterns": ["<pattern 1>", "<pattern 2>"],
    "recommendations": ["<rec 1>", "<rec 2>"]
  }`;

  const aiInsights = await generateContent(prompt, { mockType: 'outcome_insights', temperature: 0.4 });

  return {
    total_outcomes: rows.length,
    avg_rating: parseFloat(avgRating.toFixed(1)),
    high_success_rate: parseFloat(((highSuccess / rows.length) * 100).toFixed(1)),
    top_industries: topIndustries,
    ai_insights: aiInsights,
  };
}

module.exports = { captureOutcome, getOutcomeInsights };
