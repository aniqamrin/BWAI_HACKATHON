const { generateContent } = require('./geminiService');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

const VERIFICATION_PROMPT = (startup) => `
You are an expert startup analyst and due diligence specialist for an African innovation ecosystem platform.

Analyze this startup profile and provide a comprehensive verification assessment.

STARTUP PROFILE:
- Name: ${startup.startup_name}
- Description: ${startup.description || 'Not provided'}
- Industry: ${startup.industry || 'Not specified'}
- Stage: ${startup.stage || 'Not specified'}
- Country: ${startup.country || 'Not specified'}
- Team Size: ${startup.team_size || 'Not specified'}
- Founded Year: ${startup.founded_year || 'Not specified'}
- Problem Statement: ${startup.problem_statement || 'Not provided'}
- Solution: ${startup.solution || 'Not provided'}
- Traction: ${startup.traction || 'Not provided'}
- Revenue Model: ${startup.revenue_model || 'Not provided'}
- Funding Raised: $${startup.funding_raised || 0}
- Website: ${startup.website || 'Not provided'}

Analyze and return ONLY valid JSON with this exact structure:
{
  "verification_score": <number 0-100>,
  "risk_level": "<low|medium|high|critical>",
  "industry_classification": "<specific industry category>",
  "stage_classification": "<idea|pre-seed|seed|series-a|series-b|growth|mature>",
  "legitimacy_score": <number 0-100>,
  "confidence_level": <number 0-1>,
  "risk_factors": ["<risk 1>", "<risk 2>"],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "ai_summary": "<2-3 sentence comprehensive assessment>"
}

Scoring criteria:
- verification_score: Overall legitimacy and viability (0-100)
- risk_level: low (<30% risk), medium (30-60%), high (60-80%), critical (>80%)
- Consider: team quality, market size, traction, business model clarity, competitive landscape
`;

async function verifyStartup(startupId) {
  try {
    // Fetch startup data
    const result = await query(
      `SELECT s.*, u.full_name, u.email 
       FROM startups s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = $1`,
      [startupId]
    );

    if (!result.rows[0]) {
      throw new Error('Startup not found');
    }

    const startup = result.rows[0];

    // Call Gemini AI
    const aiResult = await generateContent(VERIFICATION_PROMPT(startup), {
      mockType: 'verification',
      temperature: 0.2
    });

    // Normalize scores
    const verificationScore = Math.min(100, Math.max(0, parseFloat(aiResult.verification_score) || 70));
    const riskLevel = ['low', 'medium', 'high', 'critical'].includes(aiResult.risk_level)
      ? aiResult.risk_level : 'medium';

    // Save verification attempt
    await query(
      `INSERT INTO verification_attempts 
       (startup_id, verification_score, risk_level, ai_summary, industry_classification, 
        stage_classification, risk_factors, strengths, recommendations, raw_response)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        startupId,
        verificationScore,
        riskLevel,
        aiResult.ai_summary,
        aiResult.industry_classification,
        aiResult.stage_classification,
        aiResult.risk_factors || [],
        aiResult.strengths || [],
        aiResult.recommendations || [],
        JSON.stringify(aiResult)
      ]
    );

    // Update startup record
    await query(
      `UPDATE startups 
       SET verification_score = $1, risk_level = $2, ai_summary = $3, 
           verification_status = 'verified', updated_at = NOW()
       WHERE id = $4`,
      [verificationScore, riskLevel, aiResult.ai_summary, startupId]
    );

    logger.info(`Startup ${startupId} verified with score ${verificationScore}`);

    return {
      startup_id: startupId,
      startup_name: startup.startup_name,
      verification_score: verificationScore,
      risk_level: riskLevel,
      industry_classification: aiResult.industry_classification,
      stage_classification: aiResult.stage_classification,
      legitimacy_score: aiResult.legitimacy_score,
      confidence_level: aiResult.confidence_level,
      risk_factors: aiResult.risk_factors || [],
      strengths: aiResult.strengths || [],
      recommendations: aiResult.recommendations || [],
      ai_summary: aiResult.ai_summary
    };
  } catch (error) {
    logger.error('Verification error:', error);
    throw error;
  }
}

module.exports = { verifyStartup };
