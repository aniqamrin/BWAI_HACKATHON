/**
 * EcosystemOS Agentic AI — Gemini Function Calling
 *
 * Uses @google/genai (the NEW SDK, same one as geminiService.js) to run a
 * multi-step agentic loop: Gemini decides which tools to call, gets the
 * results back, and keeps reasoning until it produces a final text response.
 *
 * No Vertex AI / Google Cloud Console setup required — just GEMINI_API_KEY.
 *
 * Sessions are kept in memory per Node process. For multi-instance deployments
 * swap the Map for a Redis or Firestore-backed store.
 */

const { GoogleGenAI } = require('@google/genai');
const { query } = require('../db/connection');
const { getDashboardOverview, getEcosystemInsights } = require('./analyticsService');
const { matchMentorsForStartup, matchProgrammesForStartup } = require('./matchingService');
const logger = require('../utils/logger');

// ─── Tool declarations (Gemini function calling format) ───────────────────────

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'getEcosystemOverview',
        description:
          'Get aggregate statistics for the entire startup ecosystem: total startups, verified count, average verification score, mentor counts, open programmes, active relationships, and industry distribution.',
      },
      {
        name: 'listStartups',
        description:
          'List startups with optional filters. Returns id, name, industry, stage, country, verification score, risk level, traction, and founder. IMPORTANT: The id field is the real UUID — always use it for matchMentorsForStartup, never guess UUIDs.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name:     { type: 'STRING', description: 'Filter by startup name (partial, case-insensitive). Use when user mentions a specific startup name.' },
            industry: { type: 'STRING', description: 'Filter by industry (e.g. FinTech, HealthTech, EdTech, AgriTech). Partial match.' },
            stage:    { type: 'STRING', description: 'Filter by stage: idea | pre-seed | seed | series-a | series-b | growth' },
            country:  { type: 'STRING', description: 'Filter by country name (partial match).' },
            limit:    { type: 'NUMBER', description: 'Max results (default 10, max 20).' },
          },
        },
      },
      {
        name: 'listMentors',
        description:
          'List mentors sorted by rating. Returns name, title, company, expertise, industries, years of experience, availability, and capacity.',
        parameters: {
          type: 'OBJECT',
          properties: {
            availability: { type: 'STRING', description: 'Filter by availability: available | limited | busy | unavailable' },
            limit:        { type: 'NUMBER', description: 'Max results (default 10, max 20).' },
          },
        },
      },
      {
        name: 'listProgrammes',
        description:
          'List accelerator and incubator programmes. Returns name, organizer, focus areas, country, duration, funding offered, benefits, and eligibility.',
        parameters: {
          type: 'OBJECT',
          properties: {
            status: { type: 'STRING', description: 'Filter by status: open | ongoing | closed' },
            limit:  { type: 'NUMBER', description: 'Max results (default 10, max 20).' },
          },
        },
      },
      {
        name: 'matchMentorsForStartup',
        description:
          'Use AI to find and rank the best mentor matches for a specific startup. Returns compatibility scores, reasoning, recommended focus areas, and estimated impact.',
        parameters: {
          type: 'OBJECT',
          properties: {
            startup_id: { type: 'STRING', description: 'UUID of the startup.' },
            limit:      { type: 'NUMBER', description: 'Number of matches to return (default 5).' },
          },
          required: ['startup_id'],
        },
      },
      {
        name: 'matchProgrammesForStartup',
        description:
          'Use AI to find and rank the best accelerator programme fits for a specific startup. Returns fit scores, eligibility assessment, and application recommendation.',
        parameters: {
          type: 'OBJECT',
          properties: {
            startup_id: { type: 'STRING', description: 'UUID of the startup.' },
            limit:      { type: 'NUMBER', description: 'Number of matches to return (default 5).' },
          },
          required: ['startup_id'],
        },
      },
      {
        name: 'getEcosystemInsights',
        description:
          'Get AI-generated strategic insights about the ecosystem: health score, key findings, opportunities, risks, and growth recommendations.',
      },
    ],
  },
];

