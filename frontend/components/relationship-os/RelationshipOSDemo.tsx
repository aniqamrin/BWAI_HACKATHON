"use client";

import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  GitBranch,
  Globe2,
  Handshake,
  Link2,
  MessageCircle,
  Search,
  ShieldCheck,
  Trophy,
  Upload,
  UserCheck,
  Users2,
} from "lucide-react";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  relationshipOsFirebaseContract,
  relationshipOsSnapshot,
  type Action,
  type ActionStatus,
  type Actor,
  type EvidenceSource,
  type LensId,
  type MentorRanking,
  type Relationship,
  type Signal,
} from "@/lib/relationship-os-data";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
type Decision = "approved" | "needs_evidence";

const sourceIcons: Record<string, Icon> = {
  "whatsapp-export": MessageCircle,
  "csv-may-sync": Database,
  "deck-atlas": FileText,
  "deck-nora": FileText,
  "partner-notes": Link2,
};

const lensIcons: Record<LensId, Icon> = {
  relationships: GitBranch,
  "mentor-ranking": Trophy,
  "partner-intros": Handshake,
  evidence: Database,
};

const statusClasses: Record<ActionStatus | "Approved" | "Evidence requested", string> = {
  "Auto-ready": "border-[#45624f] bg-[#dce6d8] text-[#263b2d]",
  "Review suggested": "border-[#ad8448] bg-[#f0dfbf] text-[#6b4a1c]",
  "Manual evidence needed": "border-[#934439] bg-[#f4d8ce] text-[#743025]",
  Approved: "border-[#45624f] bg-[#17211c] text-[#fffaf0]",
  "Evidence requested": "border-[#934439] bg-[#fffaf0] text-[#743025]",
};

const actorPositions: Record<string, { x: number; y: number }> = {
  "startup-atlas-ai": { x: 17, y: 34 },
  "startup-carbonloop": { x: 18, y: 62 },
  "startup-nora-health": { x: 18, y: 82 },
  "mentor-priya": { x: 72, y: 25 },
  "mentor-farah": { x: 73, y: 58 },
  "mentor-alicia": { x: 74, y: 82 },
  "mentor-daniel": { x: 51, y: 63 },
  "partner-greenbridge": { x: 52, y: 41 },
};

const relationshipColors = {
  high: "#45624f",
  mid: "#ad8448",
  low: "#934439",
};

function actorInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getHealthColor(score: number) {
  if (score >= 82) return relationshipColors.high;
  if (score >= 72) return relationshipColors.mid;
  return relationshipColors.low;
}

function getActorById(id: string) {
  const actor = relationshipOsSnapshot.actors.find((candidate) => candidate.id === id);

  if (!actor) {
    throw new Error(`Missing actor ${id}`);
  }

  return actor;
}

function getRelationshipById(id: string | undefined) {
  if (!id) return null;
  return relationshipOsSnapshot.relationships.find((relationship) => relationship.id === id) ?? null;
}

function StatusPill({ status }: { status: ActionStatus | "Approved" | "Evidence requested" }) {
  return (
    <span className={cn("inline-flex items-center border px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.1em]", statusClasses[status])}>
      {status}
    </span>
  );
}

