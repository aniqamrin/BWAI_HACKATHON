const { v4: uuidv4 } = require('uuid');
const { generateContent } = require('./geminiService');
const { extractEvidenceFromRequest, cleanText } = require('./evidenceExtractionService');
const {
  upsertEcosystemSnapshot,
  getEcosystemSnapshotFromFirestore,
  recordEcosystemDecision,
} = require('./firestoreService');
const { buildEcosystemAnalysisPrompt } = require('../prompts/ecosystemPrompt');
const logger = require('../utils/logger');

const memoryStore = new Map();

const DEFAULT_LENSES = [
  {
    id: 'relationships',
    label: 'Relationships',
    description: 'Relationship actions generated from processed evidence.',
    metric: 'mentor and partner next steps',
  },
  {
    id: 'mentor-ranking',
    label: 'Mentor ranking',
    description: 'Mentors ranked by fit, cadence, warmth, expertise, and risk.',
    metric: 'ranked mentors',
  },
  {
    id: 'partner-ranking',
    label: 'Partner ranking',
    description: 'Partners ranked by mandate fit, timing, evidence quality, and governance risk.',
    metric: 'ranked partners',
  },
  {
    id: 'evidence',
    label: 'Evidence health',
    description: 'Processed evidence sources and missing information before approval.',
    metric: 'source coverage',
  },
];

function getEmptySnapshot(ecosystemId) {
  return {
    id: ecosystemId,
    name: ecosystemId,
    generatedAt: new Date().toISOString(),
    actors: [],
    evidenceSources: [],
    lenses: DEFAULT_LENSES,
    recommendations: [],
    decisions: [],
    signals: [],
    rankings: { mentors: [], partners: [] },
    rationale: [],
    missingEvidence: [],
  };
}

function mergeById(existing = [], incoming = []) {
  const merged = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => {
    if (!item?.id) return;
    merged.set(item.id, { ...(merged.get(item.id) || {}), ...item });
  });
  return [...merged.values()];
}

function slugify(value, fallbackPrefix = 'item') {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return slug || `${fallbackPrefix}_${uuidv4().slice(0, 8)}`;
}

function sourceTypeToEvidenceType(sourceType) {
  if (['url', 'pdf', 'docx', 'document', 'note', 'csv', 'whatsapp'].includes(sourceType)) return sourceType;
  return 'document';
}

function inferActorsFromEvidence(evidenceBatch) {
  const actors = [];
  const seen = new Set();

  function addActor(id, type, name, evidenceSourceId, summary = '') {
    if (!id || seen.has(id)) return;
    seen.add(id);
    actors.push({
      id,
      type,
      name,
      summary,
      tags: [],
      evidenceSourceIds: [evidenceSourceId],
    });
  }

  evidenceBatch.forEach((source) => {
    const records = source.metadata?.records || [];
    records.forEach((row) => {
      if (row.startup_id) {
        addActor(slugify(row.startup_id, 'startup'), 'startup', row.startup_id, source.id, row.milestones_completed);
      }
      if (row.mentor_id) {
        addActor(slugify(row.mentor_id, 'mentor'), 'mentor', row.mentor_id, source.id, row.blockers_identified);
      }
    });

    if (source.sourceType === 'whatsapp') {
      (source.metadata?.participants || []).forEach((participant, index) => {
        addActor(
          slugify(participant, 'participant'),
          index === 0 ? 'admin' : 'mentor',
          participant,
          source.id,
          'Participant extracted from WhatsApp export.',
        );
      });
    }
  });

  return actors;
}

function processedEvidenceSource(source, aiSource) {
  return {
    id: source.id,
    sourceType: sourceTypeToEvidenceType(source.sourceType),
    title: aiSource?.title || source.title,
    summary: aiSource?.summary || source.description || cleanText(source.text).slice(0, 240),
    metadata: {
      ...(source.metadata || {}),
      url: source.url || null,
      filename: source.filename || null,
      extractionStatus: source.extractionStatus,
      uploadedAt: source.uploadedAt,
      errors: source.errors || [],
    },
    signalIds: aiSource?.signalIds || [],
  };
}

