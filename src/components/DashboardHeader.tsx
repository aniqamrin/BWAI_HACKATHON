import { RotateCcw } from 'lucide-react';
import type { DemoPhase } from '../state/useCohortDemo';

type DashboardHeaderProps = {
  phase: DemoPhase;
  cohortPeriod: string;
  baselineHealth: number;
  refreshedHealth: number | null;
  onReset: () => void;
};

function headlineFor(phase: DemoPhase, baselineHealth: number, refreshedHealth: number | null) {
  if (phase === 'processing') return 'Monthly sync is being reconciled against the baseline cohort ledger.';
  if (phase === 'error') return 'Monthly sync needs correction before the executive review can refresh.';
  if (refreshedHealth !== null) {
    const delta = refreshedHealth - baselineHealth;
    const direction = delta >= 0 ? '+' : '';
    return `Baseline ${baselineHealth} -> refreshed ${refreshedHealth} (${direction}${delta} pts).`;
  }
  return `Baseline cohort health is holding at ${baselineHealth} pending the monthly sync.`;
}

export function DashboardHeader({
  phase,
  cohortPeriod,
  baselineHealth,
  refreshedHealth,
  onReset,
}: DashboardHeaderProps) {
  return (
    <header className="grid grid-cols-[1fr_auto] gap-6 border-b border-[#17211c] px-6 py-5">
      <div>
        <p className="ui-sans text-xs font-semibold uppercase tracking-[0.16em] text-[#657064]">
          {cohortPeriod}
        </p>
        <div className="mt-2 flex items-end gap-4">
          <h1 className="text-5xl font-semibold leading-none tracking-normal text-[#17211c]">Cohort Atlas</h1>
          <span className="ui-sans mb-2 border border-[#9d8f77] px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#5d4d35]">
            Executive review
          </span>
        </div>
        <p className="mt-3 max-w-3xl text-xl leading-snug text-[#314036]">
          {headlineFor(phase, baselineHealth, refreshedHealth)}
        </p>
      </div>
      <div className="flex items-start">
        <button
          type="button"
          onClick={onReset}
          className="ui-sans inline-flex items-center gap-2 border border-[#17211c] bg-[#17211c] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#f7f1e5] transition hover:bg-[#2b382f] focus:outline-2 focus:outline-offset-2 focus:outline-[#17211c]"
        >
          <RotateCcw size={16} strokeWidth={2} aria-hidden="true" />
          Reset Demo
        </button>
      </div>
    </header>
  );
}
