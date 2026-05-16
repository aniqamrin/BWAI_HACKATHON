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
  'M-104:S-VAULT': {
    engagement_health: 70,
    confidence: 86,
    reasoning: 'ICP and sales sequence work improved the sales motion, while mixed pipeline quality keeps the relationship on watch.',
    signals: {
      positive: ['ICP clarified', 'Sales sequence revised', 'Mentor confidence at 8/10'],
      negative: ['Pipeline quality is still mixed'],
    },
    recommended_action: 'Pressure-test three qualified opportunities before the next growth review.',
  },
  'M-221:S-HELIOS': {
    engagement_health: 49,
    confidence: 76,
    reasoning:
      'The hiring plan was reviewed, but low sync hours and dipped founder confidence after a missed sprint keep this relationship at risk.',
    signals: {
      positive: ['Hiring plan reviewed'],
      negative: ['Low sync hours', 'Founder confidence dipped after missed sprint', 'Mentor confidence remains 5/10'],
    },
    recommended_action: 'Reset the founder operating cadence before returning to hiring plan execution.',
  },
  'M-207:S-FERN': {
    engagement_health: 76,
    confidence: 88,
    reasoning:
      'Retention analysis and success metrics are complete, with only customer expansion ownership left to clarify.',
    signals: {
      positive: ['Retention analysis completed', 'Success metrics completed', 'Founder and mentor confidence aligned at 8/10'],
      negative: ['Customer expansion owner is unclear'],
    },
    recommended_action: 'Assign the customer expansion owner before the next success metrics review.',
  },
  'M-410:S-LOOP': {
    engagement_health: 62,
    confidence: 82,
    reasoning:
      'Enterprise proposal work is active, but the procurement objection remains unresolved and limits the LoopPay enterprise path.',
    signals: {
      positive: ['Enterprise proposal draft reviewed', 'Confidence scores aligned at 7/10'],
      negative: ['Procurement objection remains unresolved'],
    },
    recommended_action: 'Run a procurement objection review with the procurement coach and GTM partner together.',
  },
  'M-319:S-NOVA': {
    engagement_health: 85,
    confidence: 91,
    reasoning: 'Launch checklist and demo narrative are finalized, with scheduling as the only visible blocker.',
    signals: {
      positive: ['Launch checklist finalized', 'Demo narrative finalized', 'Founder confidence at 9/10'],
      negative: ['Scheduling remains the only blocker'],
    },
    recommended_action: 'Lock launch rehearsal time and convert the checklist into owner-level tasks.',
  },
  'M-058:S-HELIOS': {
    engagement_health: 64,
    confidence: 83,
    reasoning:
      'The sprint plan was rebuilt with a measurable owner, and the technical blocker was reduced but still needs closure.',
    signals: {
      positive: ['Sprint plan rebuilt', 'Measurable owner assigned', 'Technical blocker reduced'],
      negative: ['Technical blocker is not closed'],
    },
    recommended_action: 'Keep the technical mentor attached until the blocker has a verified closure signal.',
  },
  'M-221:S-PULSE': {
    engagement_health: 57,
    confidence: 80,
    reasoning:
      'Clinical validation work moved forward, but founder uncertainty around regulatory sequencing keeps PulseGrid on watch.',
    signals: {
      positive: ['Clinical validation memo reviewed'],
      negative: ['Founder remains uncertain on regulatory sequencing', 'Confidence scores are 6/10'],
    },
    recommended_action: 'Create a regulatory sequencing owner map before the next clinical validation review.',
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
