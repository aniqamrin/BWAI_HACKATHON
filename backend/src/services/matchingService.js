const { generateContent } = require('./geminiService');
const { query } = require('../db/connection');
const { buildMentorMatchPrompt, buildProgrammeMatchPrompt } = require('../prompts/matchingPrompt');
const logger = require('../utils/logger');

async function matchMentorsForStartup(startupId, limit = 5) {
  try {
    const startupResult = await query('SELECT * FROM startups WHERE id = $1', [startupId]);
    if (!startupResult.rows[0]) throw new Error('Startup not found');
    const startup = startupResult.rows[0];

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

    const matchPromises = mentors.map(async (mentor) => {
      try {
        const prompt = buildMentorMatchPrompt(startup, mentor);
        const aiResult = await generateContent(prompt, {
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
        const prompt = buildProgrammeMatchPrompt(startup, programme);
        const aiResult = await generateContent(prompt, {
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