const SYSTEM_PROMPT = `You are EcosystemOS Agent, an intelligent assistant for an African startup ecosystem platform.

You have access to real-time data tools. Use them proactively to answer questions accurately.

RESPONSE FORMAT RULES (strictly follow these):
- NEVER show raw JSON, tool call names, tool output blocks, or code in your response.
- NEVER write things like "Tool Call:", "Tool Output:", "functionCall:", or backtick code blocks in your response.
- Present data as clean bullet lists or numbered lists with natural language descriptions.
- Use **bold** for key numbers and names only.
- Summarize large datasets — do not dump raw arrays.

TOOL USAGE RULES:
- Always call a tool when the user asks about counts, lists, scores, or recommendations — never guess.
- NEVER fabricate UUIDs. Always call listStartups first to get the real id, then use it for matchMentorsForStartup or matchProgrammesForStartup.
- Tool calls must be sequential when the second depends on the first.
- If the user asks a follow-up, reuse already-fetched data before calling a tool again.

STYLE:
- Be concise but complete. Lead with the direct answer, then supporting detail.
- For lists of startups or mentors, show: name, key metric, stage/availability, country.
- For match results, show: name, score, one-line reasoning.`;

// ─── In-memory session store (history per sessionId) ─────────────────────────

const sessions = new Map(); // sessionId → Array of {role, parts}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenAI({ apiKey });
}

function getHistory(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  return sessions.get(sessionId);
}