function SourceBadge({ source }: { source: EvidenceSource }) {
  const IconComponent = sourceIcons[source.id] ?? FileText;

  return (
    <article
      className={cn(
        "min-w-0 border border-[#9d8f77] px-4 py-4",
        source.primary ? "bg-[#17211c] text-[#fffaf0]" : "bg-[#fffaf0] text-[#17211c]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center border", source.primary ? "border-[#fffaf0]" : "border-[#17211c]")}>
          <IconComponent className="h-4 w-4" aria-hidden />
        </div>
        <span className={cn("border px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em]", source.primary ? "border-[#d9cfbd]" : "border-[#9d8f77] text-[#657064]")}>
          {source.label}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-bold">{source.title}</h3>
      <p className={cn("mt-2 text-xs leading-5", source.primary ? "text-[#e5decd]" : "text-[#405047]")}>{source.detail}</p>
      <p className={cn("mt-4 w-fit border px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.08em]", source.primary ? "border-[#d9cfbd]" : "border-[#9d8f77] text-[#59675e]")}>
        {source.state}
      </p>
    </article>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const source = relationshipOsSnapshot.evidenceSources.find((candidate) => candidate.id === signal.sourceId);
  const IconComponent = sourceIcons[signal.sourceId] ?? Activity;

  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] gap-3 border-b border-[#cab99d] px-4 py-3 last:border-b-0">
      <div className="flex h-8 w-8 items-center justify-center border border-[#17211c] bg-[#fffaf0]">
        <IconComponent className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#17211c]">{signal.label}</p>
        <p className="mt-1 text-xs leading-5 text-[#59675e]">{signal.detail}</p>
      </div>
      <div className="self-start text-right">
        <p className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
          {signal.state}
        </p>
        <p className="mt-1 text-[0.62rem] text-[#6c715f]">{source?.label}</p>
      </div>
    </div>
  );
}

