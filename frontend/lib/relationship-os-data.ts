export type ActorType = "startup" | "mentor" | "partner";
export type LensId = "relationships" | "mentor-ranking" | "partner-intros" | "evidence";
export type ActionStatus = "Auto-ready" | "Review suggested" | "Manual evidence needed";

export type Actor = {
  id: string;
  type: ActorType;
  name: string;
  subtitle: string;
  sector: string;
  location: string;
  tags: string[];
  summary: string;
  evidenceIds: string[];
};

export type EvidenceSource = {
  id: string;
  label: string;
  title: string;
  detail: string;
  state: string;
  primary?: boolean;
};

export type Lens = {
  id: LensId;
  label: string;
  description: string;
  metric: string;
};

export type Signal = {
  id: string;
  sourceId: string;
  label: string;
  detail: string;
  state: string;
};

export type Relationship = {
  id: string;
  startupId: string;
  mentorId: string;
  health: number;
  baselineHealth: number;
  hoursSynced: number;
  founderConfidence: number;
  mentorConfidence: number;
  milestonesCompleted: string;
  blockersIdentified: string;
  reasoning: string;
  nextStep: string;
};

export type Action = {
  id: string;
  lensId: LensId;
  title: string;
  status: ActionStatus;
  confidence: number;
  actorIds: string[];
  relationshipId?: string;
  summary: string;
  aiReasoning: string;
  signals: string[];
};

export type MentorRanking = {
  mentorId: string;
  rank: number;
  score: number;
  capacity: string;
  bestStartupId: string;
  reasoning: string;
};

export type FirebaseFunctionContract = {
  name: string;
  input: string;
  output: string;
};

export type EcosystemSnapshot = {
  generatedAt: string;
  ecosystemName: string;
  actors: Actor[];
  evidenceSources: EvidenceSource[];
  lenses: Lens[];
  signals: Signal[];
  relationships: Relationship[];
  actions: Action[];
  mentorRankings: MentorRanking[];
  ingestionEvidenceSourceIds: string[];
};

export type EcosystemDataGateway = {
  getSnapshot: () => Promise<EcosystemSnapshot>;
  processEvidence: (sourceIds: string[]) => Promise<EcosystemSnapshot>;
};

export const relationshipOsFirebaseContract = {
  collections: [
    "ecosystems/{ecosystemId}",
    "ecosystems/{ecosystemId}/actors/{actorId}",
    "ecosystems/{ecosystemId}/evidenceSources/{evidenceSourceId}",
    "ecosystems/{ecosystemId}/relationships/{relationshipId}",
    "ecosystems/{ecosystemId}/recommendations/{recommendationId}",
    "ecosystems/{ecosystemId}/decisions/{decisionId}",
  ],
  functions: [
    {
      name: "getEcosystemSnapshot",
      input: "{ ecosystemId: string }",
      output: "EcosystemSnapshot",
    },
    {
      name: "processEvidence",
      input: "{ ecosystemId: string; sourceIds: string[] }",
      output: "{ snapshot: EcosystemSnapshot; processedEvidenceIds: string[] }",
    },
    {
      name: "rankMentors",
      input: "{ ecosystemId: string; startupId?: string }",
      output: "{ rankings: MentorRanking[] }",
    },
    {
      name: "recordDecision",
      input: "{ ecosystemId: string; actionId: string; decision: 'approved' | 'needs_evidence' }",
      output: "{ ok: true; actionId: string }",
    },
  ] satisfies FirebaseFunctionContract[],
};

