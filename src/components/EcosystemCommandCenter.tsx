import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Globe2,
  Handshake,
  Link2,
  MessageCircle,
  Search,
  ShieldCheck,
  Upload,
  UserCheck,
  Users2,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import {
  mockEcosystemSnapshot,
  type Action,
  type ActionDecision,
  type IconKey,
  type LensConfig,
  type LensId,
  type MapActor,
  type MapLine,
  type Signal,
} from '../data/ecosystemData';

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

type DisplayStatus = Action['status'] | 'Approved' | 'Evidence requested';

const ecosystemSnapshot = mockEcosystemSnapshot;
const evidenceSources = ecosystemSnapshot.evidenceSources;
const externalSignals = ecosystemSnapshot.externalSignals;
const internalSignals = ecosystemSnapshot.internalSignals;
const actionsByLens = ecosystemSnapshot.actionsByLens;
const lensConfigs = Object.fromEntries(ecosystemSnapshot.lenses.map((lens) => [lens.id, lens])) as Record<
  LensId,
  (typeof ecosystemSnapshot.lenses)[number]
>;
const mapActorsByLens = ecosystemSnapshot.mapActorsByLens;
const mapLinesByLens = ecosystemSnapshot.mapLinesByLens;

const iconComponents: Record<IconKey, Icon> = {
  activity: Activity,
  clock: Clock3,
  database: Database,
  'file-text': FileText,
  globe: Globe2,
  handshake: Handshake,
  link: Link2,
  'message-circle': MessageCircle,
  'shield-check': ShieldCheck,
};

const ingestionEvidenceSources = ecosystemSnapshot.ingestionEvidenceSourceIds.map((sourceId) => {
  const source = evidenceSources.find((candidate) => candidate.id === sourceId);

  if (!source) {
    throw new Error(`Missing ingestion evidence source ${sourceId}.`);
  }

  return source;
});

function StatusPill({ status }: { status: DisplayStatus }) {
  const classes = {
    'Auto-ready': 'border-[#45624f] bg-[#dce6d8] text-[#263b2d]',
    'Review suggested': 'border-[#ad8448] bg-[#f0dfbf] text-[#6b4a1c]',
    'Manual evidence needed': 'border-[#934439] bg-[#f4d8ce] text-[#743025]',
    Approved: 'border-[#45624f] bg-[#17211c] text-[#fffaf0]',
    'Evidence requested': 'border-[#934439] bg-[#fffaf0] text-[#743025]',
  }[status];

  return (
    <span className={`ui-sans inline-flex items-center border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${classes}`}>
      {status}
    </span>
  );
}

function SignalRow({ signal }: { signal: Signal }) {
  const IconComponent = iconComponents[signal.iconKey];

  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] gap-3 border-b border-[#cab99d] px-4 py-3 last:border-b-0">
      <div className="flex h-8 w-8 items-center justify-center border border-[#17211c] bg-[#fffaf0]">
        <IconComponent className="h-4 w-4" aria-hidden />
      </div>
      <div>
        <p className="ui-sans text-sm font-bold text-[#17211c]">{signal.label}</p>
        <p className="ui-sans mt-1 text-xs leading-5 text-[#59675e]">{signal.detail}</p>
      </div>
      <p className="ui-sans self-start border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#59675e]">
        {signal.state}
      </p>
    </div>
  );
}

