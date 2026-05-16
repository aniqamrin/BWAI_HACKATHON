const { generateContent } = require('./geminiService');
const { query } = require('../db/connection');
const logger = require('../utils/logger');

const MENTOR_MATCH_PROMPT = (startup, mentor) => `
You are an expert ecosystem relationship manager specializing in startup-mentor matching for African innovation ecosystems.

Analyze the compatibility between this startup and mentor, and provide a detailed matching assessment.

STARTUP PROFILE:
- Name: ${startup.startup_name}
- Industry: ${startup.industry}
- Stage: ${startup.stage}
- Country: ${startup.country}
- Description: ${startup.description}
- Problem: ${startup.problem_statement || 'Not specified'}
- Traction: ${startup.traction || 'Not specified'}
- Verification Score: ${startup.verification_score}/100

MENTOR PROFILE:
- Name: ${mentor.full_name}
- Expertise: ${Array.isArray(mentor.expertise) ? mentor.expertise.join(', ') : mentor.expertise}
- Industries: ${Array.isArray(mentor.industries) ? mentor.industries.join(', ') : mentor.industries}
- Years Experience: ${mentor.years_experience}
- Location: ${mentor.location}
- Company: ${mentor.company}
- Title: ${mentor.title}
- Current Rating: ${mentor.rating}/5
- Availability: ${mentor.availability}

Return ONLY valid JSON:
{
  "compatibility_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "mentorship_quality": "<excellent|high|medium|low>",
  "expertise_relevance": <number 0-1>,
  "growth_potential_alignment": <number 0-1>,
  "geographic_synergy": <number 0-1>,
  "reasoning": "<2-3 sentence explanation of why this match works>",
  "recommended_focus_areas": ["<area 1>", "<area 2>", "<area 3>"],
  "potential_challenges": ["<challenge 1>"],
  "estimated_impact": "<High|Medium|Low> - <brief explanation>"
}
`;

const PROGRAMME_MATCH_PROMPT = (startup, programme) => `
Analyze the fit between this startup and accelerator programme.

STARTUP:
- Name: ${startup.startup_name}
- Industry: ${startup.industry}
- Stage: ${startup.stage}
- Country: ${startup.country}
- Description: ${startup.description}
- Verification Score: ${startup.verification_score}/100

PROGRAMME:
- Name: ${programme.programme_name}
- Focus Areas: ${Array.isArray(programme.focus_area) ? programme.focus_area.join(', ') : programme.focus_area}
- Country: ${programme.country}
- Duration: ${programme.duration_weeks} weeks
- Funding: $${programme.funding_offered}
- Status: ${programme.status}
- Benefits: ${Array.isArray(programme.benefits) ? programme.benefits.join(', ') : programme.benefits}

Return ONLY valid JSON:
{
  "fit_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "eligibility_assessment": "<eligible|likely_eligible|borderline|ineligible>",
  "alignment_factors": ["<factor 1>", "<factor 2>"],
  "gaps": ["<gap 1>"],
  "reasoning": "<2-3 sentence explanation>",
  "application_recommendation": "<strong_apply|apply|consider|skip>"
}
`;

async function matchMentorsForStartup(startupId, limit = 5) {
  try {
    // Get startup
    const startupResult = await query('SELECT * FROM startups WHERE id = $1', [startupId]);
    if (!startupResult.rows[0]) throw new Error('Startup not found');
    const startup = startupResult.rows[0];

    // Get available mentors
    const mentorsResult = await query(
      `SELECT m.*, u.full_name, u.email, u.country as user_country
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       WHERE m.availability != 'unavailable' AND m.is_active = true
       AND m.current_startups < m.max_startups
       ORDER BY m.rating DESC
       LIMIT 10`
    );

    const mentors = mentorsResult.rows;
    if (mentors.length === 0) return [];

    // Score each mentor with AI
    const matchPromises = mentors.map(async (mentor) => {
      try {
        const aiResult = await generateContent(MENTOR_MATCH_PROMPT(startup, mentor), {
          mockType: 'mentor_match',
          temperature: 0.3
        });

        return {
          mentor_id: mentor.id,
          mentor_name: mentor.full_name,
          mentor_title: mentor.title,
          mentor_company: mentor.company,
          mentor_location: mentor.location,
          mentor_expertise: mentor.expertise,
          mentor_industries: mentor.industries,
          mentor_rating: mentor.rating,
          mentor_availability: mentor.availability,
          years_experience: mentor.years_experience,
          compatibility_score: parseFloat(aiResult.compatibility_score) || 75,
          confidence_score: parseFloat(aiResult.confidence_score) || 70,
          mentorship_quality: aiResult.mentorship_quality || 'medium',
          expertise_relevance: aiResult.expertise_relevance || 0.7,
          reasoning: aiResult.reasoning || 'Good potential match based on industry alignment',
          recommended_focus_areas: aiResult.recommended_focus_areas || [],
          estimated_impact: aiResult.estimated_impact || 'Medium impact expected'
        };
      } catch (err) {
        logger.error(`Error matching mentor ${mentor.id}:`, err);
        return null;
      }
    });

    const results = (await Promise.all(matchPromises)).filter(Boolean);

    // Sort by compatibility score
    results.sort((a, b) => b.compatibility_score - a.compatibility_score);

    return results.slice(0, limit);
  } catch (error) {
    logger.error('Mentor matching error:', error);
    throw error;
  }
}

async function matchProgrammesForStartup(startupId, limit = 5) {
  try {
    const startupResult = await query('SELECT * FROM startups WHERE id = $1', [startupId]);
    if (!startupResult.rows[0]) throw new Error('Startup not found');
    const startup = startupResult.rows[0];

    const programmesResult = await query(
      `SELECT * FROM programmes WHERE status IN ('open', 'ongoing') AND is_active = true LIMIT 10`
    );

    const programmes = programmesResult.rows;
    if (programmes.length === 0) return [];

    const matchPromises = programmes.map(async (programme) => {
      try {
        const aiResult = await generateContent(PROGRAMME_MATCH_PROMPT(startup, programme), {
          mockType: 'mentor_match',
          temperature: 0.3
        });

        return {
          programme_id: programme.id,
          programme_name: programme.programme_name,
          organizer: programme.organizer,
          country: programme.country,
          focus_area: programme.focus_area,
          duration_weeks: programme.duration_weeks,
          funding_offered: programme.funding_offered,
          status: programme.status,
          benefits: programme.benefits,
          fit_score: parseFloat(aiResult.fit_score || aiResult.compatibility_score) || 70,
          confidence_score: parseFloat(aiResult.confidence_score) || 65,
          eligibility_assessment: aiResult.eligibility_assessment || 'likely_eligible',
          reasoning: aiResult.reasoning || 'Good programme fit based on industry and stage alignment',
          application_recommendation: aiResult.application_recommendation || 'apply'
        };
      } catch (err) {
        logger.error(`Error matching programme ${programme.id}:`, err);
        return null;
      }
    });

    const results = (await Promise.all(matchPromises)).filter(Boolean);
    results.sort((a, b) => b.fit_score - a.fit_score);
    return results.slice(0, limit);
  } catch (error) {
    logger.error('Programme matching error:', error);
    throw error;
  }
}

module.exports = { matchMentorsForStartup, matchProgrammesForStartup };
