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
const path = require('path');

let db = null;
let FieldValue = null;
let initialized = false;

function getFirestore() {
  if (initialized) return db;
  initialized = true;

  try {
    const { initializeApp, getApps, cert } = require('firebase-admin/app');
    const { getFirestore: _getFirestore, FieldValue: _FieldValue } = require('firebase-admin/firestore');

    const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
      logger.warn('Firestore: GOOGLE_CLOUD_PROJECT or FIREBASE_PROJECT_ID not set — skipping');
      return null;
    }

    if (!getApps().length) {
      const configuredKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const fallbackKeyPath = './serviceAccountKey.json';
      const keyPath = configuredKeyPath
        ? path.resolve(process.cwd(), configuredKeyPath)
        : path.resolve(process.cwd(), fallbackKeyPath);

      if (fs.existsSync(keyPath) && fs.statSync(keyPath).size > 10) {
        // Use service account key file
        initializeApp({ credential: cert(require(keyPath)), projectId });
        logger.info('Firestore: initialized with service account key');
      } else {
        // Use Application Default Credentials (works on Cloud Run automatically)
        initializeApp({ projectId });
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

function ecosystemRef(firestore, ecosystemId) {
  return firestore.collection('ecosystems').doc(ecosystemId);
}

async function writeCollection(rootRef, collectionName, rows) {
  const batch = rootRef.firestore.batch();
  rows.forEach((row) => {
    if (!row?.id) return;
    batch.set(rootRef.collection(collectionName).doc(row.id), {
      ...row,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
}

async function upsertEcosystemSnapshot(ecosystemId, snapshot) {
  return safeWrite(async (firestore) => {
    const rootRef = ecosystemRef(firestore, ecosystemId);
    await rootRef.set({
      id: ecosystemId,
      name: snapshot.name || ecosystemId,
      updated_at: FieldValue.serverTimestamp(),
      generated_at: snapshot.generatedAt || new Date().toISOString(),
      counts: {
        actors: snapshot.actors?.length || 0,
        evidenceSources: snapshot.evidenceSources?.length || 0,
        recommendations: snapshot.recommendations?.length || 0,
        decisions: snapshot.decisions?.length || 0,
      },
      rankings: snapshot.rankings || { mentors: [], partners: [] },
      signals: snapshot.signals || [],
      missingEvidence: snapshot.missingEvidence || [],
      rationale: snapshot.rationale || [],
    }, { merge: true });

    await Promise.all([
      writeCollection(rootRef, 'actors', snapshot.actors || []),
      writeCollection(rootRef, 'evidenceSources', snapshot.evidenceSources || []),
      writeCollection(rootRef, 'lenses', snapshot.lenses || []),
      writeCollection(rootRef, 'recommendations', snapshot.recommendations || []),
      writeCollection(rootRef, 'decisions', snapshot.decisions || []),
    ]);

    return { ok: true };
  });
}

async function readCollection(rootRef, collectionName) {
  const snap = await rootRef.collection(collectionName).get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function getEcosystemSnapshotFromFirestore(ecosystemId) {
  const firestore = getFirestore();
  if (!firestore) return null;

  try {
    const rootRef = ecosystemRef(firestore, ecosystemId);
    const rootSnap = await rootRef.get();
    if (!rootSnap.exists) return null;
    const root = rootSnap.data();
    const [actors, evidenceSources, lenses, recommendations, decisions] = await Promise.all([
      readCollection(rootRef, 'actors'),
      readCollection(rootRef, 'evidenceSources'),
      readCollection(rootRef, 'lenses'),
      readCollection(rootRef, 'recommendations'),
      readCollection(rootRef, 'decisions'),
    ]);

    return {
      id: ecosystemId,
      name: root.name || ecosystemId,
      generatedAt: root.generated_at || new Date().toISOString(),
      actors,
      evidenceSources,
      lenses,
      recommendations,
      decisions,
      signals: root.signals || [],
      rankings: root.rankings || { mentors: [], partners: [] },
      rationale: root.rationale || [],
      missingEvidence: root.missingEvidence || [],
    };
  } catch (err) {
    logger.error('Firestore ecosystem read error:', err.message);
    return null;
  }
}

async function recordEcosystemDecision(ecosystemId, decision) {
  return safeWrite(async (firestore) => {
    const rootRef = ecosystemRef(firestore, ecosystemId);
    await rootRef.collection('decisions').doc(decision.id).set({
      ...decision,
      created_at: FieldValue.serverTimestamp(),
    }, { merge: true });

    await logActivity({
      type: 'ecosystem_decision',
      title: 'Relationship OS decision recorded',
      description: `${decision.decision} for ${decision.recommendationId}`,
      meta: { ecosystemId, recommendationId: decision.recommendationId },
      userId: decision.adminId || null,
    });
  });
}

module.exports = {
  getFirestore, logActivity, updateRelationshipHealth,
  notifyUser, incrementStat, broadcastMatch, broadcastVerification,
  getRecentActivity, getUserNotifications, markNotificationRead,
  upsertEcosystemSnapshot, getEcosystemSnapshotFromFirestore, recordEcosystemDecision,
};
