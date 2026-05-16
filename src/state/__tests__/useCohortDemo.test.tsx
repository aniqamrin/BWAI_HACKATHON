import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { baselineRelationships } from '../../domain/sampleCohort';
import type { CohortSyncRow } from '../../domain/types';
import { useCohortDemo } from '../useCohortDemo';

const sampleRows: CohortSyncRow[] = [
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

function installLocalStorage() {
  const storage = new Map<string, string>();

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
      }),
      removeItem: vi.fn((key: string) => {
        storage.delete(key);
      }),
      clear: vi.fn(() => {
        storage.clear();
      }),
    },
  });
}

async function processSampleRows(result: { current: ReturnType<typeof useCohortDemo> }) {
  act(() => {
    result.current.processRows(sampleRows);
  });

  await act(async () => {
    vi.runAllTimers();
  });

  expect(result.current.phase).toBe('processed');
}

describe('useCohortDemo', () => {
  beforeEach(() => {
    installLocalStorage();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it('starts in baseline state', () => {
    const { result } = renderHook(() => useCohortDemo());

    expect(result.current.phase).toBe('baseline');
    expect(result.current.relationships).toEqual(baselineRelationships);
    expect(result.current.drawerOpen).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.evaluation).toBeNull();
    expect(result.current.steps.every((step) => step.status === 'pending')).toBe(true);
  });

  it('processes rows to processed state and opens the drawer', async () => {
    const { result } = renderHook(() => useCohortDemo());

    act(() => {
      result.current.processRows(sampleRows);
    });

    expect(result.current.phase).toBe('processing');
    expect(result.current.drawerOpen).toBe(false);

    await act(async () => {
      vi.runAllTimers();
    });

    expect(result.current.phase).toBe('processed');
    expect(result.current.drawerOpen).toBe(true);
    expect(result.current.steps.every((step) => step.status === 'done')).toBe(true);
  });

  it('updates at least one relationship from baseline after processing', async () => {
    const { result } = renderHook(() => useCohortDemo());

    await processSampleRows(result);

    const updatedLoopPay = result.current.relationships.find((relationship) => relationship.id === 'M-104:S-LOOP');
    const baselineLoopPay = baselineRelationships.find((relationship) => relationship.id === 'M-104:S-LOOP');

    expect(updatedLoopPay?.currentHealth).not.toBe(baselineLoopPay?.currentHealth);
    expect(updatedLoopPay?.currentHealth).toBe(82);
    expect(updatedLoopPay?.status).toBe('healthy');
    expect(updatedLoopPay?.hoursSynced).toBe(7);
  });

  it('resets processed state to baseline and closes the drawer', async () => {
    const { result } = renderHook(() => useCohortDemo());
    await processSampleRows(result);

    act(() => {
      result.current.resetDemo();
    });

    expect(result.current.phase).toBe('baseline');
    expect(result.current.relationships).toEqual(baselineRelationships);
    expect(result.current.drawerOpen).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.evaluation).toBeNull();
    expect(result.current.steps.every((step) => step.status === 'pending')).toBe(true);
  });

  it('loads persisted processed state with the drawer open', async () => {
    const firstHook = renderHook(() => useCohortDemo());
    await processSampleRows(firstHook.result);
    firstHook.unmount();

    const { result } = renderHook(() => useCohortDemo());

    expect(result.current.phase).toBe('processed');
    expect(result.current.drawerOpen).toBe(true);
    expect(result.current.evaluation?.processedRows).toBe(sampleRows.length);
    expect(result.current.relationships.find((relationship) => relationship.id === 'M-104:S-LOOP')?.currentHealth).toBe(82);
  });

  it('falls back to baseline when persisted state is malformed', () => {
    localStorage.setItem('cohort-atlas-demo-state', '{not-json');

    const { result } = renderHook(() => useCohortDemo());

    expect(result.current.phase).toBe('baseline');
    expect(result.current.drawerOpen).toBe(false);
    expect(result.current.relationships).toEqual(baselineRelationships);
  });
});