export const relationshipOsSnapshot: EcosystemSnapshot = {
  generatedAt: "2026-05-16T09:00:00.000Z",
  ecosystemName: "BWAI May Cohort",
  actors: [
    {
      id: "startup-atlas-ai",
      type: "startup",
      name: "Atlas AI",
      subtitle: "Seed, enterprise risk ops",
      sector: "Enterprise AI",
      location: "Kuala Lumpur",
      tags: ["Seed", "B2B", "Risk Ops"],
      summary: "Needs a clearer enterprise sales plan after three pilot conversations stalled in procurement.",
      evidenceIds: ["csv-may-sync", "whatsapp-export", "deck-atlas"],
    },
    {
      id: "startup-carbonloop",
      type: "startup",
      name: "CarbonLoop",
      subtitle: "Pre-seed, circular logistics",
      sector: "Climate",
      location: "Singapore",
      tags: ["Pre-seed", "Climate", "Logistics"],
      summary: "Has strong customer discovery, but needs finance support before any partner introductions go out for the June grant deadline.",
      evidenceIds: ["csv-may-sync", "partner-notes"],
    },
    {
      id: "startup-nora-health",
      type: "startup",
      name: "Nora Health",
      subtitle: "Seed, clinical workflow",
      sector: "Healthtech",
      location: "Jakarta",
      tags: ["Seed", "Healthtech", "Workflow"],
      summary: "Clinical champion interest is high, but compliance language needs mentor review before outreach.",
      evidenceIds: ["csv-may-sync", "deck-nora"],
    },
    {
      id: "mentor-priya",
      type: "mentor",
      name: "Priya Raman",
      subtitle: "Enterprise GTM mentor",
      sector: "Enterprise AI",
      location: "Bengaluru",
      tags: ["GTM", "SaaS", "Procurement"],
      summary: "Best fit for founders who need enterprise sales sequencing and buyer mapping.",
      evidenceIds: ["mentor-notes-priya", "whatsapp-export"],
    },
    {
      id: "mentor-daniel",
      type: "mentor",
      name: "Daniel Khoo",
      subtitle: "Operations and marketplace scale",
      sector: "Logistics",
      location: "Singapore",
      tags: ["Ops", "Marketplace", "B2B"],
      summary: "Useful for logistics startups that need partner rhythm and unit economics review.",
      evidenceIds: ["mentor-notes-daniel", "partner-notes"],
    },
    {
      id: "mentor-alicia",
      type: "mentor",
      name: "Alicia Mensah",
      subtitle: "Clinical product advisor",
      sector: "Healthtech",
      location: "London",
      tags: ["Clinical", "Compliance", "Product"],
      summary: "Strong reviewer for healthtech teams translating clinical risk into buyer-safe product language.",
      evidenceIds: ["mentor-notes-alicia", "deck-nora"],
    },
    {
      id: "mentor-farah",
      type: "mentor",
      name: "Farah Lim",
      subtitle: "Climate finance partner",
      sector: "Climate",
      location: "Kuala Lumpur",
      tags: ["Climate", "Finance", "Grants"],
      summary: "Can help climate founders frame grant readiness and investor partner asks.",
      evidenceIds: ["mentor-notes-farah", "partner-notes"],
    },
    {
      id: "partner-greenbridge",
      type: "partner",
      name: "GreenBridge Labs",
      subtitle: "Climate pilot network",
      sector: "Climate",
      location: "Singapore",
      tags: ["Pilot", "Circularity", "Grant"],
      summary: "Relevant partner for CarbonLoop's warehouse recycling pilot and grant evidence package.",
      evidenceIds: ["partner-notes"],
    },
  ],
  evidenceSources: [
    {
      id: "whatsapp-export",
      label: "Chat",
      title: "WhatsApp mentor export",
      detail: "Primary chat evidence for open questions, promised follow-ups, and context that gets lost outside formal systems.",
      state: "Collected",
      primary: true,
    },
    {
      id: "csv-may-sync",
      label: "Check-in",
      title: "Monthly mentor check-in",
      detail: "Time spent, milestones, open issues, founder rating, and mentor rating.",
      state: "Ready",
    },
    {
      id: "deck-atlas",
      label: "Deck",
      title: "Atlas AI buyer deck",
      detail: "Procurement workflow, pilot claims, security narrative, and buying committee notes.",
      state: "Ready",
    },
    {
      id: "deck-nora",
      label: "Doc",
      title: "Nora clinical one-pager",
      detail: "Compliance positioning, clinical workflow claims, and champion objections.",
      state: "Ready",
    },
    {
      id: "partner-notes",
      label: "Notes",
      title: "Partner introduction notes",
      detail: "Warm introduction context from program staff, partners, and sponsor office hours.",
      state: "Ready",
    },
  ],
  lenses: [
    {
      id: "relationships",
      label: "Relationships",
      description: "Find the mentor-startup relationships that need action next.",
      metric: "7 next steps",
    },
    {
      id: "mentor-ranking",
      label: "Mentor ranking",
      description: "See which mentor should be used first and why.",
      metric: "4 ranked mentors",
    },
    {
      id: "partner-intros",
      label: "Partner introductions",
      description: "Decide which introductions are ready and which need proof first.",
      metric: "3 partner moves",
    },
    {
      id: "evidence",
      label: "Evidence health",
      description: "Show the source material behind each recommendation.",
      metric: "5 evidence sources",
    },
  ],
  signals: [
    {
      id: "signal-atlas-procurement",
      sourceId: "whatsapp-export",
      label: "Atlas keeps running into procurement review",
      detail: "The chat points to a buyer-readiness problem: security owner, data access, and rollout risk need to be clear.",
      state: "Extracted",
    },
    {
      id: "signal-carbonloop-deadline",
      sourceId: "csv-may-sync",
      label: "CarbonLoop has a June grant deadline",
      detail: "The check-in shows urgency, finance needs, and missing pilot evidence.",
      state: "Linked",
    },
    {
      id: "signal-nora-compliance",
      sourceId: "whatsapp-export",
      label: "Nora's hospital introduction needs clinical review",
      detail: "The chat says the introduction should wait until the absolute claims are softened.",
      state: "Flagged",
    },
    {
      id: "signal-sync-confidence",
      sourceId: "csv-may-sync",
      label: "Survey ratings support the written evidence",
      detail: "The ratings are consistent with the check-in notes and WhatsApp follow-ups.",
      state: "Validated",
    },
  ],
  relationships: [
    {
      id: "rel-atlas-priya",
      startupId: "startup-atlas-ai",
      mentorId: "mentor-priya",
      health: 86,
      baselineHealth: 42,
      hoursSynced: 5.5,
      founderConfidence: 8,
      mentorConfidence: 9,
      milestonesCompleted: "Rebuilt enterprise GTM sequence and mapped the procurement committee.",
      blockersIdentified: "Security review keeps stalling because the buyer cannot explain security and rollout risk internally.",
      reasoning:
        "Atlas has moved beyond general sales advice. The next problem is specific: who owns security, data access, and rollout approval inside the buyer.",
      nextStep: "Schedule a focused follow-up between Priya and Atlas AI on the security narrative and procurement owner mapping.",
    },
    {
      id: "rel-carbonloop-farah",
      startupId: "startup-carbonloop",
      mentorId: "mentor-farah",
      health: 82,
      baselineHealth: 39,
      hoursSynced: 4,
      founderConfidence: 8,
      mentorConfidence: 8,
      milestonesCompleted: "Outlined grant budget, partner evidence, and warehouse pilot economics.",
      blockersIdentified: "Founder is unsure which climate evidence matters most for the June grant.",
      reasoning:
        "The need is time-sensitive and concrete. Farah can help CarbonLoop turn the grant deadline into a focused finance sprint.",
      nextStep: "Schedule a finance sprint between Farah and CarbonLoop; use GreenBridge Labs as the partner validation target.",
    },
    {
      id: "rel-nora-alicia",
      startupId: "startup-nora-health",
      mentorId: "mentor-alicia",
      health: 74,
      baselineHealth: 51,
      hoursSynced: 3,
      founderConfidence: 7,
      mentorConfidence: 8,
      milestonesCompleted: "Drafted clinical workflow claims and prepared two hospital champion questions.",
      blockersIdentified: "Compliance language sounds too absolute for a first hospital buyer conversation.",
      reasoning:
        "Nora has hospital interest, but the claim language creates avoidable risk. Alicia should review the one-pager before any introduction goes out.",
      nextStep: "Ask Alicia to review Nora's one-pager before new hospital introductions are sent.",
    },
  ],
  actions: [
    {
      id: "action-atlas-priya",
      lensId: "relationships",
      title: "Schedule a follow-up between Priya and Atlas AI",
      status: "Auto-ready",
      confidence: 91,
      actorIds: ["startup-atlas-ai", "mentor-priya"],
      relationshipId: "rel-atlas-priya",
      summary: "The check-in and WhatsApp thread both point to the same issue: Atlas needs help with procurement review.",
      aiReasoning:
        "Atlas needs a mentor who understands enterprise security review and buying committees. Priya has that pattern experience, and the latest check-in shows enough progress to act now.",
      signals: ["signal-atlas-procurement", "signal-sync-confidence"],
    },
    {
      id: "action-carbonloop-farah",
      lensId: "relationships",
      title: "Start CarbonLoop's climate finance sprint",
      status: "Auto-ready",
      confidence: 88,
      actorIds: ["startup-carbonloop", "mentor-farah", "partner-greenbridge"],
      relationshipId: "rel-carbonloop-farah",
      summary: "Mentor, partner, and deadline evidence all point to a single next step.",
      aiReasoning:
        "CarbonLoop's issue is deadline-sensitive and finance-specific. Farah can sharpen the grant ask before GreenBridge sees the pilot story.",
      signals: ["signal-carbonloop-deadline", "signal-sync-confidence"],
    },
    {
      id: "action-nora-alicia",
      lensId: "relationships",
      title: "Review Nora's clinical language before introductions",
      status: "Review suggested",
      confidence: 76,
      actorIds: ["startup-nora-health", "mentor-alicia"],
      relationshipId: "rel-nora-alicia",
      summary: "The fit is good, but a clinical introduction should wait for advisor review.",
      aiReasoning:
        "Nora has enough momentum for mentor support, but the clinical wording creates reputational risk. The right next step is review, not outreach.",
      signals: ["signal-nora-compliance", "signal-sync-confidence"],
    },
    {
      id: "action-rank-priya",
      lensId: "mentor-ranking",
      title: "Prioritize Priya for Atlas AI",
      status: "Auto-ready",
      confidence: 93,
      actorIds: ["mentor-priya", "startup-atlas-ai"],
      relationshipId: "rel-atlas-priya",
      summary: "Best combination of urgency, mentor fit, and clear evidence.",
      aiReasoning:
        "Priya should be prioritized because Atlas has a specific procurement issue, Priya has the right experience, and both sides rated the relationship highly.",
      signals: ["signal-atlas-procurement"],
    },
    {
      id: "action-greenbridge-carbonloop",
      lensId: "partner-intros",
      title: "Prepare a GreenBridge introduction for CarbonLoop",
      status: "Manual evidence needed",
      confidence: 68,
      actorIds: ["startup-carbonloop", "partner-greenbridge", "mentor-farah"],
      relationshipId: "rel-carbonloop-farah",
      summary: "GreenBridge is a strong fit, but CarbonLoop should prepare pilot economics before the introduction.",
      aiReasoning:
        "GreenBridge will likely ask for warehouse pilot economics. Ask for that evidence before making the introduction.",
      signals: ["signal-carbonloop-deadline"],
    },
  ],
  mentorRankings: [
    {
      mentorId: "mentor-priya",
      rank: 1,
      score: 93,
      capacity: "2 open slots",
      bestStartupId: "startup-atlas-ai",
      reasoning: "Strongest sector fit, clear current issue, and high ratings from both sides.",
    },
    {
      mentorId: "mentor-farah",
      rank: 2,
      score: 88,
      capacity: "1 urgent slot",
      bestStartupId: "startup-carbonloop",
      reasoning: "Time-sensitive climate finance match with a clear partner path.",
    },
    {
      mentorId: "mentor-alicia",
      rank: 3,
      score: 79,
      capacity: "Review only",
      bestStartupId: "startup-nora-health",
      reasoning: "Useful review, but clinical wording should stay human-approved.",
    },
    {
      mentorId: "mentor-daniel",
      rank: 4,
      score: 71,
      capacity: "1 slot",
      bestStartupId: "startup-carbonloop",
      reasoning: "Useful secondary mentor after the finance sprint is clarified.",
    },
  ],
  ingestionEvidenceSourceIds: ["whatsapp-export", "csv-may-sync", "deck-atlas", "deck-nora", "partner-notes"],
};

