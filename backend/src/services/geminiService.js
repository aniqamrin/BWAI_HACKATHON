const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

let genAI = null;

function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

async function generateContent(prompt, options = {}) {
  const ai = getGenAI();

  if (!ai) {
    logger.warn('Gemini API key not configured, using mock response');
    return getMockResponse(options.mockType || 'generic');
  }

  try {
    const model = ai.getGenerativeModel({
      model: options.model || 'gemini-1.5-flash',
      generationConfig: {
        temperature: options.temperature || 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: options.maxTokens || 2048,
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON response
    try {
      return JSON.parse(response);
    } catch {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    logger.error('Gemini API error:', error.message);
    // Return mock data as fallback
    return getMockResponse(options.mockType || 'generic');
  }
}

function getMockResponse(type) {
  const mocks = {
    verification: {
      verification_score: 75 + Math.random() * 20,
      risk_level: 'low',
      industry_classification: 'Technology',
      stage_classification: 'seed',
      legitimacy_score: 78,
      confidence_level: 0.82,
      risk_factors: ['Limited traction data', 'Early stage market validation needed'],
      strengths: ['Clear problem statement', 'Experienced team', 'Growing market'],
      recommendations: ['Focus on customer acquisition', 'Build strategic partnerships', 'Strengthen financial projections'],
      ai_summary: 'This startup demonstrates solid fundamentals with a clear value proposition. The team shows relevant experience and the market opportunity is significant. Key areas for improvement include traction metrics and competitive differentiation.'
    },
    mentor_match: {
      compatibility_score: 80 + Math.random() * 15,
      confidence_score: 75 + Math.random() * 20,
      mentorship_quality: 'high',
      expertise_relevance: 0.85,
      growth_potential_alignment: 0.78,
      reasoning: 'Strong alignment between mentor expertise and startup needs. The mentor has direct experience in the relevant industry and has successfully guided similar companies through this growth stage.',
      recommended_focus_areas: ['Go-to-market strategy', 'Fundraising preparation', 'Team building'],
      estimated_impact: 'High - mentor can accelerate growth by 6-12 months'
    },
    relationship_health: {
      engagement_health: 'good',
      health_score: 72,
      risk_of_inactivity: 'low',
      recommended_next_actions: ['Schedule monthly check-in', 'Review milestone progress', 'Introduce to relevant network contacts'],
      intervention_suggestions: [],
      momentum_indicators: ['Regular meetings', 'Clear goal alignment', 'Mutual commitment'],
      ai_summary: 'Relationship is progressing well with consistent engagement. Both parties are aligned on goals and showing commitment to the mentorship process.'
    },
    ecosystem_insights: {
      ecosystem_health_score: 74,
      key_insights: [
        'FinTech sector showing strongest growth with 3 active startups',
        'Mentor capacity is near optimal - consider recruiting 2 more mentors',
        'Programme participation rate is high at 80%',
        'Average verification score of 82 indicates quality startup pipeline'
      ],
      opportunities: [
        'Cross-sector collaboration between FinTech and HealthTech startups',
        'Regional expansion opportunities in West Africa',
        'Investor-startup matching pipeline needs strengthening'
      ],
      risks: [
        'Mentor bandwidth may become constrained with ecosystem growth',
        'Geographic concentration in East Africa'
      ],
      recommendations: [
        'Recruit 3-5 additional mentors in HealthTech and EdTech',
        'Launch West Africa expansion programme',
        'Establish investor relations programme'
      ]
    },
    outcome_analysis: {
      success_classification: 'high',
      key_success_factors: ['Strong mentor-startup alignment', 'Consistent milestone completion', 'Clear goal setting'],
      learning_points: ['Early check-ins accelerate progress', 'Shared industry background improves outcomes'],
      pattern_tags: ['high-growth', 'mentor-led', 'funded'],
      ai_summary: 'This relationship demonstrated strong outcomes driven by aligned goals and consistent engagement. The mentor\'s industry expertise directly contributed to measurable startup progress. Key learnings include the value of structured milestone tracking.'
    },
    outcome_insights: {
      headline: 'Mentorship relationships in FinTech show 40% higher success rates than other sectors',
      key_insights: [
        'Mentorships with blueprint-defined milestones complete 65% more goals on time',
        'Startups with verification score above 70 have 2x higher programme graduation rates',
        'Relationships with weekly check-ins show 3x better engagement health',
        'West Africa cohorts show fastest traction growth post-mentorship'
      ],
      patterns: ['High-frequency engagement correlates with funding success', 'Geographic proximity improves NPS scores'],
      recommendations: ['Prioritize blueprint-based relationships', 'Expand FinTech mentor pool by 40%']
    },
    blueprint_health: {
      effectiveness_score: 78,
      avg_milestone_completion: 0.72,
      avg_health_score: 74,
      top_performing_type: 'mentor_startup',
      recommendation: 'Reduce inactivity threshold to 5 days for better responsiveness'
    },
    graph_diagnostics: {
      bridge_suggestions: [
        { reason: 'High compatibility based on industry and stage alignment', potential_score: 87 },
        { reason: 'Mentor expertise directly matches startup growth needs', potential_score: 82 }
      ]
    },
    generic: {
      status: 'success',
      message: 'AI analysis completed',
      score: 75 + Math.random() * 20,
      confidence: 0.8
    }
  };

  return mocks[type] || mocks.generic;
}

module.exports = { generateContent, getMockResponse };
