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
  category?: string;
  detailHeading?: string;
  rank?: number;
  tags?: string[];
};

type ActionDecision = 'approved' | 'evidence-requested';

type DisplayStatus = Action['status'] | 'Approved' | 'Evidence requested';

type LensId = 'company' | 'service-provider' | 'partner-rankings';

type LensConfig = {
  id: LensId;
  label: string;
  ariaLabel: string;
  source: string;
  sourceState: string;
  profileLabel: string;
  profileTitle: string;
  profileText: string;
  statOne: [string, string];
  statTwo: [string, string];
  facts: Array<[string, string]>;
  mapEyebrow: string;
  mapTitle: string;
  mapQuestion: string;
  mapBadge: string;
  queueEyebrow: string;
  queueTitle: string;
  selectedLabel: string;
  selectedDefaultId: string;
  processedSelectionId: string;
  conclusionTitle: string;
  conclusionText: string;
};

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

const serviceProviderActions: Action[] = [
  {
    id: 'provider-pulsegrid',
    title: 'PulseGrid regulatory sprint',
    actor: 'MedReg Studio to PulseGrid',
    confidence: '92%',
    status: 'Auto-ready',
    category: 'Company deployment',
    detailHeading: 'PulseGrid regulatory sprint',
    rationale: 'PulseGrid has a regulatory sequencing blocker that matches MedReg Studio outcomes in similar health data cases.',
    evidence: ['Company blocker', 'Provider outcome history', 'Pitch deck risk section'],
  },
  {
    id: 'provider-sandbox',
    title: 'Health Sandbox office hours',
    actor: 'MedReg Studio to Health Sandbox',
    confidence: '84%',
    status: 'Review suggested',
    category: 'Programme support',
    rationale: 'The programme has three health companies with evidence gaps around clinical validation and market-access sequencing.',
    evidence: ['Programme cohort mix', 'Meeting telemetry', 'Provider capacity window'],
  },
  {
    id: 'provider-readiness',
    title: 'Readiness clinic package',
    actor: 'MedReg Studio to admin team',
    confidence: '78%',
    status: 'Auto-ready',
    category: 'Reusable service',
    rationale: 'Repeated blocker patterns suggest a repeatable provider package instead of one-off introductions.',
    evidence: ['Outcome memory', 'Admin decision history', 'Common blocker taxonomy'],
  },
];

const partnerRankingActions: Action[] = [
  {
    id: 'partner-hospital',
    title: 'Regional Hospital Network',
    actor: 'Pilot pathway',
    confidence: '88%',
    status: 'Review suggested',
    category: 'Partner',
    detailHeading: 'Regional Hospital Network',
    rank: 1,
    tags: ['Pilot pathway', 'Warm intro', 'Clinical validation'],
    rationale: 'Best near-term pilot route because the hospital mandate, health data use case, and programme governance all line up.',
    evidence: ['Partner mandate page', 'Health Sandbox brief', 'Warm intro from programme admin'],
  },
  {
    id: 'partner-ministry',
    title: 'Health Ministry Sandbox',
    actor: 'Regulatory pathway',
    confidence: '82%',
    status: 'Manual evidence needed',
    category: 'Partner',
    rank: 2,
    tags: ['Regulatory fit', 'Slow access', 'Evidence gap'],
    rationale: 'Strong regulatory alignment, but the available evidence does not confirm an intake owner or decision cadence.',
    evidence: ['Policy theme match', 'Missing intake owner', 'Cross-border approval rule'],
  },
  {
    id: 'partner-insurer',
    title: 'Insurer Innovation Lab',
    actor: 'Commercial pathway',
    confidence: '76%',
    status: 'Review suggested',
    category: 'Partner',
    rank: 3,
    tags: ['Commercial route', 'Buyer signal', 'Mandate watch'],
    rationale: 'Commercial pathway is plausible, but mandate freshness is weaker than the hospital and regulatory options.',
    evidence: ['Website sector match', 'Buyer segment overlap', 'Outdated partner page'],
  },
  {
    id: 'partner-university',
    title: 'University Medical Centre',
    actor: 'Research pathway',
    confidence: '71%',
    status: 'Auto-ready',
    category: 'Partner',
    rank: 4,
    tags: ['Research fit', 'Validation support', 'Lower procurement'],
    rationale: 'Useful for validation support, but less likely to create a commercial or procurement path in the next cycle.',
    evidence: ['Research theme match', 'Clinical advisor overlap', 'Low procurement signal'],
  },
];

