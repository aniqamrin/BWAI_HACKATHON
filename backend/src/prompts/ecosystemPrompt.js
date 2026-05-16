const { cleanText } = require('../services/evidenceExtractionService');

function compactEvidence(evidenceBatch) {
  return evidenceBatch.map((source) => ({
    evidenceSourceId: source.id,
    sourceType: source.sourceType,
    title: source.title,
    url: source.url || null,
    filename: source.filename || null,
    description: source.description || '',
    metadata: source.metadata || {},
    extractedText: cleanText(source.text).slice(0, 9000),
    extractionErrors: source.errors || [],
  }));
}

function buildEcosystemAnalysisPrompt({ ecosystemId, evidenceBatch, mode = 'processEvidence', startupId = null }) {
  return `
You are the structured intelligence layer for EcosystemOS.

Non-negotiable rule:
- Do not crawl, browse, fetch, or infer from URLs directly.
- Only analyze the extracted text and metadata provided below.
- Return strict JSON only. No markdown. No prose wrapper.

Context:
- ecosystemId: ${ecosystemId}
- mode: ${mode}
- startupId: ${startupId || 'not provided'}

Evidence batch:
${JSON.stringify(compactEvidence(evidenceBatch), null, 2)}

Return a JSON object with this exact top-level shape:
{
  "actors": [
    {
      "id": "stable_slug_or_source_id",
      "type": "startup|mentor|service_provider|partner|programme|admin",
      "name": "string",
      "summary": "string",
      "tags": ["string"],
      "evidenceSourceIds": ["evidenceSourceId"]
    }
  ],
  "evidenceSources": [
    {
      "id": "must match an input evidenceSourceId",
      "sourceType": "url|pdf|docx|document|note|csv|whatsapp",
      "title": "string",
      "summary": "short processed summary",
      "metadata": {},
      "signalIds": ["signal_id"]
    }
  ],
  "signals": [
    {
      "id": "stable_signal_id",
      "type": "blocker|need|milestone|warmth|cadence|confidence|missing_evidence|risk|opportunity",
      "actorIds": ["actor_id"],
      "evidenceSourceIds": ["evidenceSourceId"],
      "label": "string",
      "detail": "string",
      "strength": 0.0
    }
  ],
  "recommendations": [
    {
      "id": "stable_recommendation_id",
      "type": "mentor_match|partner_pathway|service_provider_support|programme_link|evidence_request",
      "title": "string",
      "actorIds": ["actor_id"],
      "evidenceSourceIds": ["evidenceSourceId"],
      "confidence": 0,
      "status": "auto_ready|review_suggested|manual_evidence_needed",
      "rationale": "short reasoning",
      "nextStep": "specific action"
    }
  ],
  "rankings": {
    "mentors": [
      {
        "actorId": "mentor_actor_id",
        "startupId": "startup_actor_id_or_null",
        "rank": 1,
        "score": 0,
        "confidence": 0,
        "rationale": "fit, cadence, warmth, expertise, risk reasoning",
        "evidenceSourceIds": ["evidenceSourceId"]
      }
    ],
    "partners": [
      {
        "actorId": "partner_actor_id",
        "startupId": "startup_actor_id_or_null",
        "rank": 1,
        "score": 0,
        "confidence": 0,
        "rationale": "mandate fit, timing, evidence quality, governance risk reasoning",
        "evidenceSourceIds": ["evidenceSourceId"]
      }
    ]
  },
  "rationale": [
    {
      "recommendationId": "recommendation_id",
      "reasoning": "one short paragraph"
    }
  ],
  "missingEvidence": [
    {
      "id": "stable_missing_evidence_id",
      "actorIds": ["actor_id"],
      "recommendationId": "recommendation_id_or_null",
      "question": "what is still needed before approval",
      "priority": "low|medium|high"
    }
  ]
}

Rules:
- Every recommendation must link to at least one actorId and one evidenceSourceId.
- Every ranking item must link back to evidenceSourceIds.
- Use source IDs exactly as provided.
- If a source failed extraction, create a missingEvidence item rather than pretending it was analyzed.
- Prefer practical next steps for a hackathon demo.
`;
}

module.exports = { buildEcosystemAnalysisPrompt };