// ─── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(name, args = {}) {
  switch (name) {
    case 'getEcosystemOverview': {
      const overview = await getDashboardOverview();
      return {
        total_startups:         overview.stats.startups.total,
        verified_startups:      overview.stats.startups.verified,
        avg_verification_score: parseFloat(overview.stats.startups.avg_score || 0).toFixed(1),
        high_risk_startups:     overview.stats.startups.high_risk,
        total_mentors:          overview.stats.mentors.total,
        available_mentors:      overview.stats.mentors.available,
        avg_mentor_rating:      parseFloat(overview.stats.mentors.avg_rating || 0).toFixed(1),
        total_programmes:       overview.stats.programmes.total,
        open_programmes:        overview.stats.programmes.open,
        ongoing_programmes:     overview.stats.programmes.ongoing,
        total_relationships:    overview.stats.relationships.total,
        active_relationships:   overview.stats.relationships.active,
        avg_match_score:        parseFloat(overview.stats.relationships.avg_match_score || 0).toFixed(1),
        industry_distribution:  overview.distributions.industry,
      };
    }

    case 'listStartups': {
      const { name, industry, stage, country, limit = 10 } = args;
      let sql = `
        SELECT s.id, s.startup_name, s.industry, s.stage, s.country,
               s.description, s.verification_score, s.verification_status,
               s.risk_level, s.traction, s.funding_raised,
               u.full_name AS founder_name
        FROM startups s JOIN users u ON s.user_id = u.id
        WHERE s.is_active = true
      `;
      const params = [];
      if (name)     { params.push(`%${name}%`);     sql += ` AND s.startup_name ILIKE $${params.length}`; }
      if (industry) { params.push(`%${industry}%`); sql += ` AND s.industry ILIKE $${params.length}`; }
      if (stage)    { params.push(stage);            sql += ` AND s.stage = $${params.length}`; }
      if (country)  { params.push(`%${country}%`);  sql += ` AND s.country ILIKE $${params.length}`; }
      params.push(Math.min(Number(limit) || 10, 20));
      sql += ` ORDER BY s.verification_score DESC LIMIT $${params.length}`;
      const result = await query(sql, params);
      return { startups: result.rows, total: result.rows.length };
    }

    case 'listMentors': {
      const { availability, limit = 10 } = args;
      let sql = `
        SELECT m.id, m.title, m.company, m.expertise, m.industries,
               m.years_experience, m.availability, m.rating, m.total_reviews,
               m.location, m.current_startups, m.max_startups,
               u.full_name, u.country
        FROM mentors m JOIN users u ON m.user_id = u.id
        WHERE m.is_active = true
      `;
      const params = [];
      if (availability) { params.push(availability); sql += ` AND m.availability = $${params.length}`; }
      params.push(Math.min(Number(limit) || 10, 20));
      sql += ` ORDER BY m.rating DESC LIMIT $${params.length}`;
      const result = await query(sql, params);
      return { mentors: result.rows, total: result.rows.length };
    }

    case 'listProgrammes': {
      const { status, limit = 10 } = args;
      let sql = `
        SELECT id, programme_name, organizer, focus_area, country,
               duration_weeks, funding_offered, cohort_size, status,
               benefits, eligibility_criteria, deadline
        FROM programmes WHERE is_active = true
      `;
      const params = [];
      if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
      params.push(Math.min(Number(limit) || 10, 20));
      sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
      const result = await query(sql, params);
      return { programmes: result.rows, total: result.rows.length };
    }

    case 'matchMentorsForStartup': {
      const { startup_id, limit = 5 } = args;
      const matches = await matchMentorsForStartup(startup_id, Number(limit) || 5);
      return { matches, total: matches.length };
    }

    case 'matchProgrammesForStartup': {
      const { startup_id, limit = 5 } = args;
      const matches = await matchProgrammesForStartup(startup_id, Number(limit) || 5);
      return { matches, total: matches.length };
    }

    case 'getEcosystemInsights': {
      const result = await getEcosystemInsights();
      return result.insights || result;
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─── Main agent entry point ───────────────────────────────────────────────────

async function detectIntent(sessionId, userMessage) {
  const client = getClient();
  const history = getHistory(sessionId);

  // Append user message to history
  history.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  // Agentic loop: keep sending until model returns plain text (no more tool calls)
  for (let step = 0; step < 10; step++) {
    let response;
    try {
      response = await client.models.generateContent({
        model: process.env.GEMINI_AGENT_MODEL || 'gemini-2.5-flash',
        contents: history,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
        tools: TOOLS,
      });
    } catch (err) {
      const is429 = err.message?.includes('429') || err.message?.includes('Too Many Requests');
      if (is429) {
        const retryMatch = err.message?.match(/retry in ([\d.]+)s/i);
        const seconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
        throw new Error(`Gemini API quota exceeded. Please try again in ${seconds} seconds.`);
      }
      throw err;
    }

    // The new SDK returns candidates directly on response
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    // Check for function calls in this turn
    const functionCalls = parts.filter((p) => p.functionCall);

    if (functionCalls.length === 0) {
      // No tool calls — model has produced the final text response
      // Skip thought/reasoning parts (gemini-2.5 thinking models emit these with thought:true)
      const reply = parts.find((p) => p.text && !p.thought)?.text
        || parts.find((p) => p.text)?.text
        || "I couldn't generate a response. Please try again.";

      // Save model turn to history for next message
      history.push({ role: 'model', parts: [{ text: reply }] });

      return { reply, sessionId };
    }

    // Execute all requested tools in parallel
    logger.info(`Agent [${sessionId}] step ${step + 1}: calling ${functionCalls.map((p) => p.functionCall.name).join(', ')}`);

    // Save the model's tool-call turn to history
    history.push({ role: 'model', parts });

    // Build tool result parts
    const toolResultParts = await Promise.all(
      functionCalls.map(async ({ functionCall }) => {
        try {
          const result = await executeTool(functionCall.name, functionCall.args);
          return {
            functionResponse: {
              name: functionCall.name,
              response: result,
            },
          };
        } catch (err) {
          logger.error(`Tool ${functionCall.name} error:`, err.message);
          return {
            functionResponse: {
              name: functionCall.name,
              response: { error: err.message },
            },
          };
        }
      })
    );

    // Append tool results to history as a user turn (required by the API)
    history.push({ role: 'user', parts: toolResultParts });
  }

  // Safety fallback if loop exhausted
  return { reply: 'Agent reached maximum steps without a final answer. Please try a more specific question.', sessionId };
}

module.exports = { detectIntent };