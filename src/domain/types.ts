export type HealthStatus = 'healthy' | 'watch' | 'at-risk';

export type Mentor = {
  id: string;
  name: string;
  role: string;
  domain: string;
};

export type Startup = {
  id: string;
  name: string;
  category: string;
  stage: string;
  founder: string;
};

export type Relationship = {
  id: string;
  mentorId: string;
  startupId: string;
  baselineHealth: number;
  currentHealth: number;
  status: HealthStatus;
  hoursSynced: number;
  lastSignal: string;
  rationale: string;
  recommendedAction: string;
};

export type CohortSyncRow = {
  mentor_id: string;
  startup_id: string;
  hours_synced: number;
  milestones_completed: string;
  blockers_identified: string;
  founder_confidence_score: number;
  mentor_confidence_score: number;
};

export type RelationshipEvaluation = {
  relationshipId: string;
  engagement_health: number;
  previous_health: number;
  health_delta: number;
  confidence: number;
  reasoning: string;
  signals: {
    positive: string[];
    negative: string[];
  };
  recommended_action: string;
};

export type CohortEvaluation = {
  processedRows: number;
  cohortHealth: number;
  confidence: number;
  executiveSummary: string;
  relationshipEvaluations: RelationshipEvaluation[];
};
