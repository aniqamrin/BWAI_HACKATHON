import { describe, expect, it } from 'vitest';
import {
  createFirebaseEcosystemDataGateway,
  createMockEcosystemDataGateway,
  ecosystemFirebaseContract,
  mockEcosystemSnapshot,
  validateEcosystemSnapshot,
} from '../ecosystemData';

describe('ecosystem data model', () => {
  it('keeps every mock section linked to known actors, evidence, and recommendations', () => {
    expect(validateEcosystemSnapshot(mockEcosystemSnapshot)).toEqual([]);
  });

  it('returns a coherent snapshot from the mock gateway', async () => {
    const gateway = createMockEcosystemDataGateway();
    const snapshot = await gateway.getSnapshot('demo-cohort');

    expect(snapshot.ecosystemId).toBe('demo-cohort');
    expect(snapshot.lenses.map((lens) => lens.id)).toEqual([
      'company',
      'service-provider',
      'partner-rankings',
      'mentor-rankings',
    ]);
    expect(validateEcosystemSnapshot(snapshot)).toEqual([]);
  });

  it('defines the Firebase-ready collection and function contract', () => {
    expect(ecosystemFirebaseContract.collections.map((collection) => collection.name)).toEqual([
      'ecosystems',
      'actors',
      'evidenceSources',
      'lenses',
      'recommendations',
      'decisions',
    ]);
    expect(ecosystemFirebaseContract.functions.map((fn) => fn.name)).toEqual([
      'getEcosystemSnapshot',
      'processEvidence',
      'rankMentors',
      'rankPartners',
      'recordDecision',
    ]);
  });

  it('adapts the dashboard gateway to Firebase-style callable functions', async () => {
    const calls: Array<{ name: string; payload: unknown }> = [];
    const gateway = createFirebaseEcosystemDataGateway({
      async call(name, payload) {
        calls.push({ name, payload });
        let result: unknown;

        if (name === 'getEcosystemSnapshot') {
          result = mockEcosystemSnapshot;
        } else if (name === 'processEvidence') {
          result = { processedSignalCount: 18 };
        } else {
          result = payload;
        }

        return result as never;
      },
    });

    await gateway.getSnapshot('demo-cohort');
    await gateway.processEvidence('demo-cohort', 'whatsapp-export');
    await gateway.recordDecision('demo-cohort', 'mentor-priya', 'approved');

    expect(calls).toEqual([
      { name: 'getEcosystemSnapshot', payload: { ecosystemId: 'demo-cohort' } },
      { name: 'processEvidence', payload: { ecosystemId: 'demo-cohort', evidenceSourceId: 'whatsapp-export' } },
      { name: 'recordDecision', payload: { ecosystemId: 'demo-cohort', actionId: 'mentor-priya', decision: 'approved' } },
    ]);
  });
});
