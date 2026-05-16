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
  Search,
  ShieldCheck,
  UserCheck,
  Users2,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';

type Icon = ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;

type Signal = {
  label: string;
  detail: string;
  state: string;
  icon: Icon;
};

type Action = {
  id: string;
  title: string;
  actor: string;
  confidence: string;
  status: 'Auto-ready' | 'Review suggested' | 'Manual evidence needed';
  rationale: string;
  evidence: string[];
};

type ActionDecision = 'approved' | 'evidence-requested';

type DisplayStatus = Action['status'] | 'Approved' | 'Evidence requested';

const externalSignals: Signal[] = [
  {
    label: 'LinkedIn anchor',
    detail: 'Company page, founder profile, operating keywords, region, seniority.',
    state: 'Resolved',
    icon: Link2,
  },
  {
    label: 'Company website',
    detail: 'Product claim, sector, buyer segment, traction proof, market language.',
    state: 'Parsed',
    icon: Globe2,
  },
  {
    label: 'Pitch deck',
    detail: 'Clinical workflow problem, roadmap, risk claims, funding readiness.',
    state: 'Scored',
    icon: FileText,
  },
  {
    label: 'Partner pages',
    detail: 'Sandbox mandate, target sectors, pilot requirements, country coverage.',
    state: 'Matched',
    icon: Handshake,
  },
];

const internalSignals: Signal[] = [
  {
    label: 'Relationship events',
    detail: 'Introductions created, accepted, ignored, renewed, escalated, or retired.',
    state: 'Auto-collected',
    icon: Activity,
  },
  {
    label: 'Meeting telemetry',
    detail: 'Calendar sessions, no-shows, follow-up age, cadence gaps, reschedules.',
    state: 'Joined',
    icon: Clock3,
  },
  {
    label: 'Admin decisions',
    detail: 'Approvals, overrides, reviewer notes, governance exceptions, rule reuse.',
    state: 'Logged',
    icon: ShieldCheck,
  },
  {
    label: 'Outcome memory',
    detail: 'Past mentor outcomes, provider success rate, partner conversion signals.',
    state: 'Learning',
    icon: Database,
  },
];

const relationshipActions: Action[] = [
  {
    id: 'provider',
    title: 'Attach service provider',
    actor: 'MedReg Studio to PulseGrid',
    confidence: '91%',
    status: 'Auto-ready',
    rationale: 'Regulatory blocker, clinical validation deck, and prior provider outcomes align.',
    evidence: ['Pitch deck risk section', 'Outcome memory', 'Service provider catalogue'],
  },
  {
    id: 'programme',
    title: 'Create programme link',
    actor: 'PulseGrid to Health Sandbox',
    confidence: '87%',
    status: 'Review suggested',
    rationale: 'Programme criteria match, but admin approval is required for cross-border intake.',
    evidence: ['LinkedIn anchor', 'Programme eligibility rule', 'Admin governance policy'],
  },
  {
    id: 'mentor',
    title: 'Add mentor support',
    actor: 'Priya Raman to PulseGrid',
    confidence: '83%',
    status: 'Auto-ready',
    rationale: 'Architecture expertise maps to unresolved integration risk and prior cohort pattern.',
    evidence: ['Founder profile', 'Meeting telemetry', 'Mentor outcome history'],
  },
  {
    id: 'partner',
    title: 'Escalate partner pathway',
    actor: 'Regional Hospital Network',
    confidence: '69%',
    status: 'Manual evidence needed',
    rationale: 'Strong sector fit, but pilot owner is missing from available source evidence.',
    evidence: ['Partner page', 'Website sector match', 'Missing pilot owner field'],
  },
];

const actors = [
  { label: 'PulseGrid', role: 'Health data company', x: '48%', y: '44%', tone: 'bg-[#17211c] text-[#fffaf0]' },
  { label: 'Priya Raman', role: 'Technical mentor', x: '18%', y: '18%', tone: 'bg-[#f7f1e5] text-[#17211c]' },
  { label: 'MedReg Studio', role: 'Service provider', x: '18%', y: '68%', tone: 'bg-[#e7d4bc] text-[#17211c]' },
  { label: 'Health Sandbox', role: 'Programme', x: '73%', y: '18%', tone: 'bg-[#dce6d8] text-[#17211c]' },
  { label: 'Hospital Network', role: 'Partner initiative', x: '76%', y: '67%', tone: 'bg-[#f0dfbf] text-[#17211c]' },
  { label: 'Programme admin', role: 'Governance owner', x: '49%', y: '86%', tone: 'bg-[#fbf4e7] text-[#17211c]' },
];

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
  const IconComponent = signal.icon;

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

