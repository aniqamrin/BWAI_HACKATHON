const logger = require('../utils/logger');

// Vertex AI text embeddings with Gemini fallback and mock safety net
// PRD requirement: textembedding-gecko via Vertex AI for semantic startup/mentor matching

let vertexAI = null;
let predictionClient = null;

function getVertexClient() {
  if (predictionClient) return predictionClient;

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

  if (!projectId) {
    logger.warn('GOOGLE_CLOUD_PROJECT not set — embedding service running in mock mode');
    return null;
  }

  try {
    const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;
    predictionClient = new PredictionServiceClient({
      apiEndpoint: `${location}-aiplatform.googleapis.com`,
    });
    logger.info('Vertex AI PredictionServiceClient initialised');
    return predictionClient;
  } catch (err) {
    logger.warn('Vertex AI SDK not installed — embedding service in mock mode:', err.message);
    return null;
  }
}

/**
 * Generate a text embedding vector using Vertex AI textembedding-gecko.
 * Falls back to a deterministic mock vector when credentials are unavailable.
 */
async function embedText(text) {
  const client = getVertexClient();

  if (!client) {
    return getMockEmbedding(text);
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';
  const model = 'textembedding-gecko@003';
  const endpoint = `projects/${projectId}/locations/${location}/publishers/google/models/${model}`;

  try {
    const [response] = await client.predict({
      endpoint,
      instances: [{ content: text.slice(0, 2048) }],
      parameters: { outputDimensionality: 768 },
    });

    const values = response.predictions?.[0]?.embeddings?.values;
    if (!values || values.length === 0) throw new Error('Empty embedding response');
    return values.map(Number);
  } catch (err) {
    logger.error('Vertex embedding error, falling back to mock:', err.message);
    return getMockEmbedding(text);
  }
}

/**
 * Batch embed multiple texts — returns array of vectors in the same order.
 */
async function embedBatch(texts) {
  return Promise.all(texts.map(embedText));
}

/**
 * Cosine similarity between two equal-length vectors, in [-1, 1].
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Score a startup against a list of candidates (mentors or investors).
 * Returns sorted array of { id, score } pairs.
 */
async function rankBySimilarity(startupText, candidates) {
  const [startupVec, ...candidateVecs] = await embedBatch([startupText, ...candidates.map(c => c.text)]);

  return candidates
    .map((c, i) => ({ id: c.id, score: cosineSimilarity(startupVec, candidateVecs[i]) }))
    .sort((a, b) => b.score - a.score);
}

// Deterministic mock: hash text into a repeatable unit vector
function getMockEmbedding(text) {
  const dim = 768;
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += text.charCodeAt(i);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

module.exports = { embedText, embedBatch, cosineSimilarity, rankBySimilarity };
