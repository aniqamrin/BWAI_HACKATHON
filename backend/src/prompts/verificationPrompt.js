/**
 * AI Prompt: Startup Verification
 * Uses Gemini to analyze startup legitimacy, risk, and strategic fit
 */

const buildVerificationPrompt = (startup) => `
You are an expert startup analyst and due diligence specialist for an African innovation ecosystem platform.

Analyze this startup profile comprehensively and provide a structured verification assessment.

STARTUP PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:             ${startup.startup_name}
Description:      ${startup.description || 'Not provided'}
Industry:         ${startup.industry || 'Not specified'}
Stage:            ${startup.stage || 'Not specified'}
Country:          ${startup.country || 'Not specified'}
Team Size:        ${startup.team_size || 'Not specified'}
Founded Year:     ${startup.founded_year || 'Not specified'}
Website:          ${startup.website || 'Not provided'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Problem:          ${startup.problem_statement || 'Not provided'}
Solution:         ${startup.solution || 'Not provided'}
Revenue Model:    ${startup.revenue_model || 'Not provided'}
Target Market:    ${startup.target_market || 'Not provided'}
Traction:         ${startup.traction || 'Not provided'}
Funding Raised:   $${startup.funding_raised || 0}
Funding Needed:   $${startup.funding_needed || 'Not specified'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SCORING CRITERIA:
- verification_score (0-100): Overall legitimacy, viability, and investment readiness
- risk_level: low (<30% risk indicators), medium (30-60%), high (60-80%), critical (>80%)
- Consider: team quality, market size, traction evidence, business model clarity, competitive landscape, African market context

Return ONLY valid JSON with this exact structure:
{
  "verification_score": <number 0-100>,
  "risk_level": "<low|medium|high|critical>",
  "industry_classification": "<specific industry category>",
  "stage_classification": "<idea|pre-seed|seed|series-a|series-b|growth|mature>",
  "legitimacy_score": <number 0-100>,
  "confidence_level": <number 0-1>,
  "risk_factors": ["<specific risk 1>", "<specific risk 2>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "recommendations": ["<actionable recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "market_opportunity": "<brief market size assessment>",
  "competitive_advantage": "<key differentiator identified>",
  "ai_summary": "<2-3 sentence comprehensive assessment focusing on viability and potential>"
}
`;

module.exports = { buildVerificationPrompt };
