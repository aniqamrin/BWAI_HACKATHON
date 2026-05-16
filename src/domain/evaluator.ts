import { baselineRelationships } from './sampleCohort';
import type { CohortEvaluation, CohortSyncRow, RelationshipEvaluation } from './types';

const DETERMINISTIC_RESULTS: Record<
  string,
  Omit<RelationshipEvaluation, 'relationshipId' | 'previous_health' | 'health_delta'>
> = {
  'M-104:S-LOOP': {
    engagement_health: 82,
    confidence: 92,
    reasoning:
      'GTM strategy, pricing test completion, and aligned confidence scores show a recovered mentor fit despite one remaining enterprise access blocker.',
    signals: {
      positive: ['Drafted GTM strategy', 'Completed pricing test', 'Founder and mentor confidence aligned at 8/10'],
      negative: ['Enterprise buyer intro still needs a champion'],
    },
    recommended_action: 'Use the next mentor session to secure a named enterprise champion.',
  },
  'M-207:S-ORBIT': {
    engagement_health: 78,
    confidence: 88,
    reasoning: 'Investor narrative and pilot objections improved enough to move the relationship into a healthy operating range.',
    signals: {
      positive: ['Investor narrative refined', 'Pilot objections resolved', 'Mentor confidence at 9/10'],
      negative: ['Deployment proof still needs sharper evidence'],
    },
    recommended_action: 'Attach deployment timeline proof to the next investor narrative review.',
  },
  'M-116:S-NORTH': {
    engagement_health: 59,
    confidence: 81,
    reasoning: 'Sync volume improved, but ownership ambiguity and uneven founder follow-through keep the relationship on watch.',
    signals: {
      positive: ['Onboarding map reviewed', 'Confidence improved modestly'],
      negative: ['Next milestone owner unclear', 'Founder follow-through uneven'],
    },
    recommended_action: 'Assign one ownership lead and review progress within seven days.',
  },
  'M-319:S-KIN': {
    engagement_health: 88,
    confidence: 94,
    reasoning: 'High sync hours, design partner progress, and no material blocker indicate a strong mentor-startup fit.',
    signals: {
      positive: ['Design partner closed', 'Renewal plan reviewed', 'Both confidence scores at 9/10'],
      negative: [],
    },
    recommended_action: 'Prepare a renewal plan pressure test for the next board update.',
  },
  'M-058:S-PULSE': {
    engagement_health: 67,
    confidence: 84,
    reasoning: 'Technical risk was escalated and confidence improved, but the integration blocker is not fully closed.',
    signals: {
      positive: ['Technical risk review completed', 'Blocker escalated to product mentor'],
      negative: ['Integration blocker remains open'],
    },
    recommended_action: 'Keep the relationship on watch until the integration owner confirms closure.',
  },
  'M-221:S-HELIOS': {
    engagement_health: 54,
    confidence: 79,
    reasoning:
      'The sprint plan reset improved the signal, but prior low sync hours and founder confidence keep this relationship fragile.',
    signals: {
      positive: ['Sprint plan rebuilt', 'Measurable owner assigned'],
      negative: ['Founder confidence remains below cohort median'],
    },
    recommended_action: 'Review operating cadence after the next sprint checkpoint.',
  },
};

function baselineFor(id: string) {
  return baselineRelationships.find((relationship) => relationship.id === id)?.baselineHealth ?? 50;
}

export function evaluateCohortSync(rows: CohortSyncRow[]): CohortEvaluation {
  const relationshipEvaluations = rows
    .map((row) => {
      const relationshipId = `${row.mentor_id}:${row.startup_id}`;
      const deterministic = DETERMINISTIC_RESULTS[relationshipId];
      if (!deterministic) return null;

      const previous = baselineFor(relationshipId);
      return {
        relationshipId,
        previous_health: previous,
        health_delta: deterministic.engagement_health - previous,
        ...deterministic,
      };
    })
    .filter((item): item is RelationshipEvaluation => Boolean(item));

  const cohortHealth = Math.round(
    relationshipEvaluations.reduce((sum, item) => sum + item.engagement_health, 0) /
      Math.max(relationshipEvaluations.length, 1),
  );

  const confidence = Math.round(
    relationshipEvaluations.reduce((sum, item) => sum + item.confidence, 0) / Math.max(relationshipEvaluations.length, 1),
  );

  return {
    processedRows: rows.length,
    cohortHealth,
    confidence,
    executiveSummary:
      'Monthly mentor records show materially stronger cohort signal: recovered GTM relationships, clearer milestone evidence, and two remaining watchlist interventions.',
    relationshipEvaluations,
  };
}
