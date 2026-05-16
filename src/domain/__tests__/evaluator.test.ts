import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCohortCsv } from '../csv';
import { evaluateCohortSync } from '../evaluator';
import { baselineRelationships } from '../sampleCohort';
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

  it('evaluates every relationship in the sample CSV with aligned relationship-specific signals', () => {
    const sampleCsv = readFileSync(join(process.cwd(), 'public/monthly-sync-sample.csv'), 'utf8');
    const parsed = parseCohortCsv(sampleCsv);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const result = evaluateCohortSync(parsed.rows);
    const baselineIds = new Set(baselineRelationships.map((relationship) => relationship.id));
    const evaluatedIds = new Set(result.relationshipEvaluations.map((relationship) => relationship.relationshipId));

    expect(result.relationshipEvaluations).toHaveLength(parsed.rows.length);
    for (const row of parsed.rows) {
      const relationshipId = `${row.mentor_id}:${row.startup_id}`;
      expect(evaluatedIds.has(relationshipId)).toBe(true);
      expect(baselineIds.has(relationshipId)).toBe(true);
    }

    const peopleHelios = result.relationshipEvaluations.find((item) => item.relationshipId === 'M-221:S-HELIOS');
    const technicalHelios = result.relationshipEvaluations.find((item) => item.relationshipId === 'M-058:S-HELIOS');
    const peopleHeliosText = [
      peopleHelios?.reasoning,
      ...(peopleHelios?.signals.positive ?? []),
      ...(peopleHelios?.signals.negative ?? []),
    ].join(' ');
    const technicalHeliosText = [
      technicalHelios?.reasoning,
      ...(technicalHelios?.signals.positive ?? []),
      ...(technicalHelios?.signals.negative ?? []),
    ].join(' ');

    expect(peopleHeliosText).toContain('hiring plan');
    expect(peopleHeliosText).toContain('Low sync hours');
    expect(peopleHeliosText).toContain('Founder confidence dipped');
    expect(technicalHeliosText).toContain('Sprint plan');
    expect(technicalHeliosText).toContain('Technical blocker reduced');
    expect(result.relationshipEvaluations.some((item) => item.engagement_health >= 50 && item.engagement_health < 72)).toBe(true);
  });
});