function normalizeAnalysis(rawAnalysis, evidenceBatch, ecosystemId) {
  const evidenceIds = evidenceBatch.map((source) => source.id);
  const fallbackActors = inferActorsFromEvidence(evidenceBatch);
  const aiEvidenceById = new Map((rawAnalysis.evidenceSources || []).map((source) => [source.id, source]));
  const actors = mergeById([], [
    ...fallbackActors,
    ...(rawAnalysis.actors || []).map((actor) => ({
      id: actor.id || slugify(actor.name, actor.type || 'actor'),
      type: actor.type || 'partner',
      name: actor.name || actor.id || 'Unnamed actor',
      summary: actor.summary || '',
      tags: Array.isArray(actor.tags) ? actor.tags : [],
      evidenceSourceIds: Array.isArray(actor.evidenceSourceIds) && actor.evidenceSourceIds.length
        ? actor.evidenceSourceIds.filter((id) => evidenceIds.includes(id))
        : evidenceIds.slice(0, 1),
    })),
  ]);
  const actorIds = actors.map((actor) => actor.id);
  const defaultActorIds = actorIds.slice(0, Math.min(actorIds.length, 2));

  const signals = (rawAnalysis.signals || []).map((signal, index) => ({
    id: signal.id || `signal_${ecosystemId}_${index + 1}`,
    type: signal.type || 'opportunity',
    actorIds: Array.isArray(signal.actorIds) && signal.actorIds.length ? signal.actorIds.filter((id) => actorIds.includes(id)) : defaultActorIds,
    evidenceSourceIds: Array.isArray(signal.evidenceSourceIds) && signal.evidenceSourceIds.length
      ? signal.evidenceSourceIds.filter((id) => evidenceIds.includes(id))
      : evidenceIds.slice(0, 1),
    label: signal.label || 'Evidence signal',
    detail: signal.detail || '',
    strength: Number(signal.strength) || 0.7,
  }));

  const recommendations = (rawAnalysis.recommendations || []).map((recommendation, index) => ({
    id: recommendation.id || `recommendation_${ecosystemId}_${index + 1}`,
    type: recommendation.type || 'mentor_match',
    title: recommendation.title || 'Review ecosystem recommendation',
    actorIds: Array.isArray(recommendation.actorIds) && recommendation.actorIds.length
      ? recommendation.actorIds.filter((id) => actorIds.includes(id))
      : defaultActorIds,
    evidenceSourceIds: Array.isArray(recommendation.evidenceSourceIds) && recommendation.evidenceSourceIds.length
      ? recommendation.evidenceSourceIds.filter((id) => evidenceIds.includes(id))
      : evidenceIds.slice(0, 1),
    confidence: Math.max(0, Math.min(100, Number(recommendation.confidence) || 70)),
    status: recommendation.status || 'review_suggested',
    rationale: recommendation.rationale || 'Generated from processed evidence.',
    nextStep: recommendation.nextStep || 'Review the evidence and decide whether to approve.',
  }));

  const fallbackRecommendation = recommendations[0]?.id || null;
  const missingEvidence = (rawAnalysis.missingEvidence || []).map((item, index) => ({
    id: item.id || `missing_evidence_${ecosystemId}_${index + 1}`,
    actorIds: Array.isArray(item.actorIds) ? item.actorIds.filter((id) => actorIds.includes(id)) : [],
    recommendationId: item.recommendationId || fallbackRecommendation,
    question: item.question || 'What additional evidence is needed before approval?',
    priority: item.priority || 'medium',
  }));

  const evidenceSources = evidenceBatch.map((source) => processedEvidenceSource(source, aiEvidenceById.get(source.id)));

  return {
    actors,
    evidenceSources,
    signals,
    recommendations,
    rankings: {
      mentors: normalizeRanking(rawAnalysis.rankings?.mentors || [], actors, evidenceIds, 'mentor'),
      partners: normalizeRanking(rawAnalysis.rankings?.partners || [], actors, evidenceIds, 'partner'),
    },
    rationale: rawAnalysis.rationale || recommendations.map((recommendation) => ({
      recommendationId: recommendation.id,
      reasoning: recommendation.rationale,
    })),
    missingEvidence,
  };
}

