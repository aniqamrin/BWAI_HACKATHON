require('dotenv').config();

const { generateContent } = require('../src/services/geminiService');
const {
  getFirestore,
  upsertEcosystemSnapshot,
  getEcosystemSnapshotFromFirestore,
} = require('../src/services/firestoreService');

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.startsWith('your_')) {
    throw new Error(`${key} is required for live Google integration testing`);
  }
  return value;
}

function requireOneOf(keys) {
  const hasValue = keys.some((key) => {
    const value = process.env[key];
    return value && !value.startsWith('your_');
  });

  if (!hasValue) {
    throw new Error(`${keys.join(' or ')} is required for live Google integration testing`);
  }
}

async function main() {
  requireEnv('GEMINI_API_KEY');
  requireOneOf(['GOOGLE_CLOUD_PROJECT', 'FIREBASE_PROJECT_ID']);

  const firestore = getFirestore();
  if (!firestore) {
    throw new Error('Firestore is not available. Configure backend/serviceAccountKey.json or Application Default Credentials.');
  }

  const aiResult = await generateContent(`
Return strict JSON only:
{
  "actors": [],
  "evidenceSources": [],
  "signals": [],
  "recommendations": [],
  "rankings": { "mentors": [], "partners": [] },
  "rationale": [],
  "missingEvidence": []
}
`, {
    requireLive: true,
    temperature: 0,
    maxTokens: 1024,
  });

  if (!aiResult || typeof aiResult !== 'object' || !aiResult.rankings) {
    throw new Error('Gemini did not return the required strict JSON shape');
  }

  const ecosystemId = '_integration_test_relationship_os';
  await upsertEcosystemSnapshot(ecosystemId, {
    name: 'Relationship OS integration test',
    generatedAt: new Date().toISOString(),
    actors: [
      {
        id: 'actor_live_test',
        type: 'admin',
        name: 'Live Test Actor',
        summary: 'Created by backend/scripts/test-ecosystem-live.js',
        tags: ['integration-test'],
        evidenceSourceIds: ['evidence_live_test'],
      },
    ],
    evidenceSources: [
      {
        id: 'evidence_live_test',
        sourceType: 'note',
        title: 'Live integration test evidence',
        summary: 'Verifies Firestore write and read for the ecosystem data model.',
        metadata: { integrationTest: true },
        signalIds: [],
      },
    ],
    lenses: [
      {
        id: 'evidence',
        label: 'Evidence health',
        description: 'Integration test lens',
        metric: '1 source',
      },
    ],
    recommendations: [],
    decisions: [],
    signals: [],
    rankings: { mentors: [], partners: [] },
    rationale: [],
    missingEvidence: [],
  });

  const snapshot = await getEcosystemSnapshotFromFirestore(ecosystemId);
  if (!snapshot || snapshot.evidenceSources.length !== 1) {
    throw new Error('Firestore read-back failed for ecosystem integration test');
  }

  console.log(JSON.stringify({
    mode: 'live',
    geminiStrictJson: true,
    firestoreWriteRead: true,
    ecosystemId,
    evidenceSources: snapshot.evidenceSources.length,
  }, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
