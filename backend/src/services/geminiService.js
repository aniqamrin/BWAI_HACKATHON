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
    if (options.requireLive) {
      throw new Error('GEMINI_API_KEY is required for live Gemini verification');
    }
    logger.warn('Gemini API key not configured, using mock response');
    return getMockResponse(options.mockType || 'generic');
  }

  try {
    const model = ai.getGenerativeModel({
      model: options.model || process.env.GEMINI_MODEL || 'gemini-2.5-pro',
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
    if (options.requireLive) {
      throw error;
    }
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
    ecosystem_analysis: {
      actors: [
        {
          id: 'startup_demo',
          type: 'startup',
          name: 'Demo Startup',
          summary: 'Startup extracted from submitted evidence.',
          tags: ['evidence-linked'],
          evidenceSourceIds: []
        },
        {
          id: 'mentor_demo',
          type: 'mentor',
          name: 'Demo Mentor',
          summary: 'Mentor extracted from submitted evidence.',
          tags: ['mentor-fit'],
          evidenceSourceIds: []
        },
        {
          id: 'partner_demo',
          type: 'partner',
          name: 'Demo Partner',
          summary: 'Partner extracted from submitted evidence.',
          tags: ['partner-pathway'],
          evidenceSourceIds: []
        }
      ],
      evidenceSources: [],
      signals: [
        {
          id: 'signal_demo_blocker',
          type: 'blocker',
          actorIds: ['startup_demo', 'mentor_demo'],
          evidenceSourceIds: [],
          label: 'Blocker identified in processed evidence',
          detail: 'The submitted material contains enough context to flag a relationship blocker for review.',
          strength: 0.78
        }
      ],
      recommendations: [
        {
          id: 'recommendation_demo_mentor',
          type: 'mentor_match',
          title: 'Review mentor fit from processed evidence',
          actorIds: ['startup_demo', 'mentor_demo'],
          evidenceSourceIds: [],
          confidence: 82,
          status: 'review_suggested',
          rationale: 'The evidence graph shows a plausible mentor relationship but still needs human approval.',
          nextStep: 'Review the linked evidence and approve or request more information.'
        },
        {
          id: 'recommendation_demo_partner',
          type: 'partner_pathway',
          title: 'Evaluate partner pathway',
          actorIds: ['startup_demo', 'partner_demo'],
          evidenceSourceIds: [],
          confidence: 74,
          status: 'manual_evidence_needed',
          rationale: 'Partner fit is promising, but more timing and governance evidence is needed.',
          nextStep: 'Ask for partner mandate, timing, and decision owner evidence.'
        }
      ],
      rankings: {
        mentors: [
          {
            actorId: 'mentor_demo',
            startupId: 'startup_demo',
            rank: 1,
            score: 82,
            confidence: 78,
            rationale: 'Ranked by evidence fit, cadence, warmth, expertise, and risk.',
            evidenceSourceIds: []
          }
        ],
        partners: [
          {
            actorId: 'partner_demo',
            startupId: 'startup_demo',
            rank: 1,
            score: 74,
            confidence: 69,
            rationale: 'Ranked by mandate fit, timing, evidence quality, and governance risk.',
            evidenceSourceIds: []
          }
        ]
      },
      rationale: [
        {
          recommendationId: 'recommendation_demo_mentor',
          reasoning: 'The recommendation is based on processed evidence, not raw crawler output.'
        }
      ],
      missingEvidence: [
        {
          id: 'missing_demo_approval_context',
          actorIds: ['startup_demo'],
          recommendationId: 'recommendation_demo_partner',
          question: 'Who owns approval and what evidence is required before the partner intro?',
          priority: 'medium'
        }
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