function LensBar({
  activeLens,
  onSelectLens,
}: {
  activeLens: LensId;
  onSelectLens: (lensId: LensId) => void;
}) {
  return (
    <section className="grid gap-2 border border-[#17211c] bg-[#17211c] p-2 lg:grid-cols-4">
      {relationshipOsSnapshot.lenses.map((lens) => {
        const IconComponent = lensIcons[lens.id];
        const isActive = activeLens === lens.id;

        return (
          <button
            key={lens.id}
            type="button"
            className={cn(
              "min-h-[118px] border px-4 py-4 text-left transition-colors",
              isActive ? "border-[#fffaf0] bg-[#fffaf0] text-[#17211c]" : "border-[#4d594f] bg-[#17211c] text-[#e5decd] hover:bg-[#24332b]",
            )}
            onClick={() => onSelectLens(lens.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <IconComponent className="h-4 w-4" aria-hidden />
              <span className={cn("text-[0.62rem] font-bold uppercase tracking-[0.14em]", isActive ? "text-[#59675e]" : "text-[#c7bba9]")}>
                {lens.metric}
              </span>
            </div>
            <h2 className="mt-5 text-xl font-semibold leading-tight">{lens.label}</h2>
            <p className={cn("mt-2 text-xs leading-5", isActive ? "text-[#405047]" : "text-[#d9cfbd]")}>{lens.description}</p>
          </button>
        );
      })}
    </section>
  );
}

function ActionQueue({
  actions,
  activeActionId,
  decisions,
  onSelectAction,
}: {
  actions: Action[];
  activeActionId: string;
  decisions: Record<string, Decision>;
  onSelectAction: (actionId: string) => void;
}) {
  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="flex items-end justify-between gap-4 border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Next steps</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight">Current decision queue</h2>
        </div>
        <p className="text-right text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">{actions.length} actions</p>
      </div>

      <div className="divide-y divide-[#cab99d]">
        {actions.map((action) => {
          const isActive = activeActionId === action.id;
          const decision = decisions[action.id];
          const visibleStatus = decision === "approved" ? "Approved" : decision === "needs_evidence" ? "Evidence requested" : action.status;

          return (
            <button
              key={action.id}
              type="button"
              className={cn(
                "grid w-full gap-3 px-4 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_auto]",
                isActive ? "bg-[#dce6d8]" : "bg-[#fffaf0] hover:bg-[#f7f1e5]",
              )}
              onClick={() => onSelectAction(action.id)}
            >
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <StatusPill status={visibleStatus} />
                  <span className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">{action.confidence}% confidence</span>
                </span>
                <span className="mt-3 block text-base font-semibold leading-tight text-[#17211c]">{action.title}</span>
                <span className="mt-2 block text-sm leading-6 text-[#405047]">{action.summary}</span>
              </span>
              <span className="flex items-center justify-end text-[#405047]">
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RelationshipMap({
  selectedAction,
  selectedRelationship,
}: {
  selectedAction: Action;
  selectedRelationship: Relationship | null;
}) {
  const involvedActorIds = new Set(selectedAction.actorIds);

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="flex items-end justify-between gap-4 border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Supporting insights</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight">Relationship map</h2>
        </div>
        <p className="text-right text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">
          {selectedRelationship ? `${selectedRelationship.baselineHealth} to ${selectedRelationship.health}` : "Evidence linked"}
        </p>
      </div>

      <div className="relative min-h-[480px] overflow-hidden bg-[#fbf4e7]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {relationshipOsSnapshot.relationships.map((relationship) => {
            const start = actorPositions[relationship.startupId];
            const end = actorPositions[relationship.mentorId];
            const isSelected = relationship.id === selectedRelationship?.id;

            return (
              <line
                key={relationship.id}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={getHealthColor(relationship.health)}
                strokeWidth={isSelected ? 0.85 : 0.42}
                strokeOpacity={isSelected ? 1 : 0.45}
              />
            );
          })}
          <line x1={actorPositions["startup-carbonloop"].x} y1={actorPositions["startup-carbonloop"].y} x2={actorPositions["partner-greenbridge"].x} y2={actorPositions["partner-greenbridge"].y} stroke="#59675e" strokeDasharray="1.5 1.5" strokeWidth={0.42} strokeOpacity={0.8} />
        </svg>

        {relationshipOsSnapshot.actors.map((actor) => {
          const position = actorPositions[actor.id];
          const isInvolved = involvedActorIds.has(actor.id);

          return (
            <div
              key={actor.id}
              className={cn(
                "absolute w-[164px] max-w-[42vw] border px-3 py-3 shadow-[4px_4px_0_#9d8f77]",
                actor.type === "mentor" ? "bg-[#17211c] text-[#fffaf0]" : "bg-[#fffaf0] text-[#17211c]",
                isInvolved ? "border-[#17211c] opacity-100" : "border-[#9d8f77] opacity-60",
              )}
              style={{ left: `${position.x}%`, top: `${position.y}%`, transform: "translate(-50%, -50%)" }}
            >
              <div className="flex items-center gap-2">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center border text-[0.64rem] font-bold", actor.type === "mentor" ? "border-[#fffaf0]" : "border-[#17211c]")}>
                  {actorInitials(actor.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{actor.name}</p>
                  <p className={cn("truncate text-[0.64rem] font-bold uppercase tracking-[0.08em]", actor.type === "mentor" ? "text-[#d9cfbd]" : "text-[#59675e]")}>{actor.type}</p>
                </div>
              </div>
              <p className={cn("mt-2 line-clamp-2 text-xs leading-5", actor.type === "mentor" ? "text-[#e5decd]" : "text-[#405047]")}>{actor.subtitle}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SelectedInsightPanel({
  selectedAction,
  selectedRelationship,
  decisions,
  onRecordDecision,
}: {
  selectedAction: Action;
  selectedRelationship: Relationship | null;
  decisions: Record<string, Decision>;
  onRecordDecision: (actionId: string, decision: Decision) => void;
}) {
  const selectedActors = selectedAction.actorIds.map(getActorById);
  const selectedSignals = selectedAction.signals
    .map((signalId) => relationshipOsSnapshot.signals.find((signal) => signal.id === signalId))
    .filter((signal): signal is Signal => Boolean(signal));
  const decision = decisions[selectedAction.id];

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Gemini reasoning</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">{selectedAction.title}</h2>
      </div>

      <div className="space-y-5 px-4 py-5">
        <div className="flex flex-wrap gap-2">
          {selectedActors.map((actor) => (
            <span key={actor.id} className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#405047]">
              {actor.name}
            </span>
          ))}
        </div>

        <p className="text-base leading-7 text-[#263b2d]">{selectedAction.aiReasoning}</p>

        {selectedRelationship ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Health" value={`${selectedRelationship.health}`} detail={`${selectedRelationship.baselineHealth} baseline`} />
            <Metric label="Hours synced" value={`${selectedRelationship.hoursSynced}`} detail="last 30 days" />
            <Metric label="Confidence" value={`${selectedRelationship.founderConfidence}/${selectedRelationship.mentorConfidence}`} detail="founder / mentor" />
          </div>
        ) : null}

        {selectedRelationship ? (
          <div className="border border-[#cab99d] bg-[#fbf4e7] px-4 py-4">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#657064]">Blocker text</p>
            <p className="mt-2 text-sm leading-6 text-[#405047]">{selectedRelationship.blockersIdentified}</p>
            <p className="mt-4 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#657064]">Next step</p>
            <p className="mt-2 text-sm leading-6 text-[#17211c]">{selectedRelationship.nextStep}</p>
          </div>
        ) : null}

        <div className="border border-[#cab99d]">
          {selectedSignals.map((signal) => (
            <SignalRow key={signal.id} signal={signal} />
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 border border-[#17211c] px-4 py-2 text-sm font-bold",
              decision === "approved" ? "bg-[#17211c] text-[#fffaf0]" : "bg-[#fffaf0] text-[#17211c] hover:bg-[#17211c] hover:text-[#fffaf0]",
            )}
            onClick={() => onRecordDecision(selectedAction.id, "approved")}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            Approve next step
          </button>
          <button
            type="button"
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 border border-[#17211c] px-4 py-2 text-sm font-bold",
              decision === "needs_evidence" ? "bg-[#934439] text-[#fffaf0]" : "bg-[#fffaf0] text-[#17211c] hover:bg-[#f4d8ce]",
            )}
            onClick={() => onRecordDecision(selectedAction.id, "needs_evidence")}
          >
            <Search className="h-4 w-4" aria-hidden />
            Request evidence
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border border-[#cab99d] bg-[#fbf4e7] px-4 py-3">
      <p className="text-[0.64rem] font-bold uppercase tracking-[0.12em] text-[#657064]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#17211c]">{value}</p>
      <p className="mt-1 text-xs text-[#59675e]">{detail}</p>
    </div>
  );
}

function RankingsPanel({ rankings }: { rankings: MentorRanking[] }) {
  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Mentor ranking</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">Who should move first</h2>
      </div>
      <div className="divide-y divide-[#cab99d]">
        {rankings.map((ranking) => {
          const mentor = getActorById(ranking.mentorId);
          const startup = getActorById(ranking.bestStartupId);

          return (
            <article key={ranking.mentorId} className="grid gap-4 px-4 py-4 md:grid-cols-[44px_minmax(0,1fr)_auto]">
              <div className="flex h-11 w-11 items-center justify-center border border-[#17211c] bg-[#17211c] text-lg font-semibold text-[#fffaf0]">
                {ranking.rank}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-[#17211c]">{mentor.name}</h3>
                  <span className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
                    {ranking.capacity}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-[#405047]">{ranking.reasoning}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">Best intro: {startup.name}</p>
              </div>
              <p className="self-start text-3xl font-semibold text-[#17211c]">{ranking.score}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ActorProfile({ actor }: { actor: Actor }) {
  return (
    <article className="border border-[#17211c] bg-[#fffaf0] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center border text-sm font-bold", actor.type === "mentor" ? "border-[#17211c] bg-[#17211c] text-[#fffaf0]" : "border-[#17211c] bg-[#f7f1e5] text-[#17211c]")}>
          {actorInitials(actor.name)}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#17211c]">{actor.name}</p>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#59675e]">{actor.subtitle}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#405047]">{actor.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {actor.tags.map((tag) => (
          <span key={tag} className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function IngestionPanel({
  queuedEvidenceSource,
  evidenceProcessed,
  onQueueEvidence,
  onProcessEvidence,
}: {
  queuedEvidenceSource: string | null;
  evidenceProcessed: boolean;
  onQueueEvidence: (sourceId: string) => void;
  onProcessEvidence: () => void;
}) {
  const queuedSource = relationshipOsSnapshot.evidenceSources.find((source) => source.id === queuedEvidenceSource);

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Data setup</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">Add relationship evidence</h2>
        <p className="mt-2 max-w-[76ch] text-sm leading-6 text-[#405047]">
          WhatsApp, CSV, decks, and partner notes all resolve into the same relationship graph so the demo data stays consistent across every section.
        </p>
      </div>

      <div className="grid gap-3 p-3 lg:grid-cols-5">
        {relationshipOsSnapshot.ingestionEvidenceSourceIds.map((sourceId) => {
          const source = relationshipOsSnapshot.evidenceSources.find((candidate) => candidate.id === sourceId);

          if (!source) return null;

          return (
            <button key={source.id} type="button" className="text-left" onClick={() => onQueueEvidence(source.id)}>
              <SourceBadge source={source} />
            </button>
          );
        })}
      </div>

      <div className={cn("grid gap-3 border-t border-[#9d8f77] px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto]", evidenceProcessed ? "bg-[#dce6d8]" : "bg-[#fbf4e7]")}>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#17211c]">
            {evidenceProcessed
              ? "Raw information processed into relationship, mentor ranking, and partner intro signals."
              : queuedSource
                ? `${queuedSource.title} queued for extraction.`
                : "Queue a source or process the full demo packet."}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#405047]">
            Backend handoff: {relationshipOsFirebaseContract.functions.map((fn) => fn.name).join(", ")}
          </p>
        </div>
        <button
          type="button"
          className="flex min-h-11 items-center justify-center gap-2 border border-[#17211c] bg-[#17211c] px-5 py-2 text-sm font-bold text-[#fffaf0] hover:bg-[#263b2d]"
          onClick={onProcessEvidence}
        >
          <Upload className="h-4 w-4" aria-hidden />
          {evidenceProcessed ? "Reprocess Raw Information" : "Process Raw Information"}
        </button>
      </div>
    </section>
  );
}

export default function RelationshipOSDemo() {
  const [activeLens, setActiveLens] = useState<LensId>("relationships");
  const [selectedActionId, setSelectedActionId] = useState("action-atlas-priya");
  const [queuedEvidenceSource, setQueuedEvidenceSource] = useState<string | null>("whatsapp-export");
  const [evidenceProcessed, setEvidenceProcessed] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const visibleActions = useMemo(() => {
    const scopedActions =
      activeLens === "evidence"
        ? relationshipOsSnapshot.actions
        : relationshipOsSnapshot.actions.filter((action) => action.lensId === activeLens);

    return scopedActions.length > 0 ? scopedActions : relationshipOsSnapshot.actions;
  }, [activeLens]);

  const selectedAction = visibleActions.find((action) => action.id === selectedActionId) ?? visibleActions[0];
  const selectedRelationship = getRelationshipById(selectedAction.relationshipId);
  const selectedActors = selectedAction.actorIds.map(getActorById);

  function selectLens(lensId: LensId) {
    setActiveLens(lensId);
    const firstAction = relationshipOsSnapshot.actions.find((action) => lensId === "evidence" || action.lensId === lensId);

    if (firstAction) {
      setSelectedActionId(firstAction.id);
    }
  }

  function recordDecision(actionId: string, decision: Decision) {
    setDecisions((current) => ({ ...current, [actionId]: decision }));
  }

  return (
    <main className="min-h-screen bg-[#ede4d1] text-[#17211c]" style={{ fontFamily: 'Charter, "Iowan Old Style", "Hoefler Text", Georgia, serif' }}>
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="grid gap-6 border border-[#17211c] bg-[#fffaf0] px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-[#17211c] bg-[#17211c] px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#fffaf0]">
                Comparison route
              </span>
              <span className="border border-[#9d8f77] bg-[#f7f1e5] px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-[#59675e]">
                {relationshipOsSnapshot.ecosystemName}
              </span>
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-normal md:text-7xl">
              Relationship OS for ecosystem operators
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-[#405047] md:text-lg">
              A focused operating surface that turns raw cohort evidence into mentor rankings, relationship next steps, and partner actions without replacing the existing EcosystemOS app.
            </p>
          </div>
          <div className="grid grid-cols-3 border border-[#9d8f77] bg-[#fbf4e7] text-center">
            <Metric label="Actors" value={`${relationshipOsSnapshot.actors.length}`} detail="mapped" />
            <Metric label="Signals" value={`${relationshipOsSnapshot.signals.length}`} detail="linked" />
            <Metric label="Actions" value={`${relationshipOsSnapshot.actions.length}`} detail="queued" />
          </div>
        </header>

        <LensBar activeLens={activeLens} onSelectLens={selectLens} />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <ActionQueue actions={visibleActions} activeActionId={selectedAction.id} decisions={decisions} onSelectAction={setSelectedActionId} />
          <SelectedInsightPanel
            selectedAction={selectedAction}
            selectedRelationship={selectedRelationship}
            decisions={decisions}
            onRecordDecision={recordDecision}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <RelationshipMap selectedAction={selectedAction} selectedRelationship={selectedRelationship} />
          <div className="grid gap-6">
            {activeLens === "mentor-ranking" ? (
              <RankingsPanel rankings={relationshipOsSnapshot.mentorRankings} />
            ) : (
              <section className="border border-[#17211c] bg-[#fffaf0]">
                <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Actor profile</p>
                  <h2 className="mt-1 text-2xl font-semibold leading-tight">Selected context</h2>
                </div>
                <div className="grid gap-3 p-3">
                  {selectedActors.map((actor) => (
                    <ActorProfile key={actor.id} actor={actor} />
                  ))}
                </div>
              </section>
            )}

            <section className="border border-[#17211c] bg-[#fffaf0]">
              <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Signal feed</p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight">What the model reads</h2>
              </div>
              <div className="divide-y divide-[#cab99d]">
                {relationshipOsSnapshot.signals.map((signal) => (
                  <SignalRow key={signal.id} signal={signal} />
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <IngestionPanel
            queuedEvidenceSource={queuedEvidenceSource}
            evidenceProcessed={evidenceProcessed}
            onQueueEvidence={setQueuedEvidenceSource}
            onProcessEvidence={() => setEvidenceProcessed(true)}
          />

          <aside className="border border-[#17211c] bg-[#fffaf0] px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center border border-[#17211c] bg-[#17211c] text-[#fffaf0]">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-5 text-2xl font-semibold leading-tight">Backend-ready contract</h2>
            <p className="mt-3 text-sm leading-6 text-[#405047]">
              The mock snapshot is shaped around Firebase collections and callable functions, so the route can move from local demo data to a real Google-backed store.
            </p>
            <div className="mt-5 space-y-2">
              {relationshipOsFirebaseContract.collections.slice(0, 4).map((collection) => (
                <p key={collection} className="break-words border border-[#cab99d] bg-[#fbf4e7] px-3 py-2 text-xs font-bold text-[#405047]">
                  {collection}
                </p>
              ))}
            </div>
          </aside>
        </section>

        <footer className="flex flex-col gap-3 border border-[#17211c] bg-[#17211c] px-5 py-4 text-[#fffaf0] md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold">Cohort Atlas, Relationship OS comparison surface</p>
          <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-[0.1em] text-[#d9cfbd]">
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden /> May 2026 packet</span>
            <span className="inline-flex items-center gap-1"><Globe2 className="h-3.5 w-3.5" aria-hidden /> Google-ready</span>
            <span className="inline-flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" aria-hidden /> Human approval loop</span>
            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" aria-hidden /> Demo branch only</span>
            <span className="inline-flex items-center gap-1"><Users2 className="h-3.5 w-3.5" aria-hidden /> Shared mock data</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