function RelationshipMap({
  evidenceProcessed,
  approvedCount,
  evidenceRequestCount,
}: {
  evidenceProcessed: boolean;
  approvedCount: number;
  evidenceRequestCount: number;
}) {
  return (
    <div className="relative min-h-[478px] overflow-hidden border border-[#17211c] bg-[#fffaf0]">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-[#9d8f77] bg-[#f7f1e5] px-5 py-4">
        <div>
          <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Ecosystem map</p>
          <h2 className="mt-1 text-2xl font-semibold leading-none">Recommended relationship bundle</h2>
        </div>
        <div className="ui-sans flex items-center gap-2 border border-[#45624f] bg-[#dce6d8] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#263b2d]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          3 auto-ready links
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-[82px] top-[88px]">
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          <line x1="48%" y1="44%" x2="18%" y2="18%" stroke="#45624f" strokeWidth="2.5" />
          <line x1="48%" y1="44%" x2="18%" y2="68%" stroke="#45624f" strokeWidth="2.5" />
          <line x1="48%" y1="44%" x2="73%" y2="18%" stroke="#ad8448" strokeWidth="2.5" strokeDasharray="7 5" />
          <line x1="48%" y1="44%" x2="76%" y2="67%" stroke="#934439" strokeWidth="2.5" strokeDasharray="4 6" />
          <line x1="49%" y1="86%" x2="73%" y2="18%" stroke="#9d8f77" strokeWidth="1.5" strokeDasharray="3 6" />
          <line x1="49%" y1="86%" x2="76%" y2="67%" stroke="#9d8f77" strokeWidth="1.5" strokeDasharray="3 6" />
        </svg>

        {actors.map((actor) => (
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

export function EcosystemCommandCenter() {
  const [evidenceProcessed, setEvidenceProcessed] = useState(false);
  const [selectedActionId, setSelectedActionId] = useState('provider');
  const [decisions, setDecisions] = useState<Record<string, ActionDecision>>({});
  const selectedAction = useMemo(
    () => relationshipActions.find((action) => action.id === selectedActionId) ?? relationshipActions[0],
    [selectedActionId],
  );
  const approvedCount = Object.values(decisions).filter((decision) => decision === 'approved').length;
  const evidenceRequestCount = Object.values(decisions).filter((decision) => decision === 'evidence-requested').length;

  function displayStatusFor(action: Action): DisplayStatus {
    if (decisions[action.id] === 'approved') return 'Approved';
    if (decisions[action.id] === 'evidence-requested') return 'Evidence requested';
    return action.status;
  }

  function recordDecision(actionId: string, decision: ActionDecision) {
    setDecisions((current) => ({ ...current, [actionId]: decision }));
    setSelectedActionId(actionId);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#ede4d1] px-3 py-4 text-[#17211c] sm:px-5 sm:py-5">
      <div className="mx-auto w-full max-w-[1540px] min-w-0 border border-[#17211c] bg-[#f7f1e5] shadow-[6px_6px_0_#17211c] sm:shadow-[8px_8px_0_#17211c]">
        <header className="grid min-w-0 grid-cols-1 border-b border-[#17211c] xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
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
          <div className="min-w-0 border-t border-[#17211c] bg-[#fffaf0] px-5 py-5 sm:px-6 sm:py-6 xl:border-l xl:border-t-0">
            <p className="ui-sans text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Operating promise</p>
            <p className="mt-3 text-xl font-semibold leading-tight sm:text-2xl">
              Automate discovery and evidence. Keep humans on judgement and governance.
            </p>
          </div>
        </header>

        <section className="grid min-w-0 grid-cols-1 items-end gap-4 border-b border-[#17211c] bg-[#fbf4e7] px-5 py-5 lg:grid-cols-[minmax(0,1fr)_auto] sm:px-7">
          <div className="min-w-0">
            <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Starting point</p>
            <div className="mt-2 flex min-h-[54px] items-center gap-3 border border-[#17211c] bg-[#fffaf0] px-4">
              <Search className="h-5 w-5 text-[#405047]" aria-hidden />
              <p className="ui-sans min-w-0 flex-1 truncate text-sm font-bold text-[#17211c]">
                linkedin.com/company/pulsegrid-health
              </p>
              <span className="ui-sans border border-[#45624f] bg-[#dce6d8] px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[#263b2d]">
                {evidenceProcessed ? 'Evidence ready' : 'Actor resolved'}
              </span>
            </div>
          </div>
          <button
            className="ui-sans flex min-h-[54px] w-full items-center justify-center gap-2 border border-[#17211c] bg-[#17211c] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#fffaf0] shadow-[4px_4px_0_#9d8f77] lg:w-auto"
            onClick={() => {
              setEvidenceProcessed(true);
              setSelectedActionId('programme');
            }}
          >
            {evidenceProcessed ? 'Reprocess relationship evidence' : 'Process relationship evidence'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </section>

        {evidenceProcessed ? (
          <section className="grid min-w-0 grid-cols-2 border-b border-[#17211c] bg-[#dce6d8] md:grid-cols-[minmax(0,1fr)_120px_150px_160px]">
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

        <section className="grid min-w-0 grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[310px_minmax(0,1fr)_390px]">
          <aside className="min-w-0 border-b border-[#17211c] bg-[#fbf4e7] xl:border-b-0 xl:border-r">
            <div className="border-b border-[#17211c] px-5 py-5">
              <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Actor profile</p>
              <h2 className="mt-2 text-3xl font-semibold leading-none">PulseGrid</h2>
              <p className="ui-sans mt-3 text-sm leading-6 text-[#405047]">
                Health data startup detected from LinkedIn, website copy, deck evidence, and programme activity already inside
                the platform.
              </p>
            </div>

            <div className="grid grid-cols-2 border-b border-[#9d8f77] bg-[#f7f1e5]">
              <div className="border-r border-[#9d8f77] px-4 py-4">
                <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">Stage</p>
                <p className="mt-1 text-xl font-semibold">Seed</p>
              </div>
              <div className="px-4 py-4">
                <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">Region</p>
                <p className="mt-1 text-xl font-semibold">SEA</p>
              </div>
            </div>

            <div className="space-y-3 px-5 py-5">
              {[
                ['Detected need', 'Regulatory sequencing and integration ownership'],
                ['Best next move', 'Bundle mentor, provider, and programme support'],
                ['Governance flag', 'Cross-border programme approval required'],
              ].map(([label, value]) => (
                <div key={label} className="border border-[#9d8f77] bg-[#fffaf0] px-4 py-3">
                  <p className="ui-sans text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#657064]">{label}</p>
                  <p className="ui-sans mt-2 text-sm font-bold leading-5 text-[#17211c]">{value}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className="min-w-0 p-4 sm:p-5">
            <RelationshipMap
              evidenceProcessed={evidenceProcessed}
              approvedCount={approvedCount}
              evidenceRequestCount={evidenceRequestCount}
            />
          </section>

          <aside className="min-w-0 border-t border-[#17211c] bg-[#fbf4e7] xl:col-span-2 2xl:col-span-1 2xl:border-l 2xl:border-t-0">
            <div className="border-b border-[#17211c] px-5 py-5">
              <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">AI action queue</p>
              <h2 className="mt-2 text-3xl font-semibold leading-none">Relationships to create</h2>
            </div>
            <div className="grid divide-y divide-[#cab99d] lg:grid-cols-2 lg:divide-x lg:divide-y-0 2xl:block 2xl:divide-x-0 2xl:divide-y">
              {relationshipActions.map((action) => (
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
                      onClick={() => setSelectedActionId(action.id)}
                    >
                      Review
                    </button>
                    <button
                      aria-label={`Approve ${action.title}`}
                      className="flex min-h-10 items-center justify-center border border-[#45624f] bg-[#dce6d8] px-2 py-2 text-[#263b2d] disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!evidenceProcessed}
                      onClick={() => recordDecision(action.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      aria-label={`Request evidence for ${action.title}`}
                      className="flex min-h-10 items-center justify-center border border-[#934439] bg-[#fffaf0] px-2 py-2 text-[#743025] disabled:cursor-not-allowed disabled:opacity-45"
                      disabled={!evidenceProcessed}
                      onClick={() => recordDecision(action.id, 'evidence-requested')}
                    >
                      Evidence
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <section className="border-t border-[#17211c] bg-[#f7f1e5] px-5 py-5">
              <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">
                Selected recommendation
              </p>
              <h3 className="mt-2 text-2xl font-semibold leading-tight">{selectedAction.actor}</h3>
              <p className="ui-sans mt-3 text-xs leading-5 text-[#405047]">{selectedAction.rationale}</p>
              <div className="mt-4 grid gap-2">
                {selectedAction.evidence.map((evidence) => (
                  <div key={evidence} className="ui-sans border border-[#9d8f77] bg-[#fffaf0] px-3 py-2 text-xs font-bold">
                    {evidence}
                  </div>
                ))}
              </div>
            </section>
          </aside>
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

        <section className="grid min-w-0 grid-cols-1 border-t border-[#17211c] bg-[#17211c] text-[#fffaf0] xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="px-5 py-6 sm:px-7">
            <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#d9cfbd]">Conclusion layer</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight">
              The system recommends a relationship bundle, not a single match.
            </h2>
            <p className="ui-sans mt-3 max-w-[78ch] text-sm leading-6 text-[#e5decd]">
              PulseGrid should keep technical mentoring, add regulatory service support, enter the Health Sandbox shortlist, and
              route the partner pathway to admin review because one pilot owner is missing.
            </p>
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
      </div>
    </main>
  );
}
