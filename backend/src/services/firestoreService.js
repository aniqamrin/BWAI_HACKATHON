/**
 * firestoreService.js
 * Firestore sits alongside PostgreSQL as a real-time event bus.
 * Safe fallback: if credentials are missing, all calls are no-ops.
 *
 * SETUP:
 *   1. Go to https://console.firebase.google.com → create/open project
 *   2. Project Settings → Service Accounts → Generate new private key
 *   3. Save as backend/serviceAccountKey.json
 *   4. Set GOOGLE_CLOUD_PROJECT=your-project-id in .env
 */

const logger = require('../utils/logger');
const fs = require('fs');

let db = null;
let FieldValue = null;
let initialized = false;

function getFirestore() {
  if (initialized) return db;
  initialized = true;

  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getFirestore: _getFirestore, FieldValue: _FieldValue } = require('firebase-admin/firestore');

    if (!process.env.GOOGLE_CLOUD_PROJECT) {
      logger.warn('Firestore: GOOGLE_CLOUD_PROJECT not set — skipping');
      return null;
    }

    if (!getApps().length) {
      const keyPath = './serviceAccountKey.json';
      if (fs.existsSync(keyPath) && fs.statSync(keyPath).size > 10) {
        // Use service account key file
        initializeApp({ credential: cert(require('../../serviceAccountKey.json')), projectId: process.env.GOOGLE_CLOUD_PROJECT });
        logger.info('Firestore: initialized with service account key');
      } else {
        // Use Application Default Credentials (works on Cloud Run automatically)
        initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
        logger.info('Firestore: initialized with application default credentials');
      }
    }

    db = _getFirestore();
    FieldValue = _FieldValue;
    logger.info('Firestore connected successfully');
    return db;
  } catch (err) {
    logger.warn(`Firestore not available (${err.message}) — real-time features disabled`);
    db = null;
    return null;
  }
}

// Safe wrapper — never throws, just logs
async function safeWrite(fn) {
  const firestore = getFirestore();
  if (!firestore) return null;
  try {
    return await fn(firestore);
  } catch (err) {
    logger.error('Firestore write error:', err.message);
    return null;
  }
}

// ── Collections ───────────────────────────────────────────────────────────────
// /activity_feed/{docId}            → global live feed
// /relationship_health/{relId}      → latest health per relationship
// /notifications/{userId}/inbox     → per-user notification inbox
// /ecosystem_stats/current          → live counters

async function logActivity({ type, title, description, meta = {}, userId = null }) {
  return safeWrite(async (firestore) => {
    await firestore.collection('activity_feed').add({
      type, title, description, meta, userId,
      timestamp: FieldValue.serverTimestamp(),
      read: false,
    });
  });
}

async function updateRelationshipHealth(relationshipId, healthData) {
  return safeWrite(async (firestore) => {
    await firestore.collection('relationship_health').doc(relationshipId).set({
      ...healthData,
      relationship_id: relationshipId,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });

    if (['poor', 'inactive'].includes(healthData.engagement_health)) {
      await logActivity({
        type: 'health_alert',
        title: '⚠️ Relationship at Risk',
        description: `Health dropped to "${healthData.engagement_health}" — intervention may be needed`,
        meta: { relationship_id: relationshipId, health_score: healthData.health_score },
      });
    }
  });
}

async function notifyUser(userId, { title, body, type, link = null, meta = {} }) {
  return safeWrite(async (firestore) => {
    await firestore.collection('notifications').doc(userId).collection('inbox').add({
      title, body, type, link, meta,
      read: false,
      timestamp: FieldValue.serverTimestamp(),
    });
  });
}

async function incrementStat(field, amount = 1) {
  return safeWrite(async (firestore) => {
    await firestore.collection('ecosystem_stats').doc('current').set(
      { [field]: FieldValue.increment(amount), updated_at: FieldValue.serverTimestamp() },
      { merge: true }
    );
  });
}

async function broadcastMatch({ startupId, startupName, mentorId, mentorName, matchScore }) {
  await logActivity({
    type: 'match_accepted',
    title: '🤝 New Match Created',
    description: `${startupName} matched with ${mentorName} (score: ${Math.round(matchScore)}%)`,
    meta: { startup_id: startupId, mentor_id: mentorId, match_score: matchScore },
  });
  await incrementStat('total_matches');
}

async function broadcastVerification({ startupId, startupName, score, riskLevel }) {
  await logActivity({
    type: 'startup_verified',
    title: '✅ Startup Verified',
    description: `${startupName} scored ${Math.round(score)}/100 — risk: ${riskLevel}`,
    meta: { startup_id: startupId, score, risk_level: riskLevel },
  });
  await incrementStat('total_verifications');
}

async function getRecentActivity(limit = 20) {
  const firestore = getFirestore();
  if (!firestore) return [];
  try {
    const snap = await firestore.collection('activity_feed')
      .orderBy('timestamp', 'desc').limit(limit).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    logger.error('Firestore read error:', err.message);
    return [];
  }
}

async function getUserNotifications(userId, limit = 30) {
  const firestore = getFirestore();
  if (!firestore) return [];
  try {
    const snap = await firestore.collection('notifications').doc(userId)
      .collection('inbox').orderBy('timestamp', 'desc').limit(limit).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    logger.error('Firestore read error:', err.message);
    return [];
  }
}

async function markNotificationRead(userId, notificationId) {
  return safeWrite(async (firestore) => {
    await firestore.collection('notifications').doc(userId)
      .collection('inbox').doc(notificationId).update({ read: true });
  });
}

module.exports = {
  getFirestore, logActivity, updateRelationshipHealth,
  notifyUser, incrementStat, broadcastMatch, broadcastVerification,
  getRecentActivity, getUserNotifications, markNotificationRead,
};