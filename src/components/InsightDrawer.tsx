import { RelationshipCard } from './RelationshipCard';
import type { CohortEvaluation, Mentor, Relationship, Startup } from '../domain/types';

type InsightDrawerProps = {
  open: boolean;
  evaluation: CohortEvaluation | null;
  relationships: Relationship[];
  mentors: Mentor[];
  startups: Startup[];
  selectedRelationshipId: string | null;
  onClose: () => void;
  onClearSelection: () => void;
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatDelta(value: number) {
  if (value === 0) return 'flat';
  return `${value > 0 ? '+' : ''}${value} pts`;
}

export function InsightDrawer({
  open,
  evaluation,
  relationships,
  mentors,
  startups,
  selectedRelationshipId,
  onClose,
  onClearSelection,
}: InsightDrawerProps) {
  if (!open || !evaluation) return null;

  const mentorById = new Map(mentors.map((mentor) => [mentor.id, mentor]));
  const startupById = new Map(startups.map((startup) => [startup.id, startup]));
  const relationshipById = new Map(relationships.map((relationship) => [relationship.id, relationship]));
  const evaluationById = new Map(
    evaluation.relationshipEvaluations.map((relationshipEvaluation) => [
      relationshipEvaluation.relationshipId,
      relationshipEvaluation,
    ]),
  );
  const selectedRelationship = selectedRelationshipId ? relationshipById.get(selectedRelationshipId) : undefined;
  const selectedEvaluation = selectedRelationshipId ? evaluationById.get(selectedRelationshipId) : undefined;
  const baselineHealth = average(relationships.map((relationship) => relationship.baselineHealth));
  const improvedCount = evaluation.relationshipEvaluations.filter((relationship) => relationship.health_delta > 0).length;
  const recoveredCount = evaluation.relationshipEvaluations.filter(
    (relationship) => relationship.previous_health < 50 && relationship.engagement_health >= 50,
  ).length;
  const rankedEvaluations = [...evaluation.relationshipEvaluations]
    .sort((left, right) => right.health_delta - left.health_delta || right.engagement_health - left.engagement_health)
    .slice(0, 4);

  if (selectedRelationship) {
    const mentor = mentorById.get(selectedRelationship.mentorId);
    const startup = startupById.get(selectedRelationship.startupId);

    return (
      <aside className="transition-surface border border-[#17211c] bg-[#fffaf0] p-5 shadow-[6px_6px_0_#9d8f77]" aria-label="Relationship insight drawer">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ui-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#6c715f]">
              Relationship detail
            </p>
            <h2 className="mt-2 text-2xl font-semibold leading-tight">Selected relationship review</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-sans border border-[#9d8f77] bg-[#f7f1e5] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#17211c] transition hover:bg-[#ede4d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]"
          >
            Close
          </button>
        </div>

        <div className="mt-5">
          <RelationshipCard
            relationship={selectedRelationship}
            evaluation={selectedEvaluation}
            mentor={mentor}
            startup={startup}
            variant="detail"
          />
        </div>

        <button
          type="button"
          onClick={onClearSelection}
          className="ui-sans mt-5 border border-[#9d8f77] bg-[#f7f1e5] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#17211c] transition hover:bg-[#ede4d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]"
        >
          Back to cohort view
        </button>
      </aside>
    );
  }

  return (
    <aside className="transition-surface border border-[#17211c] bg-[#fffaf0] p-5 shadow-[6px_6px_0_#9d8f77]" aria-label="Executive insight drawer">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ui-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#6c715f]">Executive review</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight">Cohort-level insight drawer</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ui-sans border border-[#9d8f77] bg-[#f7f1e5] px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#17211c] transition hover:bg-[#ede4d1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#17211c]"
        >
          Close
        </button>
      </div>

      <p className="mt-4 text-lg leading-7 text-[#314036]">{evaluation.executiveSummary}</p>

      <div className="ui-sans mt-5 grid grid-cols-2 gap-3">
        <div className="border border-[#9d8f77] bg-[#f7f1e5] p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#6c715f]">Rows processed</p>
          <p className="mt-2 text-2xl font-semibold text-[#17211c]">{evaluation.processedRows}</p>
        </div>
        <div className="border border-[#9d8f77] bg-[#f7f1e5] p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#6c715f]">Confidence</p>
          <p className="mt-2 text-2xl font-semibold text-[#17211c]">{evaluation.confidence}%</p>
        </div>
        <div className="border border-[#9d8f77] bg-[#f7f1e5] p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#6c715f]">Cohort health</p>
          <p className="mt-2 text-2xl font-semibold text-[#17211c]">
            {evaluation.cohortHealth} <span className="text-sm text-[#59675e]">{formatDelta(evaluation.cohortHealth - baselineHealth)}</span>
          </p>
        </div>
        <div className="border border-[#9d8f77] bg-[#f7f1e5] p-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#6c715f]">Edges improved</p>
          <p className="mt-2 text-2xl font-semibold text-[#17211c]">
            {improvedCount} <span className="text-sm text-[#59675e]">{recoveredCount} recovered</span>
          </p>
        </div>
      </div>

      <section className="mt-6" aria-label="Ranked relationship evaluations">
        <p className="ui-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#6c715f]">
          Ranked relationship evaluations
        </p>
        <div className="mt-3 grid gap-4">
          {rankedEvaluations.map((relationshipEvaluation, index) => {
            const relationship = relationshipById.get(relationshipEvaluation.relationshipId);
            if (!relationship) return null;

            return (
              <RelationshipCard
                key={relationshipEvaluation.relationshipId}
                relationship={relationship}
                evaluation={relationshipEvaluation}
                mentor={mentorById.get(relationship.mentorId)}
                startup={startupById.get(relationship.startupId)}
                rank={index + 1}
              />
            );
          })}
        </div>
      </section>
    </aside>
  );
}
