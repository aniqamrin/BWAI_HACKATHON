import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateCohortSync } from '../domain/evaluator';
import { baselineRelationships, statusFromHealth } from '../domain/sampleCohort';
import type { CohortEvaluation, CohortSyncRow, Relationship, RelationshipEvaluation } from '../domain/types';

export type DemoPhase = 'baseline' | 'processing' | 'processed' | 'error';

export type ProcessingStep = {
  id: 'parse' | 'evaluate' | 'graph' | 'summary';
  label: string;
  detail: string;
  status: 'pending' | 'active' | 'done';
};

type PersistedDemoState = {
  relationships: Relationship[];
  evaluation: CohortEvaluation;
};

const STORAGE_KEY = 'cohort-atlas-demo-state';

const BASE_STEPS: ProcessingStep[] = [
  {
    id: 'parse',
    label: 'Parse rows',
    detail: 'Validate monthly mentor-startup records',
    status: 'pending',
  },
  {
    id: 'evaluate',
    label: 'Evaluate fit',
    detail: 'Score time, confidence, milestones, and blockers',
    status: 'pending',
  },
  {
    id: 'graph',
    label: 'Update graph',
    detail: 'Prepare relationship health transitions',
    status: 'pending',
  },
  {
    id: 'summary',
    label: 'Prepare summary',
    detail: 'Draft cohort narrative and actions',
    status: 'pending',
  },
];

function freshBaselineRelationships() {
  return baselineRelationships.map((relationship) => ({ ...relationship }));
}

function freshSteps() {
  return BASE_STEPS.map((step) => ({ ...step }));
}

function relationshipIdFor(row: CohortSyncRow) {
  return `${row.mentor_id}:${row.startup_id}`;
}

function isRelationship(value: unknown): value is Relationship {
  if (!value || typeof value !== 'object') return false;
  const relationship = value as Partial<Relationship>;
  return (
    typeof relationship.id === 'string' &&
    typeof relationship.mentorId === 'string' &&
    typeof relationship.startupId === 'string' &&
    typeof relationship.baselineHealth === 'number' &&
    typeof relationship.currentHealth === 'number' &&
    (relationship.status === 'healthy' || relationship.status === 'watch' || relationship.status === 'at-risk') &&
    typeof relationship.hoursSynced === 'number' &&
    typeof relationship.lastSignal === 'string' &&
    typeof relationship.rationale === 'string' &&
    typeof relationship.recommendedAction === 'string'
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isRelationshipEvaluation(value: unknown): value is RelationshipEvaluation {
  if (!value || typeof value !== 'object') return false;
  const evaluation = value as Partial<RelationshipEvaluation>;
  const signals = evaluation.signals as Partial<RelationshipEvaluation['signals']> | undefined;

  return (
    typeof evaluation.relationshipId === 'string' &&
    typeof evaluation.engagement_health === 'number' &&
    typeof evaluation.previous_health === 'number' &&
    typeof evaluation.health_delta === 'number' &&
    typeof evaluation.confidence === 'number' &&
    typeof evaluation.reasoning === 'string' &&
    typeof evaluation.recommended_action === 'string' &&
    Boolean(signals) &&
    typeof signals === 'object' &&
    isStringArray(signals.positive) &&
    isStringArray(signals.negative)
  );
}

function isEvaluation(value: unknown): value is CohortEvaluation {
  if (!value || typeof value !== 'object') return false;
  const evaluation = value as Partial<CohortEvaluation>;
  return (
    typeof evaluation.processedRows === 'number' &&
    typeof evaluation.cohortHealth === 'number' &&
    typeof evaluation.confidence === 'number' &&
    typeof evaluation.executiveSummary === 'string' &&
    Array.isArray(evaluation.relationshipEvaluations) &&
    evaluation.relationshipEvaluations.every(isRelationshipEvaluation)
  );
}

function readPersistedState(): PersistedDemoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedDemoState>;
    if (!Array.isArray(parsed.relationships) || !parsed.relationships.every(isRelationship)) return null;
    if (!isEvaluation(parsed.evaluation)) return null;

    return {
      relationships: parsed.relationships,
      evaluation: parsed.evaluation,
    };
  } catch {
    return null;
  }
}

