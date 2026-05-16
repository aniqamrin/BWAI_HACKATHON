export type LensId = 'company' | 'service-provider' | 'partner-rankings' | 'mentor-rankings';

export type IconKey =
  | 'activity'
  | 'clock'
  | 'database'
  | 'file-text'
  | 'globe'
  | 'handshake'
  | 'link'
  | 'message-circle'
  | 'shield-check';

export type ActorKind = 'startup' | 'mentor' | 'service-provider' | 'programme' | 'partner' | 'admin';

export type Actor = {
  id: string;
  name: string;
  kind: ActorKind;
  role: string;
};

export type Signal = {
  id: string;
  evidenceSourceId: string;
  label: string;
  detail: string;
  state: string;
  iconKey: IconKey;
};

export type Action = {
  id: string;
  actorIds: string[];
  evidenceSourceIds: string[];
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

export type ActionDecision = 'approved' | 'evidence-requested';

export type LensConfig = {
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

export type MapActor = {
  actorId: string;
  label: string;
  role: string;
  x: string;
  y: string;
  tone: string;
};

export type MapLine = {
  x1: string;
  y1: string;
  x2: string;
  y2: string;
  stroke: string;
  strokeWidth: string;
  strokeDasharray?: string;
};

export type EvidenceSource = {
  id: string;
  actorIds: string[];
  label: string;
  title: string;
  detail: string;
  state: string;
  iconKey: IconKey;
  primary?: boolean;
};

export type FirebaseCollectionContract = {
  name: string;
  path: string;
  purpose: string;
};

export type FirebaseFunctionContract = {
  name: string;
  route: string;
  purpose: string;
};

export type EcosystemSnapshot = {
  ecosystemId: string;
  actors: Actor[];
  evidenceSources: EvidenceSource[];
  ingestionEvidenceSourceIds: string[];
  externalSignals: Signal[];
  internalSignals: Signal[];
  lenses: LensConfig[];
  actionsByLens: Record<LensId, Action[]>;
  mapActorsByLens: Record<Exclude<LensId, 'partner-rankings' | 'mentor-rankings'>, MapActor[]>;
  mapLinesByLens: Record<Exclude<LensId, 'partner-rankings' | 'mentor-rankings'>, MapLine[]>;
};

export type EcosystemDataGateway = {
  getSnapshot: (ecosystemId: string) => Promise<EcosystemSnapshot>;
  processEvidence: (ecosystemId: string, evidenceSourceId: string) => Promise<{ processedSignalCount: number }>;
  recordDecision: (
    ecosystemId: string,
    actionId: string,
    decision: ActionDecision,
  ) => Promise<{ actionId: string; decision: ActionDecision }>;
};

export type FirebaseGatewayTransport = {
  call: <Result>(name: string, payload: Record<string, unknown>) => Promise<Result>;
};

export const ecosystemFirebaseContract = {
  collections: [
    {
      name: 'ecosystems',
      path: 'ecosystems/{ecosystemId}',
      purpose: 'Tenant or programme-level container for a cohort graph and data-source settings.',
    },
    {
      name: 'actors',
      path: 'ecosystems/{ecosystemId}/actors/{actorId}',
      purpose: 'Startups, mentors, service providers, partners, programmes, and admin owners.',
    },
    {
      name: 'evidenceSources',
      path: 'ecosystems/{ecosystemId}/evidenceSources/{evidenceSourceId}',
      purpose: 'CSV uploads, WhatsApp exports, decks, LinkedIn links, websites, telemetry, and admin notes.',
    },
    {
      name: 'lenses',
      path: 'ecosystems/{ecosystemId}/lenses/{lensId}',
      purpose: 'UI lens configuration and the default recommendation selected for each demo workflow.',
    },
    {
      name: 'recommendations',
      path: 'ecosystems/{ecosystemId}/recommendations/{recommendationId}',
      purpose: 'Relationship, partner, provider, and mentor ranking recommendations with actor/evidence links.',
    },
    {
      name: 'decisions',
      path: 'ecosystems/{ecosystemId}/decisions/{decisionId}',
      purpose: 'Admin approvals, evidence requests, overrides, and governance notes.',
    },
  ],
  functions: [
    {
      name: 'getEcosystemSnapshot',
      route: 'GET /ecosystems/{ecosystemId}/snapshot',
      purpose: 'Read the denormalized dashboard payload used by the React app.',
    },
    {
      name: 'processEvidence',
      route: 'POST /ecosystems/{ecosystemId}/evidence:process',
      purpose: 'Extract relationship signals from uploaded CSV, WhatsApp, decks, links, or notes.',
    },
    {
      name: 'rankMentors',
      route: 'POST /ecosystems/{ecosystemId}/mentors:rank',
      purpose: 'Score mentor fit from founder need, cadence, warmth, advice quality, and outcome memory.',
    },
    {
      name: 'rankPartners',
      route: 'POST /ecosystems/{ecosystemId}/partners:rank',
      purpose: 'Score partner opportunities from mandate fit, timing, evidence quality, and governance risk.',
    },
    {
      name: 'recordDecision',
      route: 'POST /ecosystems/{ecosystemId}/decisions',
      purpose: 'Persist human approvals, evidence requests, and review outcomes.',
    },
  ],
} satisfies {
  collections: FirebaseCollectionContract[];
  functions: FirebaseFunctionContract[];
};

const actors: Actor[] = [
  { id: 'startup-pulsegrid', name: 'PulseGrid', kind: 'startup', role: 'Health data company' },
  { id: 'mentor-priya', name: 'Priya Raman', kind: 'mentor', role: 'Technical mentor' },
  { id: 'mentor-daniel', name: 'Daniel Khoo', kind: 'mentor', role: 'Commercialisation mentor' },
  { id: 'mentor-alicia', name: 'Alicia Mensah', kind: 'mentor', role: 'Clinical validation mentor' },
  { id: 'mentor-farah', name: 'Farah Lim', kind: 'mentor', role: 'Fundraising mentor' },
  { id: 'provider-medreg', name: 'MedReg Studio', kind: 'service-provider', role: 'Regulatory and market-access provider' },
  { id: 'programme-health-sandbox', name: 'Health Sandbox', kind: 'programme', role: 'Health programme' },
  { id: 'partner-hospital', name: 'Regional Hospital Network', kind: 'partner', role: 'Clinical pilot partner' },
  { id: 'partner-ministry', name: 'Health Ministry Sandbox', kind: 'partner', role: 'Regulatory pathway' },
  { id: 'partner-insurer', name: 'Insurer Innovation Lab', kind: 'partner', role: 'Commercial pathway' },
  { id: 'partner-university', name: 'University Medical Centre', kind: 'partner', role: 'Research pathway' },
  { id: 'admin-programme', name: 'Programme admin', kind: 'admin', role: 'Governance owner' },
  { id: 'provider-capacity', name: 'Provider Capacity', kind: 'admin', role: 'Governance check' },
  { id: 'provider-readiness-clinic', name: 'Readiness Clinic', kind: 'service-provider', role: 'Reusable service' },
];

export const evidenceSources: EvidenceSource[] = [
  {
    id: 'whatsapp-export',
    actorIds: ['startup-pulsegrid', 'mentor-priya'],
    label: 'Prominent source',
    title: 'WhatsApp conversation export',
    detail: 'Mentor chats, founder questions, introductions, follow-ups, blockers, and relationship warmth.',
    state: 'TXT, ZIP, PDF',
    iconKey: 'message-circle',
    primary: true,
  },
  {
    id: 'csv-programme-data',
    actorIds: ['startup-pulsegrid', 'programme-health-sandbox', 'mentor-priya'],
    label: 'Programme record',
    title: 'CSV programme data',
    detail: 'Cohort rows, hours synced, confidence scores, milestones, and blocker history.',
    state: 'CSV',
    iconKey: 'database',
  },
  {
    id: 'decks-and-notes',
    actorIds: ['startup-pulsegrid'],
    label: 'Uploaded material',
    title: 'Decks and notes',
    detail: 'Pitch decks, meeting notes, programme briefs, and service-provider material.',
    state: 'PDF, DOC',
    iconKey: 'file-text',
  },
  {
    id: 'linkedin-and-links',
    actorIds: ['startup-pulsegrid', 'provider-medreg', 'partner-hospital'],
    label: 'Web evidence',
    title: 'LinkedIn and partner links',
    detail: 'Actor pages, partner mandates, programme rules, and public capability evidence.',
    state: 'URL',
    iconKey: 'link',
  },
  {
    id: 'linkedin-anchor',
    actorIds: ['startup-pulsegrid'],
    label: 'LinkedIn anchor',
    title: 'LinkedIn anchor',
    detail: 'Company page, founder profile, operating keywords, region, seniority.',
    state: 'Resolved',
    iconKey: 'link',
  },
  {
    id: 'company-website',
    actorIds: ['startup-pulsegrid'],
    label: 'Company website',
    title: 'Company website',
    detail: 'Product claim, sector, buyer segment, traction proof, market language.',
    state: 'Parsed',
    iconKey: 'globe',
  },
  {
    id: 'pitch-deck',
    actorIds: ['startup-pulsegrid'],
    label: 'Pitch deck',
    title: 'Pitch deck',
    detail: 'Clinical workflow problem, roadmap, risk claims, funding readiness.',
    state: 'Scored',
    iconKey: 'file-text',
  },
  {
    id: 'partner-pages',
    actorIds: ['partner-hospital', 'partner-ministry', 'partner-insurer', 'partner-university'],
    label: 'Partner pages',
    title: 'Partner pages',
    detail: 'Sandbox mandate, target sectors, pilot requirements, country coverage.',
    state: 'Matched',
    iconKey: 'handshake',
  },
  {
    id: 'relationship-events',
    actorIds: ['startup-pulsegrid', 'mentor-priya', 'provider-medreg', 'programme-health-sandbox'],
    label: 'Relationship events',
    title: 'Relationship events',
    detail: 'Introductions created, accepted, ignored, renewed, escalated, or retired.',
    state: 'Auto-collected',
    iconKey: 'activity',
  },
  {
    id: 'meeting-telemetry',
    actorIds: ['startup-pulsegrid', 'mentor-priya', 'provider-medreg'],
    label: 'Meeting telemetry',
    title: 'Meeting telemetry',
    detail: 'Calendar sessions, no-shows, follow-up age, cadence gaps, reschedules.',
    state: 'Joined',
    iconKey: 'clock',
  },
  {
    id: 'admin-decisions',
    actorIds: ['admin-programme'],
    label: 'Admin decisions',
    title: 'Admin decisions',
    detail: 'Approvals, overrides, reviewer notes, governance exceptions, rule reuse.',
    state: 'Logged',
    iconKey: 'shield-check',
  },
  {
    id: 'outcome-memory',
    actorIds: ['mentor-priya', 'provider-medreg', 'partner-hospital'],
    label: 'Outcome memory',
    title: 'Outcome memory',
    detail: 'Past mentor outcomes, provider success rate, partner conversion signals.',
    state: 'Learning',
    iconKey: 'database',
  },
];

export const ingestionEvidenceSourceIds = ['whatsapp-export', 'csv-programme-data', 'decks-and-notes', 'linkedin-and-links'];

export const externalSignals: Signal[] = [
  evidenceSignal('linkedin-anchor'),
  evidenceSignal('company-website'),
  evidenceSignal('pitch-deck'),
  evidenceSignal('partner-pages'),
];

export const internalSignals: Signal[] = [
  evidenceSignal('relationship-events'),
  evidenceSignal('meeting-telemetry'),
  evidenceSignal('admin-decisions'),
  evidenceSignal('outcome-memory'),
];

const relationshipActions: Action[] = [
  {
    id: 'provider',
    actorIds: ['provider-medreg', 'startup-pulsegrid'],
    evidenceSourceIds: ['pitch-deck', 'outcome-memory', 'linkedin-and-links'],
    title: 'Attach service provider',
    actor: 'MedReg Studio to PulseGrid',
    confidence: '91%',
    status: 'Auto-ready',
    rationale: 'Regulatory blocker, clinical validation deck, and prior provider outcomes align.',
    evidence: ['Pitch deck risk section', 'Outcome memory', 'Service provider catalogue'],
  },
  {
    id: 'programme',
    actorIds: ['startup-pulsegrid', 'programme-health-sandbox', 'admin-programme'],
    evidenceSourceIds: ['linkedin-anchor', 'csv-programme-data', 'admin-decisions'],
    title: 'Create programme link',
    actor: 'PulseGrid to Health Sandbox',
    confidence: '87%',
    status: 'Review suggested',
    rationale: 'Programme criteria match, but admin approval is required for cross-border intake.',
    evidence: ['LinkedIn anchor', 'Programme eligibility rule', 'Admin governance policy'],
  },
  {
    id: 'mentor',
    actorIds: ['mentor-priya', 'startup-pulsegrid'],
    evidenceSourceIds: ['linkedin-anchor', 'meeting-telemetry', 'outcome-memory'],
    title: 'Add mentor support',
    actor: 'Priya Raman to PulseGrid',
    confidence: '83%',
    status: 'Auto-ready',
    rationale: 'Architecture expertise maps to unresolved integration risk and prior cohort pattern.',
    evidence: ['Founder profile', 'Meeting telemetry', 'Mentor outcome history'],
  },
  {
    id: 'partner',
    actorIds: ['partner-hospital', 'startup-pulsegrid', 'admin-programme'],
    evidenceSourceIds: ['partner-pages', 'company-website', 'admin-decisions'],
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
    actorIds: ['provider-medreg', 'startup-pulsegrid'],
    evidenceSourceIds: ['pitch-deck', 'outcome-memory', 'company-website'],
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
    actorIds: ['provider-medreg', 'programme-health-sandbox'],
    evidenceSourceIds: ['csv-programme-data', 'meeting-telemetry', 'relationship-events'],
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
    actorIds: ['provider-medreg', 'admin-programme', 'provider-readiness-clinic'],
    evidenceSourceIds: ['outcome-memory', 'admin-decisions', 'relationship-events'],
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
    actorIds: ['partner-hospital', 'startup-pulsegrid', 'programme-health-sandbox', 'admin-programme'],
    evidenceSourceIds: ['partner-pages', 'csv-programme-data', 'admin-decisions'],
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
    actorIds: ['partner-ministry', 'startup-pulsegrid', 'admin-programme'],
    evidenceSourceIds: ['partner-pages', 'admin-decisions', 'csv-programme-data'],
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
    actorIds: ['partner-insurer', 'startup-pulsegrid'],
    evidenceSourceIds: ['company-website', 'partner-pages', 'linkedin-and-links'],
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
    actorIds: ['partner-university', 'startup-pulsegrid', 'mentor-alicia'],
    evidenceSourceIds: ['partner-pages', 'outcome-memory', 'relationship-events'],
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

const mentorRankingActions: Action[] = [
  {
    id: 'mentor-priya',
    actorIds: ['mentor-priya', 'startup-pulsegrid'],
    evidenceSourceIds: ['meeting-telemetry', 'outcome-memory', 'whatsapp-export'],
    title: 'Priya Raman',
    actor: 'Architecture mentor',
    confidence: '91%',
    status: 'Auto-ready',
    category: 'Mentor',
    detailHeading: 'Priya Raman',
    rank: 1,
    tags: ['Architecture mentor', 'Fast cadence', 'Warm relationship'],
    rationale:
      'Best mentor fit because her integration architecture track record maps directly to PulseGrid unresolved technical risk and the founder already responds quickly to her guidance.',
    evidence: ['Meeting telemetry', 'Mentor outcome history', 'WhatsApp follow-up pattern'],
  },
  {
    id: 'mentor-daniel',
    actorIds: ['mentor-daniel', 'startup-pulsegrid'],
    evidenceSourceIds: ['linkedin-anchor', 'company-website', 'meeting-telemetry'],
    title: 'Daniel Khoo',
    actor: 'Commercialisation mentor',
    confidence: '84%',
    status: 'Review suggested',
    category: 'Mentor',
    detailHeading: 'Daniel Khoo',
    rank: 2,
    tags: ['Buyer access', 'Sector fit', 'Cadence watch'],
    rationale:
      'Strong secondary mentor for buyer discovery, but the evidence shows slower response cadence than the architecture support path.',
    evidence: ['Founder profile', 'Buyer segment overlap', 'Follow-up age'],
  },
  {
    id: 'mentor-alicia',
    actorIds: ['mentor-alicia', 'startup-pulsegrid', 'partner-hospital'],
    evidenceSourceIds: ['pitch-deck', 'partner-pages', 'outcome-memory'],
    title: 'Alicia Mensah',
    actor: 'Clinical validation mentor',
    confidence: '80%',
    status: 'Auto-ready',
    category: 'Mentor',
    detailHeading: 'Alicia Mensah',
    rank: 3,
    tags: ['Clinical proof', 'Validation support', 'Warm intro'],
    rationale:
      'Useful for validation planning after the immediate integration work is moving, especially if the hospital pathway opens.',
    evidence: ['Clinical workflow evidence', 'Partner pathway match', 'Past mentor outcomes'],
  },
  {
    id: 'mentor-farah',
    actorIds: ['mentor-farah', 'startup-pulsegrid'],
    evidenceSourceIds: ['pitch-deck', 'admin-decisions', 'csv-programme-data'],
    title: 'Farah Lim',
    actor: 'Fundraising mentor',
    confidence: '72%',
    status: 'Manual evidence needed',
    category: 'Mentor',
    detailHeading: 'Farah Lim',
    rank: 4,
    tags: ['Fundraising help', 'Timing mismatch', 'Evidence gap'],
    rationale:
      'Potentially useful later, but the current blocker evidence points to technical and clinical sequencing before fundraising preparation.',
    evidence: ['Funding readiness score', 'Missing investor brief', 'Programme priority rule'],
  },
];

export const actionsByLens: Record<LensId, Action[]> = {
  company: relationshipActions,
  'service-provider': serviceProviderActions,
  'partner-rankings': partnerRankingActions,
  'mentor-rankings': mentorRankingActions,
};

export const lensConfigs: Record<LensId, LensConfig> = {
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
  'mentor-rankings': {
    id: 'mentor-rankings',
    label: 'Mentor rankings',
    ariaLabel: 'Mentor rankings lens',
    source: 'linkedin.com/company/pulsegrid-health + mentor evidence',
    sourceState: 'Mentor context',
    profileLabel: 'Ranking context',
    profileTitle: 'PulseGrid mentorship bench',
    profileText:
      'Mentor ranking compares founder need, relationship warmth, response cadence, advice quality, and prior mentor outcomes.',
    statOne: ['Priority', 'Integration'],
    statTwo: ['Mentors', '4 ranked'],
    facts: [
      ['Ranking goal', 'Find the mentor most likely to move the next blocker'],
      ['Best mentor type', 'Architecture mentor with fast follow-up cadence'],
      ['Governance flag', 'Watch mentor load before assigning a second support line'],
    ],
    mapEyebrow: 'Mentor intelligence',
    mapTitle: 'Ranked mentor opportunities',
    mapQuestion: 'Which mentors should support this founder next?',
    mapBadge: '4 ranked mentors',
    queueEyebrow: 'AI mentor detail',
    queueTitle: 'Mentor ranking detail',
    selectedLabel: 'Mentor ranking detail',
    selectedDefaultId: 'mentor-priya',
    processedSelectionId: 'mentor-priya',
    conclusionTitle: 'The system ranks mentors by blocker fit, relationship signal, and follow-through risk.',
    conclusionText:
      'Priya Raman should be assigned first because the strongest evidence points to architecture risk, fast mentor cadence, and a warm relationship that is already producing follow-up.',
  },
};

const companyMapActors: MapActor[] = [
  { actorId: 'startup-pulsegrid', label: 'PulseGrid', role: 'Health data company', x: '48%', y: '44%', tone: 'bg-[#17211c] text-[#fffaf0]' },
  { actorId: 'mentor-priya', label: 'Priya Raman', role: 'Technical mentor', x: '18%', y: '18%', tone: 'bg-[#f7f1e5] text-[#17211c]' },
  { actorId: 'provider-medreg', label: 'MedReg Studio', role: 'Service provider', x: '18%', y: '68%', tone: 'bg-[#e7d4bc] text-[#17211c]' },
  { actorId: 'programme-health-sandbox', label: 'Health Sandbox', role: 'Programme', x: '73%', y: '18%', tone: 'bg-[#dce6d8] text-[#17211c]' },
  { actorId: 'partner-hospital', label: 'Hospital Network', role: 'Partner initiative', x: '76%', y: '67%', tone: 'bg-[#f0dfbf] text-[#17211c]' },
  { actorId: 'admin-programme', label: 'Programme admin', role: 'Governance owner', x: '49%', y: '86%', tone: 'bg-[#fbf4e7] text-[#17211c]' },
];

const serviceProviderMapActors: MapActor[] = [
  { actorId: 'provider-medreg', label: 'MedReg Studio', role: 'Service provider', x: '48%', y: '44%', tone: 'bg-[#17211c] text-[#fffaf0]' },
  { actorId: 'startup-pulsegrid', label: 'PulseGrid', role: 'Regulatory sprint', x: '18%', y: '20%', tone: 'bg-[#f7f1e5] text-[#17211c]' },
  { actorId: 'programme-health-sandbox', label: 'Health Sandbox', role: 'Office hours', x: '76%', y: '20%', tone: 'bg-[#dce6d8] text-[#17211c]' },
  { actorId: 'provider-readiness-clinic', label: 'Readiness Clinic', role: 'Reusable service', x: '18%', y: '68%', tone: 'bg-[#e7d4bc] text-[#17211c]' },
  { actorId: 'provider-capacity', label: 'Provider Capacity', role: 'Governance check', x: '76%', y: '68%', tone: 'bg-[#f0dfbf] text-[#17211c]' },
  { actorId: 'admin-programme', label: 'Programme admin', role: 'Approval owner', x: '49%', y: '86%', tone: 'bg-[#fbf4e7] text-[#17211c]' },
];

const companyMapLines: MapLine[] = [
  { x1: '48%', y1: '44%', x2: '18%', y2: '18%', stroke: '#45624f', strokeWidth: '2.5' },
  { x1: '48%', y1: '44%', x2: '18%', y2: '68%', stroke: '#45624f', strokeWidth: '2.5' },
  { x1: '48%', y1: '44%', x2: '73%', y2: '18%', stroke: '#ad8448', strokeWidth: '2.5', strokeDasharray: '7 5' },
  { x1: '48%', y1: '44%', x2: '76%', y2: '67%', stroke: '#934439', strokeWidth: '2.5', strokeDasharray: '4 6' },
  { x1: '49%', y1: '86%', x2: '73%', y2: '18%', stroke: '#9d8f77', strokeWidth: '1.5', strokeDasharray: '3 6' },
  { x1: '49%', y1: '86%', x2: '76%', y2: '67%', stroke: '#9d8f77', strokeWidth: '1.5', strokeDasharray: '3 6' },
];

const serviceProviderMapLines: MapLine[] = [
  { x1: '48%', y1: '44%', x2: '18%', y2: '20%', stroke: '#45624f', strokeWidth: '2.5' },
  { x1: '48%', y1: '44%', x2: '76%', y2: '20%', stroke: '#45624f', strokeWidth: '2.5' },
  { x1: '48%', y1: '44%', x2: '18%', y2: '68%', stroke: '#ad8448', strokeWidth: '2.5', strokeDasharray: '7 5' },
  { x1: '48%', y1: '44%', x2: '76%', y2: '68%', stroke: '#934439', strokeWidth: '2.5', strokeDasharray: '4 6' },
  { x1: '49%', y1: '86%', x2: '76%', y2: '68%', stroke: '#9d8f77', strokeWidth: '1.5', strokeDasharray: '3 6' },
  { x1: '49%', y1: '86%', x2: '76%', y2: '20%', stroke: '#9d8f77', strokeWidth: '1.5', strokeDasharray: '3 6' },
];

export const mapActorsByLens: EcosystemSnapshot['mapActorsByLens'] = {
  company: companyMapActors,
  'service-provider': serviceProviderMapActors,
};

export const mapLinesByLens: EcosystemSnapshot['mapLinesByLens'] = {
  company: companyMapLines,
  'service-provider': serviceProviderMapLines,
};

export const mockEcosystemSnapshot: EcosystemSnapshot = {
  ecosystemId: 'demo-cohort',
  actors,
  evidenceSources,
  ingestionEvidenceSourceIds,
  externalSignals,
  internalSignals,
  lenses: Object.values(lensConfigs),
  actionsByLens,
  mapActorsByLens,
  mapLinesByLens,
};

export function createMockEcosystemDataGateway(snapshot = mockEcosystemSnapshot): EcosystemDataGateway {
  return {
    async getSnapshot(ecosystemId) {
      return cloneSnapshot({ ...snapshot, ecosystemId });
    },
    async processEvidence(_ecosystemId, _evidenceSourceId) {
      return { processedSignalCount: 18 };
    },
    async recordDecision(_ecosystemId, actionId, decision) {
      return { actionId, decision };
    },
  };
}

export function createFirebaseEcosystemDataGateway(transport: FirebaseGatewayTransport): EcosystemDataGateway {
  return {
    getSnapshot(ecosystemId) {
      return transport.call<EcosystemSnapshot>('getEcosystemSnapshot', { ecosystemId });
    },
    processEvidence(ecosystemId, evidenceSourceId) {
      return transport.call<{ processedSignalCount: number }>('processEvidence', { ecosystemId, evidenceSourceId });
    },
    recordDecision(ecosystemId, actionId, decision) {
      return transport.call<{ actionId: string; decision: ActionDecision }>('recordDecision', {
        ecosystemId,
        actionId,
        decision,
      });
    },
  };
}

export function validateEcosystemSnapshot(snapshot: EcosystemSnapshot): string[] {
  const errors: string[] = [];
  const actorIds = new Set(snapshot.actors.map((actor) => actor.id));
  const evidenceIds = new Set(snapshot.evidenceSources.map((source) => source.id));
  const recommendationIds = new Set<string>();

  snapshot.evidenceSources.forEach((source) => {
    source.actorIds.forEach((actorId) => {
      if (!actorIds.has(actorId)) {
        errors.push(`Evidence source ${source.id} references missing actor ${actorId}.`);
      }
    });
  });

  [...snapshot.externalSignals, ...snapshot.internalSignals].forEach((signal) => {
    if (!evidenceIds.has(signal.evidenceSourceId)) {
      errors.push(`Signal ${signal.id} references missing evidence source ${signal.evidenceSourceId}.`);
    }
  });

  snapshot.ingestionEvidenceSourceIds.forEach((sourceId) => {
    if (!evidenceIds.has(sourceId)) {
      errors.push(`Ingestion panel references missing evidence source ${sourceId}.`);
    }
  });

  snapshot.lenses.forEach((lens) => {
    const actions = snapshot.actionsByLens[lens.id] ?? [];
    const lensActionIds = new Set(actions.map((action) => action.id));

    if (!lensActionIds.has(lens.selectedDefaultId)) {
      errors.push(`Lens ${lens.id} selectedDefaultId ${lens.selectedDefaultId} is missing from its recommendations.`);
    }
    if (!lensActionIds.has(lens.processedSelectionId)) {
      errors.push(`Lens ${lens.id} processedSelectionId ${lens.processedSelectionId} is missing from its recommendations.`);
    }

    actions.forEach((action) => {
      if (recommendationIds.has(action.id)) {
        errors.push(`Recommendation id ${action.id} is duplicated across lenses.`);
      }
      recommendationIds.add(action.id);

      action.actorIds.forEach((actorId) => {
        if (!actorIds.has(actorId)) {
          errors.push(`Recommendation ${action.id} references missing actor ${actorId}.`);
        }
      });
      action.evidenceSourceIds.forEach((sourceId) => {
        if (!evidenceIds.has(sourceId)) {
          errors.push(`Recommendation ${action.id} references missing evidence source ${sourceId}.`);
        }
      });
      if (action.evidence.length === 0) {
        errors.push(`Recommendation ${action.id} has no evidence labels for the UI.`);
      }
    });
  });

  Object.entries(snapshot.mapActorsByLens).forEach(([lensId, mapActors]) => {
    mapActors.forEach((actor) => {
      if (!actorIds.has(actor.actorId)) {
        errors.push(`Map actor ${actor.label} in ${lensId} references missing actor ${actor.actorId}.`);
      }
    });
  });

  return errors;
}

function evidenceSignal(evidenceSourceId: string): Signal {
  const source = evidenceSources.find((candidate) => candidate.id === evidenceSourceId);

  if (!source) {
    throw new Error(`Missing evidence source ${evidenceSourceId}.`);
  }

  return {
    id: source.id,
    evidenceSourceId: source.id,
    label: source.label,
    detail: source.detail,
    state: source.state,
    iconKey: source.iconKey,
  };
}

function cloneSnapshot(snapshot: EcosystemSnapshot): EcosystemSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as EcosystemSnapshot;
}