const actionsByLens: Record<LensId, Action[]> = {
  company: relationshipActions,
  'service-provider': serviceProviderActions,
  'partner-rankings': partnerRankingActions,
};

const lensConfigs: Record<LensId, LensConfig> = {
  company: {
    id: 'company',
    label: 'Company',
    ariaLabel: 'Company lens',
    source: 'linkedin.com/company/pulsegrid-health',
    sourceState: 'Actor resolved',
    profileLabel: 'Actor profile',
    profileTitle: 'PulseGrid',
    profileText:
      'Health data startup detected from LinkedIn, website copy, deck evidence, and programme activity already inside the platform.',
    statOne: ['Stage', 'Seed'],
    statTwo: ['Region', 'SEA'],
    facts: [
      ['Detected need', 'Regulatory sequencing and integration ownership'],
      ['Best next move', 'Bundle mentor, provider, and programme support'],
      ['Governance flag', 'Cross-border programme approval required'],
    ],
    mapEyebrow: 'Ecosystem map',
    mapTitle: 'Recommended relationship bundle',
    mapQuestion: 'Who should support this company next?',
    mapBadge: '3 auto-ready links',
    queueEyebrow: 'AI action queue',
    queueTitle: 'Relationships to create',
    selectedLabel: 'Selected recommendation',
    selectedDefaultId: 'provider',
    processedSelectionId: 'programme',
    conclusionTitle: 'The system recommends a relationship bundle, not a single match.',
    conclusionText:
      'PulseGrid should keep technical mentoring, add regulatory service support, enter the Health Sandbox shortlist, and route the partner pathway to admin review because one pilot owner is missing.',
  },
  'service-provider': {
    id: 'service-provider',
    label: 'Service provider',
    ariaLabel: 'Service provider lens',
    source: 'linkedin.com/company/medreg-studio',
    sourceState: 'Provider resolved',
    profileLabel: 'Service provider profile',
    profileTitle: 'MedReg Studio',
    profileText:
      'Regulatory and market-access provider matched against company blockers, programme demand, service history, and available capacity.',
    statOne: ['Role', 'Provider'],
    statTwo: ['Coverage', 'SEA Health'],
    facts: [
      ['Deployment signal', 'Repeated regulatory blockers across health companies'],
      ['Best next deployment', 'PulseGrid sprint plus Health Sandbox office hours'],
      ['Governance flag', 'Capacity and conflict checks before programme-wide assignment'],
    ],
    mapEyebrow: 'Deployment map',
    mapTitle: 'Where this provider creates leverage',
    mapQuestion: 'Which companies or programmes should this provider support next?',
    mapBadge: '2 priority deployments',
    queueEyebrow: 'AI deployment queue',
    queueTitle: 'Provider deployment queue',
    selectedLabel: 'Selected deployment',
    selectedDefaultId: 'provider-pulsegrid',
    processedSelectionId: 'provider-pulsegrid',
    conclusionTitle: 'The system deploys capability where ecosystem demand is strongest.',
    conclusionText:
      'MedReg Studio should support PulseGrid immediately, package the repeated regulatory pattern for Health Sandbox, and keep admin review on capacity before broader rollout.',
  },
  'partner-rankings': {
    id: 'partner-rankings',
    label: 'Partner rankings',
    ariaLabel: 'Partner rankings lens',
    source: 'linkedin.com/company/pulsegrid-health + health-sandbox brief',
    sourceState: 'Ranking context',
    profileLabel: 'Ranking context',
    profileTitle: 'PulseGrid + Health Sandbox',
    profileText:
      'Partner ranking starts from the company need and programme mandate, then scores which partners are worth pursuing now.',
    statOne: ['Priority', 'Pilot'],
    statTwo: ['Region', 'SEA'],
    facts: [
      ['Ranking goal', 'Find the highest-value partner pathway for the next cycle'],
      ['Best partner type', 'Clinical pilot partner with warm governance access'],
      ['Governance flag', 'Admin approval required before external introduction'],
    ],
    mapEyebrow: 'Partner intelligence',
    mapTitle: 'Ranked partner opportunities',
    mapQuestion: 'Which partners are most worth pursuing now?',
    mapBadge: '4 ranked partners',
    queueEyebrow: 'AI ranking detail',
    queueTitle: 'Partner ranking detail',
    selectedLabel: 'Partner ranking detail',
    selectedDefaultId: 'partner-hospital',
    processedSelectionId: 'partner-hospital',
    conclusionTitle: 'The system ranks partner opportunities by timing, mandate, evidence, and governance risk.',
    conclusionText:
      'Regional Hospital Network should be pursued first because it combines a clear pilot pathway, warm programme access, and stronger evidence than the regulatory or commercial alternatives.',
  },
};

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
  eyebrow,
  title,
  question,
  badge,
}: {
  evidenceProcessed: boolean;
  approvedCount: number;
  evidenceRequestCount: number;
  eyebrow: string;
  title: string;
  question: string;
  badge: string;
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

function PartnerRankingsPanel({
  rankings,
  selectedActionId,
  onSelect,
}: {
  rankings: Action[];
  selectedActionId: string;
  onSelect: (actionId: string) => void;
}) {
  return (
    <section className="min-h-[478px] border border-[#17211c] bg-[#fffaf0]">
      <div className="flex flex-col gap-3 border-b border-[#9d8f77] bg-[#f7f1e5] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Partner intelligence</p>
          <h2 className="mt-1 text-2xl font-semibold leading-tight">Ranked partner opportunities</h2>
          <p className="ui-sans mt-2 text-sm leading-6 text-[#405047]">Which partners are most worth pursuing now?</p>
        </div>
        <div className="ui-sans flex w-fit items-center gap-2 border border-[#45624f] bg-[#dce6d8] px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#263b2d]">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          4 ranked partners
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

export function EcosystemCommandCenter() {
  const [evidenceProcessed, setEvidenceProcessed] = useState(false);
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
            <div className="mb-4">
              <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">Operating lens</p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Operating lens selector">
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
          <button
            className="ui-sans flex min-h-[54px] w-full items-center justify-center gap-2 border border-[#17211c] bg-[#17211c] px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#fffaf0] shadow-[4px_4px_0_#9d8f77] lg:w-auto"
            onClick={() => {
              setEvidenceProcessed(true);
              setSelectedActionId(activeLens.processedSelectionId);
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
            {activeLensId === 'partner-rankings' ? (
              <PartnerRankingsPanel
                rankings={partnerRankingActions}
                selectedActionId={selectedAction.id}
                onSelect={setSelectedActionId}
              />
            ) : (
              <RelationshipMap
                evidenceProcessed={evidenceProcessed}
                approvedCount={approvedCount}
                evidenceRequestCount={evidenceRequestCount}
                eyebrow={activeLens.mapEyebrow}
                title={activeLens.mapTitle}
                question={activeLens.mapQuestion}
                badge={activeLens.mapBadge}
              />
            )}
          </section>

          <aside className="min-w-0 border-t border-[#17211c] bg-[#fbf4e7] xl:col-span-2 2xl:col-span-1 2xl:border-l 2xl:border-t-0">
            <div className="border-b border-[#17211c] px-5 py-5">
              <p className="ui-sans text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#657064]">{activeLens.queueEyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold leading-none">{activeLens.queueTitle}</h2>
            </div>
            {activeLensId !== 'partner-rankings' ? (
              <div className="grid divide-y divide-[#cab99d] lg:grid-cols-2 lg:divide-x lg:divide-y-0 2xl:block 2xl:divide-x-0 2xl:divide-y">
                {activeActions.map((action) => (
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
            ) : null}
            <section className={`${activeLensId === 'partner-rankings' ? '' : 'border-t'} border-[#17211c] bg-[#f7f1e5] px-5 py-5`}>
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
      </div>
    </main>
  );
}