function normalizeRanking(rankings, actors, evidenceIds, preferredType) {
  return rankings.map((ranking, index) => {
    const actor = actors.find((candidate) => candidate.id === ranking.actorId)
      || actors.find((candidate) => candidate.type === preferredType)
      || actors[index];

    return {
      actorId: actor?.id || ranking.actorId || `${preferredType}_${index + 1}`,
      startupId: ranking.startupId || actors.find((candidate) => candidate.type === 'startup')?.id || null,
      rank: Number(ranking.rank) || index + 1,
      score: Math.max(0, Math.min(100, Number(ranking.score) || 70 - index * 4)),
      confidence: Math.max(0, Math.min(100, Number(ranking.confidence) || 70)),
      rationale: ranking.rationale || 'Ranked from processed evidence graph.',
      evidenceSourceIds: Array.isArray(ranking.evidenceSourceIds) && ranking.evidenceSourceIds.length
        ? ranking.evidenceSourceIds.filter((id) => evidenceIds.includes(id))
        : evidenceIds.slice(0, 1),
    };
  });
}

async function getSnapshot(ecosystemId) {
  const firestoreSnapshot = await getEcosystemSnapshotFromFirestore(ecosystemId);
  if (firestoreSnapshot) {
    memoryStore.set(ecosystemId, firestoreSnapshot);
    return firestoreSnapshot;
  }

  if (!memoryStore.has(ecosystemId)) {
    memoryStore.set(ecosystemId, getEmptySnapshot(ecosystemId));
  }

  return memoryStore.get(ecosystemId);
}

async function persistSnapshot(ecosystemId, snapshot) {
  memoryStore.set(ecosystemId, snapshot);
  await upsertEcosystemSnapshot(ecosystemId, snapshot);
  return snapshot;
}

async function processEvidence({ ecosystemId, body = {}, files = [] }) {
  const existing = await getSnapshot(ecosystemId);
  const evidenceBatch = await extractEvidenceFromRequest({ body, files });

  if (evidenceBatch.length === 0) {
    throw new Error('No evidence submitted. Provide urls, files, csvText, whatsappText, or notes.');
  }

  const prompt = buildEcosystemAnalysisPrompt({ ecosystemId, evidenceBatch, mode: 'processEvidence' });
  const rawAnalysis = await generateContent(prompt, {
    mockType: 'ecosystem_analysis',
    temperature: 0.2,
    maxTokens: 8192,
  });
  const analysis = normalizeAnalysis(rawAnalysis, evidenceBatch, ecosystemId);
  const nextSnapshot = {
    ...existing,
    generatedAt: new Date().toISOString(),
    actors: mergeById(existing.actors, analysis.actors),
    evidenceSources: mergeById(existing.evidenceSources, analysis.evidenceSources),
    lenses: DEFAULT_LENSES,
    recommendations: mergeById(existing.recommendations, analysis.recommendations),
    decisions: existing.decisions || [],
    signals: mergeById(existing.signals, analysis.signals),
    rankings: {
      mentors: analysis.rankings.mentors.length ? analysis.rankings.mentors : existing.rankings?.mentors || [],
      partners: analysis.rankings.partners.length ? analysis.rankings.partners : existing.rankings?.partners || [],
    },
    rationale: mergeById(existing.rationale, analysis.rationale.map((item) => ({ id: item.recommendationId, ...item }))),
    missingEvidence: mergeById(existing.missingEvidence, analysis.missingEvidence),
  };

  await persistSnapshot(ecosystemId, nextSnapshot);

  logger.info(`Processed ${evidenceBatch.length} evidence sources for ecosystem ${ecosystemId}`);
  return {
    evidenceSources: analysis.evidenceSources,
    analysis,
    snapshot: nextSnapshot,
  };
}

