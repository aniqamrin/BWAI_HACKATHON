import { AppShell } from './components/AppShell';
import { CohortMetrics } from './components/CohortMetrics';
import { DashboardHeader } from './components/DashboardHeader';
import { IngestionPanel } from './components/IngestionPanel';
import { ProcessingTimeline } from './components/ProcessingTimeline';
import { useCohortDemo } from './state/useCohortDemo';

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function App() {
  const {
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
  } = useCohortDemo();
  const baselineHealth = average(relationships.map((relationship) => relationship.baselineHealth));
  const statusCounts = {
    healthy: relationships.filter((relationship) => relationship.status === 'healthy').length,
    watch: relationships.filter((relationship) => relationship.status === 'watch').length,
    atRisk: relationships.filter((relationship) => relationship.status === 'at-risk').length,
  };
  const displayedSteps =
    phase === 'processed' ? steps.map((step) => ({ ...step, status: 'done' as const })) : steps;

  return (
    <AppShell>
      <DashboardHeader
        phase={phase}
        cohortPeriod="May 2026 cohort period"
        baselineHealth={baselineHealth}
        refreshedHealth={evaluation?.cohortHealth ?? null}
        onReset={resetDemo}
      />
      <CohortMetrics relationships={relationships} evaluation={evaluation} />
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_390px] gap-0">
        <section className="flex min-h-[520px] flex-col border-r border-[#17211c] p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="ui-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#6c715f]">
                Relationship surface
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-none">Graph surface lands in Task 5</h2>
            </div>
            <span className="ui-sans border border-[#9d8f77] bg-[#fffaf0] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#5d4d35]">
              Temporary panel
            </span>
          </div>

          <div className="mt-8 flex flex-1 flex-col border border-[#9d8f77] bg-[#fffaf0] p-6">
            <div className="grid grid-cols-3 border border-[#9d8f77]">
              <div className="border-r border-[#9d8f77] p-4">
                <p className="ui-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#657064]">Healthy</p>
                <p className="mt-3 text-4xl font-semibold leading-none">{statusCounts.healthy}</p>
              </div>
              <div className="border-r border-[#9d8f77] p-4">
                <p className="ui-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#657064]">Watch</p>
                <p className="mt-3 text-4xl font-semibold leading-none">{statusCounts.watch}</p>
              </div>
              <div className="p-4">
                <p className="ui-sans text-xs font-semibold uppercase tracking-[0.12em] text-[#657064]">At risk</p>
                <p className="mt-3 text-4xl font-semibold leading-none">{statusCounts.atRisk}</p>
              </div>
            </div>
            <div className="mt-8 grid flex-1 grid-cols-[1fr_1.35fr_1fr] items-center gap-6">
              <div className="space-y-4">
                <span className="block h-3 w-2/3 bg-[#47594e]" />
                <span className="block h-3 w-5/6 bg-[#7c856e]" />
                <span className="block h-3 w-1/2 bg-[#b28c55]" />
              </div>
              <div className="flex aspect-square items-center justify-center border border-[#17211c] bg-[#f7f1e5]">
                <div className="flex size-44 items-center justify-center border border-[#9d8f77]">
                  <div className="size-20 border border-[#17211c] bg-[#ede4d1]" />
                </div>
              </div>
              <div className="space-y-4">
                <span className="ml-auto block h-3 w-4/5 bg-[#47594e]" />
                <span className="ml-auto block h-3 w-2/3 bg-[#7c856e]" />
                <span className="ml-auto block h-3 w-1/2 bg-[#8f3d34]" />
              </div>
            </div>
          </div>

          <p className="ui-sans mt-6 max-w-2xl text-sm leading-6 text-[#59675e]">
            This placeholder previews the executive review density only. Task 5 will replace it with the relationship
            graph surface and interaction model.
          </p>
        </section>

        <aside className="space-y-5 p-6">
          {errorMessage ? (
            <div className="ui-sans border border-[#8f3d34] bg-[#fff2ed] p-4 text-sm font-semibold leading-6 text-[#713026]">
              {errorMessage}
            </div>
          ) : null}
          <IngestionPanel onRows={processRows} onError={failWithMessage} />
          <ProcessingTimeline steps={displayedSteps} />
          {evaluation && drawerOpen ? (
            <section className="border border-[#17211c] bg-[#fffaf0] p-5 shadow-[6px_6px_0_#9d8f77]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="ui-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#6c715f]">
                    Executive review drawer
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold leading-tight">Temporary Task 6 outlet</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="ui-sans border border-[#9d8f77] bg-[#f7f1e5] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#17211c] transition hover:bg-[#ede4d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]"
                >
                  Hide
                </button>
              </div>
              <p className="mt-4 text-lg leading-7 text-[#314036]">{evaluation.executiveSummary}</p>
              <p className="ui-sans mt-4 text-sm leading-6 text-[#59675e]">
                This reserves the right-side review outlet only. Task 6 will replace it with the real drawer contents.
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
