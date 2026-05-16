import { useState } from 'react';
import { AppShell } from './components/AppShell';
import { CohortGraph } from './components/CohortGraph';
import { CohortMetrics } from './components/CohortMetrics';
import { DashboardHeader } from './components/DashboardHeader';
import { InsightDrawer } from './components/InsightDrawer';
import { IngestionPanel } from './components/IngestionPanel';
import { ProcessingTimeline } from './components/ProcessingTimeline';
import { StatusLegend } from './components/StatusLegend';
import { mentors, startups } from './domain/sampleCohort';
import { useCohortDemo } from './state/useCohortDemo';

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export default function App() {
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
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
  const handleProcessRows: typeof processRows = (rows) => {
    setSelectedRelationshipId(null);
    processRows(rows);
  };
  const handleFailWithMessage: typeof failWithMessage = (message) => {
    setSelectedRelationshipId(null);
    failWithMessage(message);
  };
  const handleResetDemo = () => {
    setSelectedRelationshipId(null);
    resetDemo();
  };
  const handleCloseDrawer = () => {
    setSelectedRelationshipId(null);
    setDrawerOpen(false);
  };
  const handleClearSelection = () => {
    setSelectedRelationshipId(null);
    setDrawerOpen(true);
  };

  return (
    <AppShell>
      <DashboardHeader
        phase={phase}
        cohortPeriod="May 2026 cohort period"
        baselineHealth={baselineHealth}
        refreshedHealth={evaluation?.cohortHealth ?? null}
        onReset={handleResetDemo}
      />
      <CohortMetrics relationships={relationships} evaluation={evaluation} />
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_390px] gap-0">
        <section className="flex min-h-[520px] flex-col border-r border-[#17211c] p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="ui-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#6c715f]">
                Relationship surface
              </p>
              <h2 className="mt-3 text-4xl font-semibold leading-none">Mentor-startup relationship graph</h2>
            </div>
            <div className="grid w-[360px] gap-3">
              <div className="ui-sans grid grid-cols-3 border border-[#9d8f77] bg-[#fffaf0] text-center">
                <div className="border-r border-[#9d8f77] px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#657064]">Healthy</p>
                  <p className="mt-1 text-2xl font-semibold text-[#17211c]">{statusCounts.healthy}</p>
                </div>
                <div className="border-r border-[#9d8f77] px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#657064]">Watch</p>
                  <p className="mt-1 text-2xl font-semibold text-[#17211c]">{statusCounts.watch}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#657064]">At risk</p>
                  <p className="mt-1 text-2xl font-semibold text-[#17211c]">{statusCounts.atRisk}</p>
                </div>
              </div>
              <StatusLegend />
            </div>
          </div>

          <div className="mt-8 flex flex-1 border border-[#9d8f77] bg-[#fffaf0]">
            <CohortGraph
              relationships={relationships}
              mentors={mentors}
              startups={startups}
              onSelectRelationship={(relationshipId) => {
                setSelectedRelationshipId(relationshipId);
                setDrawerOpen(true);
              }}
            />
          </div>
        </section>

        <aside className="space-y-5 p-6">
          {errorMessage ? (
            <div className="ui-sans border border-[#8f3d34] bg-[#fff2ed] p-4 text-sm font-semibold leading-6 text-[#713026]">
              {errorMessage}
            </div>
          ) : null}
          <IngestionPanel onRows={handleProcessRows} onError={handleFailWithMessage} />
          <ProcessingTimeline steps={displayedSteps} />
          <InsightDrawer
            open={drawerOpen}
            evaluation={evaluation}
            relationships={relationships}
            mentors={mentors}
            startups={startups}
            selectedRelationshipId={selectedRelationshipId}
            onClose={handleCloseDrawer}
            onClearSelection={handleClearSelection}
          />
        </aside>
      </div>
    </AppShell>
  );
}
