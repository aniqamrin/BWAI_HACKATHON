const logger = require('../utils/logger');

// BigQuery analytics event sink
// PRD requirement: log platform events to BigQuery for offline analysis / dashboards
// Graceful no-op when GOOGLE_CLOUD_PROJECT / BigQuery credentials are absent

let bigquery = null;
let dataset = null;

const DATASET_ID = process.env.BIGQUERY_DATASET || 'ecosystemos_analytics';
const TABLE_ID   = process.env.BIGQUERY_TABLE   || 'platform_events';

function getClient() {
  if (bigquery) return bigquery;

  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    return null;
  }

  try {
    const { BigQuery } = require('@google-cloud/bigquery');
    bigquery = new BigQuery({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
    dataset   = bigquery.dataset(DATASET_ID);
    logger.info('BigQuery client initialised');
    return bigquery;
  } catch (err) {
    logger.warn('BigQuery SDK unavailable — analytics events will be dropped:', err.message);
    return null;
  }
}

/**
 * Insert a single analytics event row.
 * Schema mirrors the platform_events BigQuery table defined in the PRD.
 *
 * @param {object} event
 * @param {string} event.event_type     e.g. "relationship_created", "match_generated"
 * @param {string} [event.entity_type]  e.g. "relationship", "startup"
 * @param {string} [event.entity_id]    UUID of the entity
 * @param {object} [event.properties]   Arbitrary JSON payload
 * @param {string} [event.user_id]      UUID of the acting user
 */
async function logEvent(event) {
  const client = getClient();

  const row = {
    event_id:    crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    event_type:  event.event_type,
    entity_type: event.entity_type || null,
    entity_id:   event.entity_id   || null,
    user_id:     event.user_id     || null,
    properties:  JSON.stringify(event.properties || {}),
    timestamp:   new Date().toISOString(),
  };

  if (!client) {
    logger.debug('BigQuery [no-op]:', row.event_type, row.entity_id || '');
    return;
  }

  try {
    await dataset.table(TABLE_ID).insert([row]);
    logger.debug('BigQuery event logged:', row.event_type);
  } catch (err) {
    // Never let analytics failures propagate to callers
    logger.warn('BigQuery insert failed (non-fatal):', err.message);
  }
}

/**
 * Convenience wrappers for common event types
 */
const events = {
  matchGenerated: (startupId, mode, count, userId) =>
    logEvent({ event_type: 'match_generated', entity_type: 'startup', entity_id: startupId, user_id: userId, properties: { mode, count } }),

  relationshipCreated: (relationshipId, type, userId) =>
    logEvent({ event_type: 'relationship_created', entity_type: 'relationship', entity_id: relationshipId, user_id: userId, properties: { type } }),

  startupVerified: (startupId, score, risk, userId) =>
    logEvent({ event_type: 'startup_verified', entity_type: 'startup', entity_id: startupId, user_id: userId, properties: { score, risk } }),

  outcomeRecorded: (outcomeId, startupId, rating) =>
    logEvent({ event_type: 'outcome_recorded', entity_type: 'outcome', entity_id: outcomeId, properties: { startup_id: startupId, rating } }),

  governanceViolation: (relationshipId, ruleNames) =>
    logEvent({ event_type: 'governance_violation', entity_type: 'relationship', entity_id: relationshipId, properties: { rules: ruleNames } }),
};

module.exports = { logEvent, events };
