const { generateContent } = require('./geminiService');
const { query } = require('../db/connection');
const { buildMentorMatchPrompt, buildProgrammeMatchPrompt, buildInvestorMatchPrompt } = require('../prompts/matchingPrompt');
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

    // Build outcome feedback context for each mentor
    const outcomeContextMap = {};
    await Promise.all(mentors.map(async (mentor) => {
      try {
        const res = await query(
          `SELECT AVG(ro.overall_rating) as avg_rating, COUNT(*) as total,
                  AVG(ro.funding_raised_after) as avg_funding
           FROM relationship_outcomes ro
           JOIN relationships r ON ro.relationship_id = r.id
           JOIN startups s ON ro.startup_id = s.id
           WHERE r.mentor_id = $1 AND s.industry = $2`,
          [mentor.id, startup.industry]
        );
        if (res.rows[0]?.avg_rating) {
          outcomeContextMap[mentor.id] = `Historical: avg ${parseFloat(res.rows[0].avg_rating).toFixed(1)}/5 rating across ${res.rows[0].total} past mentorships in ${startup.industry}`;
        }
      } catch (_) {}
    }));

    const matchPromises = mentors.map(async (mentor) => {
      try {
        const historicalNote = outcomeContextMap[mentor.id] || '';
        const prompt = buildMentorMatchPrompt(startup, mentor, historicalNote);
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

async function matchInvestorsForStartup(startupId, limit = 5) {
  try {
    const startupResult = await query('SELECT * FROM startups WHERE id = $1', [startupId]);
    if (!startupResult.rows[0]) throw new Error('Startup not found');
    const startup = startupResult.rows[0];

    const investorsResult = await query(
      `SELECT i.*, u.full_name, u.email
       FROM investors i
       JOIN users u ON i.user_id = u.id
       WHERE i.is_active = true
       ORDER BY i.portfolio_size DESC
       LIMIT 10`
    );

    const investors = investorsResult.rows;
    if (investors.length === 0) return [];

    const matchPromises = investors.map(async (investor) => {
      try {
        const prompt = buildInvestorMatchPrompt(startup, investor);
        const aiResult = await generateContent(prompt, {
          mockType: 'investor_match',
          temperature: 0.3
        });

        return {
          investor_id: investor.id,
          investor_name: investor.full_name,
          firm_name: investor.firm_name,
          investment_thesis: investor.investment_thesis,
          focus_industries: investor.focus_industries,
          investment_stages: investor.investment_stages,
          ticket_size_min: investor.ticket_size_min,
          ticket_size_max: investor.ticket_size_max,
          portfolio_size: investor.portfolio_size,
          fit_score: parseFloat(aiResult.fit_score) || 70,
          confidence_score: parseFloat(aiResult.confidence_score) || 65,
          thesis_alignment: aiResult.thesis_alignment || 0.7,
          stage_fit: aiResult.stage_fit || 'good',
          ticket_fit: aiResult.ticket_fit || 'within_range',
          reasoning: aiResult.reasoning || 'Good investment fit based on industry and stage alignment',
          recommendation: aiResult.recommendation || 'pitch',
        };
      } catch (err) {
        logger.error(`Error matching investor ${investor.id}:`, err);
        return null;
      }
    });

    const results = (await Promise.all(matchPromises)).filter(Boolean);
    results.sort((a, b) => b.fit_score - a.fit_score);
    return results.slice(0, limit);
  } catch (error) {
    logger.error('Investor matching error:', error);
    throw error;
  }
}

module.exports = { matchMentorsForStartup, matchProgrammesForStartup, matchInvestorsForStartup };
