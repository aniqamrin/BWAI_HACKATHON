import { describe, expect, it } from 'vitest';
import { evaluateCohortSync } from '../evaluator';
import type { CohortSyncRow } from '../types';

const rows: CohortSyncRow[] = [
  {
    mentor_id: 'M-104',
    startup_id: 'S-LOOP',
    hours_synced: 7,
    milestones_completed: 'Drafted GTM strategy and completed pricing test',
    blockers_identified: 'Enterprise buyer intro still blocked by unclear champion',
    founder_confidence_score: 8,
    mentor_confidence_score: 8,
  },
  {
    mentor_id: 'M-116',
    startup_id: 'S-NORTH',
    hours_synced: 4,
    milestones_completed: 'Reviewed onboarding map',
    blockers_identified: 'Next milestone owner unclear and founder follow-through uneven',
    founder_confidence_score: 5,
    mentor_confidence_score: 6,
  },
];

describe('evaluateCohortSync', () => {
  it('returns deterministic cohort-level evaluation', () => {
    const result = evaluateCohortSync(rows);
    expect(result.processedRows).toBe(2);
    expect(result.cohortHealth).toBeGreaterThan(60);
    expect(result.executiveSummary).toContain('mentor records');
  });

  it('improves LoopPay while keeping Northstar on watch', () => {
    const result = evaluateCohortSync(rows);
    const loopPay = result.relationshipEvaluations.find((item) => item.relationshipId === 'M-104:S-LOOP');
    const northstar = result.relationshipEvaluations.find((item) => item.relationshipId === 'M-116:S-NORTH');

    expect(loopPay?.engagement_health).toBe(82);
    expect(loopPay?.health_delta).toBe(51);
    expect(northstar?.engagement_health).toBe(59);
    expect(northstar?.recommended_action).toContain('ownership');
  });
});
