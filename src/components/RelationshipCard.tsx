import type { HealthStatus, Mentor, Relationship, RelationshipEvaluation, Startup } from '../domain/types';

type RelationshipCardProps = {
  relationship: Relationship;
  evaluation?: RelationshipEvaluation;
  mentor?: Mentor;
  startup?: Startup;
  rank?: number;
  variant?: 'summary' | 'detail';
};

const statusLabel: Record<HealthStatus, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  'at-risk': 'At risk',
};

const statusClasses: Record<HealthStatus, string> = {
  healthy: 'border-[#47594e] text-[#314036]',
  watch: 'border-[#b28c55] text-[#5d4d35]',
  'at-risk': 'border-[#8f3d34] text-[#713026]',
};

function formatDelta(value: number) {
  if (value === 0) return 'No change';
  return `${value > 0 ? '+' : ''}${value}`;
}

export function RelationshipCard({
  relationship,
  evaluation,
  mentor,
  startup,
  rank,
  variant = 'summary',
}: RelationshipCardProps) {
  const mentorLabel = mentor?.name ?? relationship.mentorId;
  const startupLabel = startup?.name ?? relationship.startupId;
  const currentHealth = evaluation?.engagement_health ?? relationship.currentHealth;
  const delta = evaluation?.health_delta ?? currentHealth - relationship.baselineHealth;
  const reasoning = evaluation?.reasoning ?? relationship.rationale;
  const action = evaluation?.recommended_action ?? relationship.recommendedAction;
  const positiveSignals = evaluation?.signals.positive ?? [];
  const negativeSignals = evaluation?.signals.negative ?? [];
  const isDetail = variant === 'detail';

  return (
    <article className={`transition-surface border-l-4 bg-[#fffaf0] py-4 pl-4 pr-3 ${statusClasses[relationship.status]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ui-sans text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#6c715f]">
            {rank ? `Rank ${rank}` : statusLabel[relationship.status]}
          </p>
          <h3 className="mt-1 text-xl font-semibold leading-tight text-[#17211c]">
            {mentorLabel} {'->'} {startupLabel}
          </h3>
        </div>
        <div className="ui-sans shrink-0 border border-[#9d8f77] bg-[#f7f1e5] px-3 py-2 text-right">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#6c715f]">Health</p>
          <p className="mt-1 text-lg font-semibold leading-none text-[#17211c]">
            {currentHealth} <span className="text-sm text-[#59675e]">({formatDelta(delta)})</span>
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#314036]">{reasoning}</p>
      <p className="ui-sans mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#17211c]">Next action</p>
      <p className="mt-1 text-sm leading-6 text-[#4c574f]">{action}</p>

      {isDetail ? (
        <div className="ui-sans mt-4 grid grid-cols-2 gap-3 text-xs leading-5">
          <div className="border border-[#9d8f77] bg-[#f7f1e5] p-3">
            <p className="font-semibold uppercase tracking-[0.1em] text-[#47594e]">Positive signal</p>
            <p className="mt-2 text-[#314036]">{positiveSignals[0] ?? relationship.lastSignal}</p>
          </div>
          <div className="border border-[#9d8f77] bg-[#f7f1e5] p-3">
            <p className="font-semibold uppercase tracking-[0.1em] text-[#8f3d34]">Risk signal</p>
            <p className="mt-2 text-[#314036]">{negativeSignals[0] ?? 'No urgent blocker surfaced.'}</p>
          </div>
        </div>
      ) : null}
    </article>
  );
}