export function createMockRelationshipOsGateway(
  snapshot = relationshipOsSnapshot,
): EcosystemDataGateway {
  return {
    async getSnapshot() {
      return structuredClone(snapshot);
    },
    async processEvidence() {
      return structuredClone(snapshot);
    },
  };
}

export function validateRelationshipOsSnapshot(snapshot: EcosystemSnapshot): string[] {
  const errors: string[] = [];
  const actorIds = new Set(snapshot.actors.map((actor) => actor.id));
  const evidenceIds = new Set(snapshot.evidenceSources.map((source) => source.id));
  const lensIds = new Set(snapshot.lenses.map((lens) => lens.id));

  snapshot.actors.forEach((actor) => {
    actor.evidenceIds.forEach((sourceId) => {
      if (!evidenceIds.has(sourceId)) {
        errors.push(`${actor.name} references missing evidence source ${sourceId}.`);
      }
    });
  });

  snapshot.relationships.forEach((relationship) => {
    if (!actorIds.has(relationship.startupId)) {
      errors.push(`${relationship.id} references missing startup ${relationship.startupId}.`);
    }
    if (!actorIds.has(relationship.mentorId)) {
      errors.push(`${relationship.id} references missing mentor ${relationship.mentorId}.`);
    }
  });

  snapshot.actions.forEach((action) => {
    if (!lensIds.has(action.lensId)) {
      errors.push(`${action.title} references missing lens ${action.lensId}.`);
    }
    action.actorIds.forEach((actorId) => {
      if (!actorIds.has(actorId)) {
        errors.push(`${action.title} references missing actor ${actorId}.`);
      }
    });
  });

  snapshot.mentorRankings.forEach((ranking) => {
    if (!actorIds.has(ranking.mentorId)) {
      errors.push(`Mentor ranking ${ranking.rank} references missing mentor ${ranking.mentorId}.`);
    }
    if (!actorIds.has(ranking.bestStartupId)) {
      errors.push(`Mentor ranking ${ranking.rank} references missing startup ${ranking.bestStartupId}.`);
    }
  });

  return errors;
}