function persistState(next: PersistedDemoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Persistence should never block the local demo flow.
  }
}

function removePersistedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage availability issues during reset.
  }
}

function applyEvaluation(rows: CohortSyncRow[]) {
  const evaluation = evaluateCohortSync(rows);
  const rowsByRelationship = new Map(rows.map((row) => [relationshipIdFor(row), row]));
  const evaluationsByRelationship = new Map(
    evaluation.relationshipEvaluations.map((relationship) => [relationship.relationshipId, relationship]),
  );

  const relationships = freshBaselineRelationships().map((relationship) => {
    const result = evaluationsByRelationship.get(relationship.id);
    const row = rowsByRelationship.get(relationship.id);
    if (!result) return relationship;

    return {
      ...relationship,
      currentHealth: result.engagement_health,
      status: statusFromHealth(result.engagement_health),
      rationale: result.reasoning,
      recommendedAction: result.recommended_action,
      hoursSynced: row?.hours_synced ?? relationship.hoursSynced,
      lastSignal: result.signals.positive[0] ?? result.signals.negative[0] ?? relationship.lastSignal,
    };
  });

  return { relationships, evaluation };
}

export function useCohortDemo() {
  const persisted = useMemo(readPersistedState, []);
  const timersRef = useRef<number[]>([]);
  const [phase, setPhase] = useState<DemoPhase>(persisted ? 'processed' : 'baseline');
  const [relationships, setRelationships] = useState<Relationship[]>(
    persisted?.relationships ?? freshBaselineRelationships(),
  );
  const [evaluation, setEvaluation] = useState<CohortEvaluation | null>(persisted?.evaluation ?? null);
  const [steps, setSteps] = useState<ProcessingStep[]>(freshSteps);
  const [drawerOpen, setDrawerOpen] = useState(Boolean(persisted));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      window.clearTimeout(timer);
    }
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const queueTimer = useCallback(
    (callback: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        timersRef.current = timersRef.current.filter((queuedTimer) => queuedTimer !== timer);
        callback();
      }, delay);
      timersRef.current.push(timer);
    },
    [],
  );

  const markStep = useCallback((activeIndex: number) => {
    setSteps((current) =>
      current.map((step, stepIndex) => {
        if (stepIndex < activeIndex) return { ...step, status: 'done' };
        if (stepIndex === activeIndex) return { ...step, status: 'active' };
        return { ...step, status: 'pending' };
      }),
    );
  }, []);

  const processRows = useCallback(
    (rows: CohortSyncRow[]) => {
      clearTimers();
      setPhase('processing');
      setDrawerOpen(false);
      setErrorMessage(null);
      setSteps(freshSteps());

      [0, 1, 2, 3].forEach((stepIndex) => {
        queueTimer(() => markStep(stepIndex), stepIndex * 180);
      });

      queueTimer(() => {
        const next = applyEvaluation(rows);
        setRelationships(next.relationships);
        setEvaluation(next.evaluation);
        setSteps((current) => current.map((step) => ({ ...step, status: 'done' })));
        setPhase('processed');
        setDrawerOpen(true);
        persistState(next);
      }, 820);
    },
    [clearTimers, markStep, queueTimer],
  );

  const failWithMessage = useCallback(
    (message: string) => {
      clearTimers();
      setPhase('error');
      setErrorMessage(message);
      setDrawerOpen(false);
      setSteps(freshSteps());
    },
    [clearTimers],
  );

  const resetDemo = useCallback(() => {
    clearTimers();
    removePersistedState();
    setPhase('baseline');
    setRelationships(freshBaselineRelationships());
    setEvaluation(null);
    setDrawerOpen(false);
    setErrorMessage(null);
    setSteps(freshSteps());
  }, [clearTimers]);

  return {
    phase,
    relationships,
    evaluation,
    steps,
    drawerOpen,
    errorMessage,
    setDrawerOpen,
    processRows,
    failWithMessage,
    resetDemo,
  };
}
