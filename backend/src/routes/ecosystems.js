const express = require('express');
const multer = require('multer');
const {
  getEcosystemSnapshot,
  processEvidence,
  rankMentors,
  rankPartners,
  recordDecision,
} = require('../services/ecosystemIntelligenceService');
const { success, created, badRequest, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 8,
  },
});

const apiContract = {
  firestoreShape: [
    'ecosystems/{ecosystemId}',
    'ecosystems/{ecosystemId}/actors/{actorId}',
    'ecosystems/{ecosystemId}/evidenceSources/{evidenceSourceId}',
    'ecosystems/{ecosystemId}/lenses/{lensId}',
    'ecosystems/{ecosystemId}/recommendations/{recommendationId}',
    'ecosystems/{ecosystemId}/decisions/{decisionId}',
  ],
  endpoints: {
    getEcosystemSnapshot: 'GET /api/ecosystems/:ecosystemId/snapshot',
    processEvidence: 'POST /api/ecosystems/:ecosystemId/evidence/process',
    rankMentors: 'POST /api/ecosystems/:ecosystemId/rank/mentors',
    rankPartners: 'POST /api/ecosystems/:ecosystemId/rank/partners',
    recordDecision: 'POST /api/ecosystems/:ecosystemId/decisions',
  },
  aliases: {
    processEvidence: 'POST /api/ecosystems/:ecosystemId/process-evidence',
    rankMentors: 'POST /api/ecosystems/:ecosystemId/rank-mentors',
    rankPartners: 'POST /api/ecosystems/:ecosystemId/rank-partners',
    recordDecision: 'POST /api/ecosystems/:ecosystemId/record-decision',
  },
  evidenceInputs: ['urls', 'csvText', 'whatsappText', 'notes', 'files'],
  fileTypes: ['pdf', 'docx', 'txt', 'notes', 'csv', 'zip WhatsApp export'],
  analysisLayer: 'Server extracts text and metadata first, then sends clean content to Gemini for strict JSON.',
};

async function handleGetSnapshot(req, res) {
  try {
    const snapshot = await getEcosystemSnapshot(req.params.ecosystemId);
    return success(res, snapshot, 'Ecosystem snapshot loaded');
  } catch (err) {
    logger.error('Get ecosystem snapshot error:', err);
    return error(res, 'Failed to load ecosystem snapshot: ' + err.message);
  }
}

async function handleProcessEvidence(req, res) {
  try {
    const result = await processEvidence({
      ecosystemId: req.params.ecosystemId,
      body: req.body || {},
      files: req.files || [],
    });

    return created(res, result, 'Evidence processed into ecosystem graph');
  } catch (err) {
    logger.error('Process evidence error:', err);
    if (/No evidence submitted/.test(err.message)) {
      return badRequest(res, err.message);
    }
    return error(res, 'Evidence processing failed: ' + err.message);
  }
}

async function handleRankMentors(req, res) {
  try {
    const rankings = await rankMentors(req.params.ecosystemId, req.body?.startupId || req.body?.startup_id || null);
    return success(res, { rankings }, 'Mentor rankings generated');
  } catch (err) {
    logger.error('Rank mentors error:', err);
    return error(res, 'Mentor ranking failed: ' + err.message);
  }
}

async function handleRankPartners(req, res) {
  try {
    const rankings = await rankPartners(req.params.ecosystemId, req.body?.startupId || req.body?.startup_id || null);
    return success(res, { rankings }, 'Partner rankings generated');
  } catch (err) {
    logger.error('Rank partners error:', err);
    return error(res, 'Partner ranking failed: ' + err.message);
  }
}

async function handleRecordDecision(req, res) {
  try {
    const decision = await recordDecision(req.params.ecosystemId, {
      recommendationId: req.body?.recommendationId || req.body?.recommendation_id,
      decision: req.body?.decision,
      adminId: req.body?.adminId || req.body?.admin_id || null,
      notes: req.body?.notes || '',
    });

    return created(res, decision, 'Decision recorded');
  } catch (err) {
    logger.error('Record decision error:', err);
    if (/required/.test(err.message)) {
      return badRequest(res, err.message);
    }
    return error(res, 'Decision recording failed: ' + err.message);
  }
}

// GET /api/ecosystems/contract
router.get('/contract', (_req, res) => success(res, apiContract, 'Relationship OS backend contract loaded'));

// GET /api/ecosystems/:ecosystemId/snapshot
router.get('/:ecosystemId/snapshot', handleGetSnapshot);

// POST /api/ecosystems/:ecosystemId/evidence/process
// Accepts JSON: { urls, csvText, whatsappText, notes }
// Accepts multipart form-data: files[] plus the same JSON fields as text fields.
router.post('/:ecosystemId/evidence/process', upload.any(), handleProcessEvidence);

// Function-name aliases for direct frontend handoff wiring.
router.post('/:ecosystemId/process-evidence', upload.any(), handleProcessEvidence);

// POST /api/ecosystems/:ecosystemId/rank/mentors
router.post('/:ecosystemId/rank/mentors', handleRankMentors);
router.post('/:ecosystemId/rank-mentors', handleRankMentors);

// POST /api/ecosystems/:ecosystemId/rank/partners
router.post('/:ecosystemId/rank/partners', handleRankPartners);
router.post('/:ecosystemId/rank-partners', handleRankPartners);

// POST /api/ecosystems/:ecosystemId/decisions
router.post('/:ecosystemId/decisions', handleRecordDecision);
router.post('/:ecosystemId/record-decision', handleRecordDecision);

module.exports = router;
