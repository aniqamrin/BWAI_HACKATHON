const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middlewares/auth');
const { detectIntent } = require('../services/vertexAgentService');
const { success, error } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

// POST /api/agent/chat
// Body: { message: string, sessionId?: string }
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message?.trim()) {
      return error(res, 'message is required', 400);
    }

    // Scope session to the authenticated user so conversations don't bleed
    const resolvedSessionId = sessionId || `${req.user.id}-${uuidv4()}`;

    const result = await detectIntent(resolvedSessionId, message.trim());

    logger.info(`Agent chat — user ${req.user.id}, session ${resolvedSessionId}`);
    return success(res, result, 'Agent response');
  } catch (err) {
    logger.error(`Agent chat error: ${err.message}\n${err.stack}`);
    return error(res, 'Agent failed to respond: ' + err.message);
  }
});

module.exports = router;
