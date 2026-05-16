/**
 * AI Prompts: Mentor Matching & Programme Matching
 * Uses Gemini to score compatibility between ecosystem entities
 */

const buildMentorMatchPrompt = (startup, mentor, historicalContext = '') => `
You are an expert ecosystem relationship manager specializing in startup-mentor matching for African innovation ecosystems.

Analyze the compatibility between this startup and mentor. Consider industry alignment, experience relevance, geographic synergy, and growth stage fit.

STARTUP PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:             ${startup.startup_name}
Industry:         ${startup.industry}
Stage:            ${startup.stage}
Country:          ${startup.country}
Description:      ${startup.description}
Problem:          ${startup.problem_statement || 'Not specified'}
Traction:         ${startup.traction || 'Not specified'}
Verification:     ${startup.verification_score}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MENTOR PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:             ${mentor.full_name}
Title:            ${mentor.title || 'Not specified'}
Company:          ${mentor.company || 'Not specified'}
Expertise:        ${Array.isArray(mentor.expertise) ? mentor.expertise.join(', ') : mentor.expertise}
Industries:       ${Array.isArray(mentor.industries) ? mentor.industries.join(', ') : mentor.industries}
Experience:       ${mentor.years_experience} years
Location:         ${mentor.location || 'Not specified'}
Rating:           ${mentor.rating}/5 (${mentor.total_reviews} reviews)
Availability:     ${mentor.availability}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${historicalContext ? `\nHISTORICAL OUTCOME DATA:\n${historicalContext}\n` : ''}
Return ONLY valid JSON:
{
  "compatibility_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "mentorship_quality": "<excellent|high|medium|low>",
  "expertise_relevance": <number 0-1>,
  "growth_potential_alignment": <number 0-1>,
  "geographic_synergy": <number 0-1>,
  "reasoning": "<2-3 sentence explanation of why this match works or doesn't>",
  "recommended_focus_areas": ["<area 1>", "<area 2>", "<area 3>"],
  "potential_challenges": ["<challenge if any>"],
  "estimated_impact": "<High|Medium|Low> - <brief explanation of expected impact>"
}
`;

const buildProgrammeMatchPrompt = (startup, programme) => `
You are an expert accelerator programme advisor for African innovation ecosystems.

Analyze the fit between this startup and accelerator programme. Consider industry alignment, stage eligibility, geographic focus, and strategic benefit.

STARTUP PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:             ${startup.startup_name}
Industry:         ${startup.industry}
Stage:            ${startup.stage}
Country:          ${startup.country}
Description:      ${startup.description}
Traction:         ${startup.traction || 'Not specified'}
Funding Raised:   $${startup.funding_raised || 0}
Verification:     ${startup.verification_score}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROGRAMME PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:             ${programme.programme_name}
Organizer:        ${programme.organizer || 'Not specified'}
Focus Areas:      ${Array.isArray(programme.focus_area) ? programme.focus_area.join(', ') : programme.focus_area}
Country:          ${programme.country}
Duration:         ${programme.duration_weeks} weeks
Funding:          $${programme.funding_offered || 0}
Cohort Size:      ${programme.cohort_size}
Status:           ${programme.status}
Benefits:         ${Array.isArray(programme.benefits) ? programme.benefits.join(', ') : programme.benefits}
Eligibility:      ${programme.eligibility_criteria || 'Not specified'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY valid JSON:
{
  "fit_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "eligibility_assessment": "<eligible|likely_eligible|borderline|ineligible>",
  "alignment_factors": ["<factor 1>", "<factor 2>"],
  "gaps": ["<gap 1 if any>"],
  "reasoning": "<2-3 sentence explanation of fit>",
  "application_recommendation": "<strong_apply|apply|consider|skip>",
  "strategic_benefit": "<key benefit this programme offers this specific startup>"
}
`;

const buildInvestorMatchPrompt = (startup, investor) => `
You are an expert venture capital analyst for African innovation ecosystems.

Analyze the investment fit between this startup and investor.

STARTUP:
Name: ${startup.startup_name}, Industry: ${startup.industry}, Stage: ${startup.stage}
Description: ${startup.description}
Funding Raised: $${startup.funding_raised || 0}, Seeking: $${startup.funding_needed || 'Not specified'}
Traction: ${startup.traction || 'Not specified'}

INVESTOR:
Firm: ${investor.firm_name}, Thesis: ${investor.investment_thesis}
Focus: ${Array.isArray(investor.focus_industries) ? investor.focus_industries.join(', ') : investor.focus_industries}
Stages: ${Array.isArray(investor.investment_stages) ? investor.investment_stages.join(', ') : investor.investment_stages}
Ticket: $${investor.ticket_size_min || 0} - $${investor.ticket_size_max || 0}

Return ONLY valid JSON:
{
  "fit_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "thesis_alignment": <number 0-1>,
  "stage_fit": "<perfect|good|borderline|mismatch>",
  "ticket_fit": "<within_range|below_range|above_range>",
  "reasoning": "<2-3 sentence explanation>",
  "recommendation": "<strong_pitch|pitch|explore|skip>"
}
`;

module.exports = { buildMentorMatchPrompt, buildProgrammeMatchPrompt, buildInvestorMatchPrompt };
