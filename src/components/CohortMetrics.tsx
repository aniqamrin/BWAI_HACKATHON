import type { CohortEvaluation, Relationship } from '../domain/types';

type CohortMetricsProps = {
  relationships: Relationship[];
  evaluation: CohortEvaluation | null;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatDelta(value: number) {
  if (value === 0) return 'No change';
  return `${value > 0 ? '+' : ''}${value} pts`;
}

export function CohortMetrics({ relationships, evaluation }: CohortMetricsProps) {
  const baselineHealth = average(relationships.map((relationship) => relationship.baselineHealth));
  const currentHealth = evaluation?.cohortHealth ?? average(relationships.map((relationship) => relationship.currentHealth));
  const atRiskCount = relationships.filter((relationship) => relationship.status === 'at-risk').length;
  const watchCount = relationships.filter((relationship) => relationship.status === 'watch').length;
  const improvedCount = relationships.filter(
    (relationship) => relationship.currentHealth > relationship.baselineHealth,
  ).length;

  const metrics = [
    {
      label: 'Cohort health',
      value: currentHealth.toString(),
      detail: `Baseline ${baselineHealth}. ${formatDelta(currentHealth - baselineHealth)} after sync.`,
    },
    {
      label: 'Relationships reviewed',
      value: relationships.length.toString(),
      detail: `${improvedCount} improved against baseline ledger.`,
    },
    {
      label: 'Watchlist load',
      value: `${atRiskCount + watchCount}`,
      detail: `${atRiskCount} at risk, ${watchCount} on watch.`,
    },
    {
      label: 'Evaluator confidence',
      value: evaluation ? `${evaluation.confidence}%` : 'Pending',
      detail: evaluation ? `${evaluation.processedRows} monthly rows processed.` : 'Awaiting CSV ingestion.',
    },
  ];

  return (
    <section className="grid grid-cols-4 border-b border-[#17211c]">
      {metrics.map((metric) => (
        <article key={metric.label} className="min-h-28 border-r border-[#17211c] px-6 py-4 last:border-r-0">
          <p className="ui-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#6c715f]">{metric.label}</p>
          <p className="mt-3 text-4xl font-semibold leading-none text-[#17211c]">{metric.value}</p>
          <p className="ui-sans mt-3 text-xs leading-5 text-[#4c574f]">{metric.detail}</p>
        </article>
      ))}
    </section>
  );
}
