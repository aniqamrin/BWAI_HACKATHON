import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const sampleCsv = `mentor_id,startup_id,hours_synced,milestones_completed,blockers_identified,founder_confidence_score,mentor_confidence_score
M-104,S-LOOP,7,Drafted GTM strategy and completed pricing test,Enterprise buyer intro still blocked by unclear champion,8,8
M-207,S-ORBIT,6,Refined investor narrative and resolved pilot objections,Needs stronger proof around deployment timeline,8,9
M-116,S-NORTH,4,Reviewed onboarding map,Next milestone owner unclear and founder follow-through uneven,5,6
M-319,S-KIN,8,Closed first design partner and reviewed renewal plan,No material blocker identified this month,9,9
M-058,S-PULSE,5,Completed technical risk review,Integration blocker escalated to product mentor,6,7
M-104,S-VAULT,6,Clarified ICP and revised sales sequence,Pipeline quality still mixed,7,8
M-221,S-HELIOS,3,Reviewed hiring plan,Low sync hours and founder confidence dipped after missed sprint,4,5
M-207,S-FERN,7,Completed retention analysis and success metrics,Needs clearer customer expansion owner,8,8
M-410,S-LOOP,5,Reviewed enterprise proposal draft,Procurement objection still unresolved,7,7
M-319,S-NOVA,8,Finalized launch checklist and demo narrative,No blocker identified beyond scheduling,9,8
M-058,S-HELIOS,6,Rebuilt sprint plan with measurable owner,Technical blocker reduced but not closed,7,7
M-221,S-PULSE,4,Reviewed clinical validation memo,Founder remains uncertain on regulatory sequencing,6,6`;

function createStorageStub() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
  };
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageStub());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the dashboard shell', () => {
    render(<App />);

    expect(screen.getByText('Cohort Atlas')).toBeVisible();
    expect(screen.getByText('Mentor-startup relationship graph')).toBeVisible();
    expect(screen.getByRole('button', { name: /reset demo/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /process raw information/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /use sample csv/i })).toBeVisible();
  });

  it('processes the sample CSV and resets back to baseline', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(sampleCsv, { status: 200 })),
    );

    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /process raw information/i }));

    expect(await screen.findByText('Baseline 48 -> refreshed 70 (+22 pts).')).toBeVisible();
    expect(screen.getByText('85%')).toBeVisible();
    expect(screen.getByText('12 monthly rows processed.')).toBeVisible();
    expect(screen.getByText('Mentor-startup relationship graph')).toBeVisible();
    expect(screen.getByText('Executive review drawer')).toBeVisible();
    expect(
      screen.getByText(/Monthly mentor records show materially stronger cohort signal/i),
    ).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /reset demo/i }));

    expect(screen.getByText('Baseline cohort health is holding at 48 pending the monthly sync.')).toBeVisible();
    expect(screen.getByText('Pending')).toBeVisible();
    expect(screen.queryByText('Executive review drawer')).not.toBeInTheDocument();
  });
});
