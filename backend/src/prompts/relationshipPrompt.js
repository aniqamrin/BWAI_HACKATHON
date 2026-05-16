/**
 * AI Prompts: Relationship Health & Ecosystem Intelligence
 */

const buildHealthPrompt = (relationship, logs) => `
You are an ecosystem relationship health analyst for an African innovation platform.

Analyze this relationship and its engagement history to assess health and recommend actions.

RELATIONSHIP:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type:             ${relationship.relationship_type}
Status:           ${relationship.status}
Match Score:      ${relationship.match_score}/100
Confidence:       ${relationship.confidence_score}/100
Current Health:   ${relationship.engagement_health}
AI Generated:     ${relationship.ai_generated}
Created:          ${relationship.created_at}
Last Updated:     ${relationship.updated_at}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENGAGEMENT HISTORY (last 10 activities):
${logs.length > 0
  ? logs.map(l => `[${new Date(l.created_at).toLocaleDateString()}] ${l.activity_type}: ${l.notes || 'No notes'} ${l.outcome ? `→ ${l.outcome}` : ''}`).join('\n')
  : 'No engagement logs recorded yet'
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON:
{
  "engagement_health": "<excellent|good|fair|poor|inactive>",
  "health_score": <number 0-100>,
  "risk_of_inactivity": "<low|medium|high>",
  "momentum_indicators": ["<positive indicator 1>", "<indicator 2>"],
  "recommended_next_actions": ["<specific action 1>", "<action 2>", "<action 3>"],
  "intervention_suggestions": ["<intervention if health is poor>"],
  "time_to_next_touchpoint": "<recommended days until next interaction>",
  "ai_summary": "<2-3 sentence health assessment with specific observations>"
}
`;

const buildEcosystemInsightPrompt = (data) => `
You are a strategic ecosystem intelligence analyst for an African innovation platform.

Analyze this ecosystem data snapshot and generate actionable strategic insights.

ECOSYSTEM SNAPSHOT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Startups:        ${data.total_startups}
Verified Startups:     ${data.verified_startups}
Avg Verification Score: ${data.avg_verification_score}
High Risk Startups:    ${data.high_risk_startups}

Total Mentors:         ${data.total_mentors}
Available Mentors:     ${data.available_mentors}
Avg Mentor Rating:     ${data.avg_mentor_rating}

Total Programmes:      ${data.total_programmes}
Open Programmes:       ${data.open_programmes}
Ongoing Programmes:    ${data.ongoing_programmes}

Total Relationships:   ${data.total_relationships}
Active Relationships:  ${data.active_relationships}
AI-Generated Matches:  ${data.ai_generated_matches}
Avg Match Score:       ${data.avg_match_score}
Excellent Health:      ${data.excellent_health_count}

Industry Distribution: ${data.industry_distribution}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON:
{
  "ecosystem_health_score": <number 0-100>,
  "growth_trajectory": "<accelerating|stable|declining>",
  "headline": "<one compelling, specific headline about the ecosystem state>",
  "key_insights": [
    "<specific data-driven insight 1>",
    "<insight 2>",
    "<insight 3>",
    "<insight 4>"
  ],
  "opportunities": [
    "<specific opportunity 1>",
    "<opportunity 2>",
    "<opportunity 3>"
  ],
  "risks": [
    "<specific risk 1>",
    "<risk 2>"
  ],
  "recommendations": [
    "<actionable recommendation 1>",
    "<recommendation 2>",
    "<recommendation 3>"
  ]
}
`;

module.exports = { buildHealthPrompt, buildEcosystemInsightPrompt };