function EvidenceIngestionPanel({
  queuedEvidenceSource,
  onQueueEvidence,
}: {
  queuedEvidenceSource: string | null;
  onQueueEvidence: (sourceId: string) => void;
}) {
  const queuedSource = ingestionEvidenceSources.find((source) => source.id === queuedEvidenceSource);

  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#9d8f77] bg-[#f7f1e5] px-4 py-4">
        <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Evidence ingestion</p>
        <h2 className="mt-1 text-2xl font-semibold leading-tight">Add relationship evidence</h2>
        <p className="ui-sans mt-2 max-w-[76ch] text-sm leading-6 text-[#405047]">
          WhatsApp is prominent because mentorship coordination often lives in chat, while CSV, decks, notes, and links add
          structured context around it.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 divide-y divide-[#cab99d] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {ingestionEvidenceSources.map((source) => {
          const IconComponent = iconComponents[source.iconKey];
          const isQueued = queuedEvidenceSource === source.id;
          const isPrimary = Boolean(source.primary);

          return (
            <article
              key={source.id}
              className={`min-w-0 px-4 py-4 ${isPrimary ? 'bg-[#17211c] text-[#fffaf0]' : 'bg-[#fffaf0] text-[#17211c]'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center border ${isPrimary ? 'border-[#fffaf0]' : 'border-[#17211c]'}`}>
                  <IconComponent className="h-4 w-4" aria-hidden />
                </div>
                <span
                  className={`ui-sans border px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] ${
                    isPrimary ? 'border-[#d9cfbd] text-[#fffaf0]' : 'border-[#9d8f77] text-[#657064]'
                  }`}
                >
                  {source.label}
                </span>
              </div>
              <h3 className="ui-sans mt-4 text-sm font-bold">{source.title}</h3>
              <p className={`ui-sans mt-2 text-xs leading-5 ${isPrimary ? 'text-[#e5decd]' : 'text-[#405047]'}`}>{source.detail}</p>
              <div className="ui-sans mt-4 flex flex-col gap-2 text-[0.65rem] font-bold uppercase tracking-[0.08em]">
                <span className={`w-fit border px-2 py-1 ${isPrimary ? 'border-[#d9cfbd]' : 'border-[#9d8f77]'}`}>{source.state}</span>
                <button
                  aria-label={`Queue ${source.title.replace('conversation export', 'export')}`}
                  className={`flex min-h-10 items-center justify-center gap-2 border px-3 py-2 ${
                    isPrimary
                      ? 'border-[#fffaf0] bg-[#fffaf0] text-[#17211c]'
                      : 'border-[#17211c] bg-[#fffaf0] text-[#17211c] hover:bg-[#17211c] hover:text-[#fffaf0] focus-visible:bg-[#17211c] focus-visible:text-[#fffaf0]'
                  }`}
                  onClick={() => onQueueEvidence(source.id)}
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                  {isQueued ? 'Queued' : source.id === 'whatsapp-export' ? 'Queue WhatsApp' : 'Queue source'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {queuedSource ? (
        <div className="grid gap-3 border-t border-[#9d8f77] bg-[#dce6d8] px-4 py-4 md:grid-cols-3">
          <div className="md:col-span-3">
            <p className="ui-sans text-sm font-bold text-[#17211c]">
              {queuedSource.id === 'whatsapp-export'
                ? 'WhatsApp evidence queued for AI extraction.'
                : `${queuedSource.title} queued for AI extraction.`}
            </p>
          </div>
          <div className="border border-[#45624f] bg-[#fffaf0] px-3 py-3">
            <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#45624f]">Conversation signals</p>
            <p className="ui-sans mt-2 text-xs font-bold leading-5 text-[#17211c]">
              Actors, blockers, commitments, follow-ups, and relationship warmth.
            </p>
          </div>
          <div className="border border-[#45624f] bg-[#fffaf0] px-3 py-3">
            <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#45624f]">Mentorship signals</p>
            <p className="ui-sans mt-2 text-xs font-bold leading-5 text-[#17211c]">
              Mentor responsiveness, advice quality, unresolved asks, and follow-up gaps.
            </p>
          </div>
          <div className="border border-[#45624f] bg-[#fffaf0] px-3 py-3">
            <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#45624f]">Privacy guardrail</p>
            <p className="ui-sans mt-2 text-xs font-bold leading-5 text-[#17211c]">
              Extract relationship signals, keep judgement and governance with programme admins.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RelationshipMap({
  evidenceProcessed,
  approvedCount,
  evidenceRequestCount,
  eyebrow,
  title,
  question,
  badge,
  mapActors,
  mapLines,
}: {
  evidenceProcessed: boolean;
  approvedCount: number;
  evidenceRequestCount: number;
  eyebrow: string;
  title: string;
  question: string;
  badge: string;
  mapActors: MapActor[];
  mapLines: MapLine[];
}) {
  return (
    <div className="relative min-h-[560px] overflow-hidden border border-[#17211c] bg-[#fffaf0]">
      <div className="absolute inset-x-0 top-0 flex flex-col gap-3 border-b border-[#9d8f77] bg-[#f7f1e5] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold leading-none">{title}</h2>
          <p className="ui-sans mt-2 text-sm leading-6 text-[#405047]">{question}</p>
        </div>
        <div className="ui-sans flex w-fit shrink-0 items-center gap-2 border border-[#45624f] bg-[#dce6d8] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#263b2d]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {badge}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[82px] top-[166px] lg:top-[112px]">
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {mapLines.map((line, index) => (
            <line
              key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}-${index}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              strokeDasharray={line.strokeDasharray}
            />
          ))}
        </svg>

        {mapActors.map((actor) => (
          <div
            key={actor.label}
            className={`absolute w-[136px] -translate-x-1/2 -translate-y-1/2 border border-[#17211c] px-3 py-2.5 shadow-[4px_4px_0_#9d8f77] ${actor.tone}`}
            style={{ left: actor.x, top: actor.y }}
          >
            <p className="ui-sans text-[0.82rem] font-bold leading-tight">{actor.label}</p>
            <p className="ui-sans mt-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] opacity-70">{actor.role}</p>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-5 right-5 grid grid-cols-3 border border-[#9d8f77] bg-[#f7f1e5]">
        <div className="border-r border-[#9d8f77] px-3 py-2">
          <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">Fit score</p>
          <p className="mt-1 text-2xl font-semibold">86</p>
        </div>
        <div className="border-r border-[#9d8f77] px-3 py-2">
          <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">Evidence</p>
          <p className="mt-1 text-2xl font-semibold">{evidenceProcessed ? 18 : 14}</p>
        </div>
        <div className="px-3 py-2">
          <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">Decisions</p>
          <p className="mt-1 text-2xl font-semibold">{approvedCount + evidenceRequestCount}</p>
        </div>
      </div>
    </div>
  );
}

function RankingsPanel({
  rankings,
  selectedActionId,
  onSelect,
  eyebrow,
  title,
  question,
  badge,
}: {
  rankings: Action[];
  selectedActionId: string;
  onSelect: (actionId: string) => void;
  eyebrow: string;
  title: string;
  question: string;
  badge: string;
}) {
  return (
    <section className="min-h-[478px] border border-[#17211c] bg-[#fffaf0]">
      <div className="flex flex-col gap-3 border-b border-[#9d8f77] bg-[#f7f1e5] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight">{title}</h2>
          <p className="ui-sans mt-2 text-sm leading-6 text-[#405047]">{question}</p>
        </div>
        <div className="ui-sans flex w-fit items-center gap-2 border border-[#45624f] bg-[#dce6d8] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#263b2d]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {badge}
        </div>
      </div>

      <div className="grid divide-y divide-[#cab99d]">
        {rankings.map((partner) => {
          const isSelected = selectedActionId === partner.id;

          return (
            <button
              key={partner.id}
              className={`grid w-full grid-cols-1 gap-4 px-5 py-4 text-left transition-colors lg:grid-cols-[58px_minmax(0,1fr)_92px] ${
                isSelected ? 'bg-[#f0dfbf]' : 'bg-[#fffaf0] hover:bg-[#fbf4e7] focus-visible:bg-[#fbf4e7]'
              }`}
              onClick={() => onSelect(partner.id)}
            >
              <div className="ui-sans flex h-12 w-12 items-center justify-center border border-[#17211c] bg-[#17211c] text-sm font-bold text-[#fffaf0]">
                #{partner.rank}
              </div>
              <div className="min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="ui-sans text-base font-bold text-[#17211c]">{partner.title}</h3>
                    <p className="ui-sans mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#657064]">{partner.actor}</p>
                  </div>
                  <StatusPill status={partner.status} />
                </div>
                <p className="ui-sans mt-3 max-w-[72ch] text-sm leading-6 text-[#405047]">{partner.rationale}</p>
                <div className="ui-sans mt-3 flex flex-wrap gap-2 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#405047]">
                  {partner.tags?.map((tag) => (
                    <span key={tag} className="border border-[#9d8f77] bg-[#fbf4e7] px-2 py-1">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-3xl font-semibold leading-none">{partner.confidence}</p>
                <p className="ui-sans mt-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">
                  Fit
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ActionQueuePanel({
  activeLens,
  actions,
  evidenceProcessed,
  displayStatusFor,
  onSelect,
  onDecision,
}: {
  activeLens: LensConfig;
  actions: Action[];
  evidenceProcessed: boolean;
  displayStatusFor: (action: Action) => DisplayStatus;
  onSelect: (actionId: string) => void;
  onDecision: (actionId: string, decision: ActionDecision) => void;
}) {
  return (
    <section className="border border-[#17211c] bg-[#fffaf0]">
      <div className="border-b border-[#17211c] px-5 py-5">
        <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">{activeLens.queueEyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold leading-none">{activeLens.queueTitle}</h2>
      </div>
      <div className="grid divide-y divide-[#cab99d] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {actions.map((action) => (
          <article key={action.title} className="bg-[#fffaf0] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="ui-sans text-sm font-bold text-[#17211c]">{action.title}</h3>
                <p className="ui-sans mt-1 text-xs font-bold uppercase tracking-[0.1em] text-[#657064]">{action.actor}</p>
              </div>
              <p className="text-2xl font-semibold leading-none">{action.confidence}</p>
            </div>
            <div className="mt-3">
              <StatusPill status={displayStatusFor(action)} />
            </div>
            <p className="ui-sans mt-3 text-xs leading-5 text-[#405047]">{action.rationale}</p>
            <div className="ui-sans mt-4 grid grid-cols-3 gap-2 text-[0.64rem] font-bold uppercase tracking-[0.08em]">
              <button
                aria-label={`Review ${action.title}`}
                className="flex min-h-10 items-center justify-center border border-[#17211c] bg-[#fffaf0] px-2 py-2 text-[#17211c] hover:bg-[#17211c] hover:text-[#fffaf0] focus-visible:bg-[#17211c] focus-visible:text-[#fffaf0]"
                onClick={() => onSelect(action.id)}
              >
                Review
              </button>
              <button
                aria-label={`Approve ${action.title}`}
                className="flex min-h-10 items-center justify-center border border-[#45624f] bg-[#dce6d8] px-2 py-2 text-[#263b2d] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!evidenceProcessed}
                onClick={() => onDecision(action.id, 'approved')}
              >
                Approve
              </button>
              <button
                aria-label={`Request evidence for ${action.title}`}
                className="flex min-h-10 items-center justify-center border border-[#934439] bg-[#fffaf0] px-2 py-2 text-[#743025] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={!evidenceProcessed}
                onClick={() => onDecision(action.id, 'evidence-requested')}
              >
                Evidence
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SelectedInsightPanel({ activeLens, selectedAction, isRankingLens }: { activeLens: LensConfig; selectedAction: Action; isRankingLens: boolean }) {
  return (
    <section className={`${isRankingLens ? '' : 'border-t'} border-[#17211c] bg-[#f7f1e5] px-5 py-5`}>
      <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">
        {activeLens.selectedLabel}
      </p>
      <h3 className="mt-2 text-2xl font-semibold leading-tight">
        {selectedAction.detailHeading ?? selectedAction.actor}
      </h3>
      <p className="ui-sans mt-3 text-xs leading-5 text-[#405047]">{selectedAction.rationale}</p>
      <div className="mt-4 grid gap-2">
        {selectedAction.evidence.map((evidence) => (
          <div key={evidence} className="ui-sans border border-[#9d8f77] bg-[#fffaf0] px-3 py-2 text-xs font-bold">
            {evidence}
          </div>
        ))}
      </div>
    </section>
  );
}

export function EcosystemCommandCenter() {
  const [evidenceProcessed, setEvidenceProcessed] = useState(false);
  const [queuedEvidenceSource, setQueuedEvidenceSource] = useState<string | null>(null);
  const [activeLensId, setActiveLensId] = useState<LensId>('company');
  const [selectedActionId, setSelectedActionId] = useState('provider');
  const [decisions, setDecisions] = useState<Record<string, ActionDecision>>({});
  const activeLens = lensConfigs[activeLensId];
  const activeActions = actionsByLens[activeLensId];
  const selectedAction = useMemo(
    () => activeActions.find((action) => action.id === selectedActionId) ?? activeActions[0],
    [activeActions, selectedActionId],
  );
  const approvedCount = Object.values(decisions).filter((decision) => decision === 'approved').length;
  const evidenceRequestCount = Object.values(decisions).filter((decision) => decision === 'evidence-requested').length;
  const isRankingLens = activeLensId === 'partner-rankings' || activeLensId === 'mentor-rankings';
  const relationshipMapLens: Exclude<LensId, 'partner-rankings' | 'mentor-rankings'> =
    activeLensId === 'service-provider' ? 'service-provider' : 'company';

  function displayStatusFor(action: Action): DisplayStatus {
    if (decisions[action.id] === 'approved') return 'Approved';
    if (decisions[action.id] === 'evidence-requested') return 'Evidence requested';
    return action.status;
  }

  function recordDecision(actionId: string, decision: ActionDecision) {
    setDecisions((current) => ({ ...current, [actionId]: decision }));
    setSelectedActionId(actionId);
  }

  function selectLens(lensId: LensId) {
    setActiveLensId(lensId);
    setSelectedActionId(lensConfigs[lensId].selectedDefaultId);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#ede4d1] px-3 py-4 text-[#17211c] sm:px-5 sm:py-5">
      <div className="mx-auto w-full max-w-[1280px] min-w-0 border border-[#17211c] bg-[#f7f1e5] shadow-[6px_6px_0_#17211c] sm:shadow-[8px_8px_0_#17211c]">
        <header className="grid min-w-0 grid-cols-1 border-b border-[#17211c]">
          <div className="min-w-0 px-5 py-5 sm:px-7 sm:py-6">
            <p className="ui-sans text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#657064]">
              Cohort Atlas experiment
            </p>
            <div className="mt-3 flex min-w-0 flex-wrap items-end gap-3 sm:gap-4">
              <h1 className="text-4xl font-semibold leading-none sm:text-5xl">Relationship OS</h1>
              <span className="ui-sans mb-1 border border-[#17211c] bg-[#fffaf0] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]">
                Prototype v2
              </span>
            </div>
            <p className="ui-sans mt-4 max-w-[72ch] text-sm leading-6 text-[#405047]">
              LinkedIn starts the actor profile. Cohort Atlas then joins websites, uploaded material, and product-generated
              signals so programme teams get relationship recommendations without asking everyone to fill another form.
            </p>
          </div>
          <div className="min-w-0 border-t border-[#17211c] bg-[#fffaf0] px-5 py-5 sm:px-7">
            <p className="ui-sans text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Operating promise</p>
            <p className="mt-3 text-xl font-semibold leading-tight sm:text-2xl">
              Automate discovery and evidence. Keep humans on judgement and governance.
            </p>
          </div>
        </header>

        <section className="grid min-w-0 grid-cols-1 gap-4 border-b border-[#17211c] bg-[#fbf4e7] px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <div className="mb-4">
              <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Operating lens</p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Operating lens selector">
                {Object.values(lensConfigs).map((lens) => {
                  const isActive = activeLensId === lens.id;

                  return (
                    <button
                      key={lens.id}
                      aria-label={lens.ariaLabel}
                      className={`ui-sans min-h-11 border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] ${
                        isActive
                          ? 'border-[#17211c] bg-[#17211c] text-[#fffaf0]'
                          : 'border-[#9d8f77] bg-[#fffaf0] text-[#405047] hover:border-[#17211c] focus-visible:border-[#17211c]'
                      }`}
                      onClick={() => selectLens(lens.id)}
                    >
                      {lens.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Starting point</p>
            <div className="mt-2 flex min-h-[54px] items-center gap-3 border border-[#17211c] bg-[#fffaf0] px-4">
              <Search className="h-5 w-5 text-[#405047]" aria-hidden />
              <p className="ui-sans min-w-0 flex-1 truncate text-sm font-bold text-[#17211c]">
                {activeLens.source}
              </p>
              <span className="ui-sans border border-[#45624f] bg-[#dce6d8] px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#263b2d]">
                {evidenceProcessed ? 'Evidence ready' : activeLens.sourceState}
              </span>
            </div>
          </div>
        </section>

        <section className="border-b border-[#17211c] bg-[#fbf4e7] px-4 py-5 sm:px-5">
          <div className="mb-4 px-1 sm:px-2">
            <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Next steps</p>
            <h2 className="mt-1 text-3xl font-semibold leading-tight">Current decision queue</h2>
          </div>
          {isRankingLens ? (
            <RankingsPanel
              rankings={activeActions}
              selectedActionId={selectedAction.id}
              onSelect={setSelectedActionId}
              eyebrow={activeLens.mapEyebrow}
              title={activeLens.mapTitle}
              question={activeLens.mapQuestion}
              badge={activeLens.mapBadge}
            />
          ) : (
            <ActionQueuePanel
              activeLens={activeLens}
              actions={activeActions}
              evidenceProcessed={evidenceProcessed}
              displayStatusFor={displayStatusFor}
              onSelect={setSelectedActionId}
              onDecision={recordDecision}
            />
          )}
        </section>

        <section className="grid min-w-0 grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="min-w-0 border-b border-[#17211c] bg-[#fbf4e7] xl:border-b-0 xl:border-r">
            <div className="border-b border-[#17211c] px-5 py-5">
              <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">{activeLens.profileLabel}</p>
              <h2 className="mt-2 text-3xl font-semibold leading-none">{activeLens.profileTitle}</h2>
              <p className="ui-sans mt-3 text-sm leading-6 text-[#405047]">{activeLens.profileText}</p>
            </div>

            <div className="grid grid-cols-2 border-b border-[#9d8f77] bg-[#f7f1e5]">
              <div className="border-r border-[#9d8f77] px-4 py-4">
                <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">{activeLens.statOne[0]}</p>
                <p className="mt-1 text-xl font-semibold">{activeLens.statOne[1]}</p>
              </div>
              <div className="px-4 py-4">
                <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">{activeLens.statTwo[0]}</p>
                <p className="mt-1 text-xl font-semibold">{activeLens.statTwo[1]}</p>
              </div>
            </div>

            <div className="space-y-3 px-5 py-5">
              {activeLens.facts.map(([label, value]) => (
                <div key={label} className="border border-[#9d8f77] bg-[#fffaf0] px-4 py-3">
                  <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">{label}</p>
                  <p className="ui-sans mt-2 text-sm font-bold leading-5 text-[#17211c]">{value}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className="min-w-0 p-4 sm:p-5">
            {isRankingLens ? (
              <SelectedInsightPanel activeLens={activeLens} selectedAction={selectedAction} isRankingLens={isRankingLens} />
            ) : (
              <RelationshipMap
                evidenceProcessed={evidenceProcessed}
                approvedCount={approvedCount}
                evidenceRequestCount={evidenceRequestCount}
                eyebrow={activeLens.mapEyebrow}
                title={activeLens.mapTitle}
                question={activeLens.mapQuestion}
                badge={activeLens.mapBadge}
                mapActors={mapActorsByLens[relationshipMapLens]}
                mapLines={mapLinesByLens[relationshipMapLens]}
              />
            )}
          </section>

          {!isRankingLens ? (
            <aside className="min-w-0 border-t border-[#17211c] bg-[#fbf4e7] xl:col-span-2">
              <SelectedInsightPanel activeLens={activeLens} selectedAction={selectedAction} isRankingLens={isRankingLens} />
            </aside>
          ) : null}
        </section>

        <section className="grid min-w-0 grid-cols-1 border-t border-[#17211c] xl:grid-cols-2">
          <div className="border-b border-[#17211c] xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-3 border-b border-[#17211c] bg-[#f7f1e5] px-5 py-4">
              <Building2 className="h-5 w-5" aria-hidden />
              <div>
                <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">External enrichment</p>
                <h2 className="text-xl font-semibold leading-tight sm:text-2xl">What AI reads after LinkedIn</h2>
              </div>
            </div>
            {externalSignals.map((signal) => (
              <SignalRow key={signal.label} signal={signal} />
            ))}
          </div>

          <div>
            <div className="flex items-center gap-3 border-b border-[#17211c] bg-[#f7f1e5] px-5 py-4">
              <Users2 className="h-5 w-5" aria-hidden />
              <div>
                <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Internal signal fabric</p>
                <h2 className="text-xl font-semibold leading-tight sm:text-2xl">What the product collects quietly</h2>
              </div>
            </div>
            {internalSignals.map((signal) => (
              <SignalRow key={signal.label} signal={signal} />
            ))}
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-1 border-t border-[#17211c] bg-[#17211c] text-[#fffaf0] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="px-5 py-6 sm:px-7">
            <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#d9cfbd]">Conclusion layer</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight">{activeLens.conclusionTitle}</h2>
            <p className="ui-sans mt-3 max-w-[78ch] text-sm leading-6 text-[#e5decd]">{activeLens.conclusionText}</p>
          </div>
          <div className="grid grid-cols-2 border-t border-[#657064] xl:border-l xl:border-t-0">
            <div className="border-r border-[#657064] px-5 py-6">
              <UserCheck className="h-5 w-5" aria-hidden />
              <p className="mt-4 text-4xl font-semibold leading-none">74%</p>
              <p className="ui-sans mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[#d9cfbd]">Less admin chase</p>
            </div>
            <div className="px-5 py-6">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              <p className="mt-4 text-4xl font-semibold leading-none">5</p>
              <p className="ui-sans mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[#d9cfbd]">Actions ready</p>
            </div>
          </div>
        </section>

        <section className="grid min-w-0 grid-cols-1 gap-4 border-t border-[#17211c] bg-[#fbf4e7] px-5 py-5 sm:px-7">
          <div>
            <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Data setup</p>
            <h2 className="mt-1 text-3xl font-semibold leading-tight">Raw information pipeline</h2>
          </div>
          {evidenceProcessed ? (
            <section className="grid min-w-0 grid-cols-2 border border-[#17211c] bg-[#dce6d8] md:grid-cols-[minmax(0,1fr)_120px_150px_160px]">
              <div className="col-span-2 border-b border-[#9d8f77] px-5 py-4 md:col-span-1 md:border-b-0 sm:px-7">
                <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#45624f]">
                  Relationship evidence ready
                </p>
                <p className="ui-sans mt-1 text-sm font-bold text-[#17211c]">Evidence processed from 8 sources.</p>
              </div>
              <div className="border-r border-[#9d8f77] px-4 py-4 md:border-l">
                <p className="text-3xl font-semibold leading-none">18</p>
                <p className="ui-sans mt-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#45624f]">
                  Signals
                </p>
              </div>
              <div className="px-4 py-4 md:border-l">
                <p className="ui-sans text-sm font-bold text-[#17211c]">{approvedCount} approved</p>
                <p className="ui-sans mt-1 text-xs leading-5 text-[#45624f]">Governed links</p>
              </div>
              <div className="col-span-2 border-t border-[#9d8f77] px-4 py-4 md:col-span-1 md:border-l md:border-t-0">
                <p className="ui-sans text-sm font-bold text-[#17211c]">{evidenceRequestCount} evidence request</p>
                <p className="ui-sans mt-1 text-xs leading-5 text-[#45624f]">Manual follow-up</p>
              </div>
            </section>
          ) : null}
          <EvidenceIngestionPanel queuedEvidenceSource={queuedEvidenceSource} onQueueEvidence={setQueuedEvidenceSource} />
          <button
            className="ui-sans flex min-h-[54px] w-full items-center justify-center gap-2 border border-[#17211c] bg-[#17211c] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#fffaf0] shadow-[4px_4px_0_#9d8f77]"
            onClick={() => {
              setEvidenceProcessed(true);
              setSelectedActionId(activeLens.processedSelectionId);
            }}
          >
            {evidenceProcessed ? 'Reprocess Raw Information' : 'Process Raw Information'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </section>
      </div>
    </main>
  );
}