function deterministicRank(snapshot, startupId, preferredType) {
  const evidenceIds = snapshot.evidenceSources.map((source) => source.id);
  const actors = snapshot.actors.filter((actor) => actor.type === preferredType || (preferredType === 'partner' && actor.type === 'service_provider'));
  const startup = startupId || snapshot.actors.find((actor) => actor.type === 'startup')?.id || null;

  return actors
    .map((actor, index) => ({
      actorId: actor.id,
      startupId: startup,
      rank: index + 1,
      score: Math.max(55, 90 - index * 7),
      confidence: Math.max(50, 84 - index * 5),
      rationale: preferredType === 'mentor'
        ? 'Ranked by stored evidence coverage, likely expertise fit, cadence signals, warmth, and relationship risk.'
        : 'Ranked by stored evidence coverage, mandate fit, timing, evidence quality, and governance risk.',
      evidenceSourceIds: actor.evidenceSourceIds?.length ? actor.evidenceSourceIds : evidenceIds.slice(0, 1),
    }))
    .sort((a, b) => b.score - a.score)
    .map((ranking, index) => ({ ...ranking, rank: index + 1 }));
}

async function rankMentors(ecosystemId, startupId = null) {
  const snapshot = await getSnapshot(ecosystemId);
  const evidenceBatch = snapshot.evidenceSources.map((source) => ({
    id: source.id,
    sourceType: source.sourceType,
    title: source.title,
    description: source.summary,
    text: source.summary,
    metadata: source.metadata || {},
    errors: source.metadata?.errors || [],
  }));
  const prompt = buildEcosystemAnalysisPrompt({ ecosystemId, evidenceBatch, mode: 'rankMentors', startupId });
  const rawAnalysis = await generateContent(prompt, {
    mockType: 'ecosystem_analysis',
    temperature: 0.2,
    maxTokens: 4096,
  });
  const normalized = normalizeAnalysis(rawAnalysis, evidenceBatch, ecosystemId);
  const rankings = normalized.rankings.mentors.length
    ? normalized.rankings.mentors
    : deterministicRank(snapshot, startupId, 'mentor');
  const nextSnapshot = {
    ...snapshot,
    generatedAt: new Date().toISOString(),
    rankings: { ...(snapshot.rankings || {}), mentors: rankings },
  };

  await persistSnapshot(ecosystemId, nextSnapshot);
  return rankings;
}

async function rankPartners(ecosystemId, startupId = null) {
  const snapshot = await getSnapshot(ecosystemId);
  const evidenceBatch = snapshot.evidenceSources.map((source) => ({
    id: source.id,
    sourceType: source.sourceType,
    title: source.title,
    description: source.summary,
    text: source.summary,
    metadata: source.metadata || {},
    errors: source.metadata?.errors || [],
  }));
  const prompt = buildEcosystemAnalysisPrompt({ ecosystemId, evidenceBatch, mode: 'rankPartners', startupId });
  const rawAnalysis = await generateContent(prompt, {
    mockType: 'ecosystem_analysis',
    temperature: 0.2,
    maxTokens: 4096,
  });
  const normalized = normalizeAnalysis(rawAnalysis, evidenceBatch, ecosystemId);
  const rankings = normalized.rankings.partners.length
    ? normalized.rankings.partners
    : deterministicRank(snapshot, startupId, 'partner');
  const nextSnapshot = {
    ...snapshot,
    generatedAt: new Date().toISOString(),
    rankings: { ...(snapshot.rankings || {}), partners: rankings },
  };

  await persistSnapshot(ecosystemId, nextSnapshot);
  return rankings;
}

async function recordDecision(ecosystemId, { recommendationId, decision, adminId = null, notes = '' }) {
  if (!recommendationId || !decision) {
    throw new Error('recommendationId and decision are required.');
  }

  const snapshot = await getSnapshot(ecosystemId);
  const decisionRecord = {
    id: `decision_${uuidv4()}`,
    recommendationId,
    decision,
    adminId,
    notes,
    createdAt: new Date().toISOString(),
  };
  const nextSnapshot = {
    ...snapshot,
    decisions: [...(snapshot.decisions || []), decisionRecord],
  };

  memoryStore.set(ecosystemId, nextSnapshot);
  await recordEcosystemDecision(ecosystemId, decisionRecord);
  await upsertEcosystemSnapshot(ecosystemId, nextSnapshot);
  return decisionRecord;
}

module.exports = {
  getEcosystemSnapshot: getSnapshot,
  processEvidence,
  rankMentors,
  rankPartners,
  recordDecision,
};
