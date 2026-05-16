-- Migration: Governance, Cohorts, Milestones, Lifecycle Events, Behavioral Signals
-- Run once: docker exec ecosystemos_db psql -U ecosystemos -d ecosystemos_db -f /tmp/migrate-governance-cohorts.sql

-- ============================================================
-- ALTER RELATIONSHIPS (add missing columns)
-- ============================================================
ALTER TABLE relationships
  ADD COLUMN IF NOT EXISTS engagement_index    DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_health_check   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_activity_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_action_due     DATE,
  ADD COLUMN IF NOT EXISTS governance_violations JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cohort_id           UUID;

-- ============================================================
-- ALTER ENGAGEMENT_LOGS (add missing columns)
-- ============================================================
ALTER TABLE engagement_logs
  ADD COLUMN IF NOT EXISTS response_latency_hours DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS commitment_fulfilled   BOOLEAN DEFAULT true;

-- ============================================================
-- ALTER RELATIONSHIP_OUTCOMES (add missing columns from extended schema)
-- ============================================================
ALTER TABLE relationship_outcomes
  ADD COLUMN IF NOT EXISTS startup_id               UUID REFERENCES startups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mentor_id                UUID REFERENCES mentors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS programme_id             UUID REFERENCES programmes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS funding_raised_after     DECIMAL(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS milestone_completion_rate DECIMAL(4,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mentor_nps               INTEGER CHECK (mentor_nps >= 0 AND mentor_nps <= 10),
  ADD COLUMN IF NOT EXISTS programme_graduation     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS key_challenges           TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS success_classification   VARCHAR(20) CHECK (success_classification IN ('high','medium','low')),
  ADD COLUMN IF NOT EXISTS key_success_factors      TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS learning_points          TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pattern_tags             TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_summary               TEXT,
  ADD COLUMN IF NOT EXISTS captured_at              TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_outcomes_startup  ON relationship_outcomes(startup_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_mentor   ON relationship_outcomes(mentor_id);

-- ============================================================
-- GOVERNANCE RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS governance_rules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  rule_type     VARCHAR(50) NOT NULL CHECK (rule_type IN ('capacity','eligibility','conflict','cooldown','quality')),
  scope         VARCHAR(50) DEFAULT 'platform' CHECK (scope IN ('platform','programme','relationship_type')),
  scope_id      UUID,
  condition_json JSONB NOT NULL,
  action_json   JSONB NOT NULL DEFAULT '{"type":"block","message":"Governance rule violation"}',
  is_active     BOOLEAN DEFAULT true,
  violation_count INTEGER DEFAULT 0,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governance_active ON governance_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_governance_type   ON governance_rules(rule_type);

-- ============================================================
-- COHORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS cohorts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  name         VARCHAR(255) NOT NULL,
  country      VARCHAR(100),
  description  TEXT,
  startup_ids  UUID[] DEFAULT '{}',
  mentor_ids   UUID[] DEFAULT '{}',
  blueprint_id UUID REFERENCES relationship_blueprints(id) ON DELETE SET NULL,
  status       VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft','matching','active','completed')),
  match_matrix JSONB DEFAULT '{}',
  approved_at  TIMESTAMPTZ,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cohorts_programme ON cohorts(programme_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status    ON cohorts(status);

-- ============================================================
-- RELATIONSHIP MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS relationship_milestones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  due_week        INTEGER,
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','missed','skipped')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_relationship ON relationship_milestones(relationship_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status       ON relationship_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date     ON relationship_milestones(due_date);

-- ============================================================
-- LIFECYCLE EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS lifecycle_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
  event_type      VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created','health_check','nudge_sent','escalation','milestone_due',
    'milestone_completed','auto_completed','governance_violation',
    'outcome_captured','status_changed','log_added'
  )),
  triggered_by    VARCHAR(20) DEFAULT 'system' CHECK (triggered_by IN ('scheduler','user','ai','system')),
  payload         JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_relationship ON lifecycle_events(relationship_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_event_type  ON lifecycle_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lifecycle_created     ON lifecycle_events(created_at DESC);

-- ============================================================
-- BEHAVIORAL SIGNALS
-- ============================================================
CREATE TABLE IF NOT EXISTS behavioral_signals (
  id                              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id                 UUID REFERENCES relationships(id) ON DELETE CASCADE UNIQUE,
  avg_response_latency_hours      DECIMAL(8,2) DEFAULT 0,
  meeting_commitment_ratio        DECIMAL(4,3) DEFAULT 0,
  milestone_completion_rate       DECIMAL(4,3) DEFAULT 0,
  next_action_followthrough_rate  DECIMAL(4,3) DEFAULT 0,
  engagement_velocity             DECIMAL(4,3) DEFAULT 0,
  composite_index                 DECIMAL(5,2) DEFAULT 0,
  computed_at                     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_relationship ON behavioral_signals(relationship_id);

-- ============================================================
-- Seed 3 default governance rules
-- ============================================================
INSERT INTO governance_rules (name, description, rule_type, condition_json, action_json)
VALUES
  ('Mentor Capacity Cap',
   'A mentor cannot exceed their maximum startup capacity',
   'capacity',
   '{"field":"mentor.current_startups","operator":">=","value":"mentor.max_startups"}',
   '{"type":"block","message":"Mentor has reached maximum startup capacity"}'),
  ('Minimum Verification Score',
   'Startups must have a minimum verification score of 40 for matching',
   'eligibility',
   '{"field":"startup.verification_score","operator":"<","value":"40"}',
   '{"type":"warn","message":"Startup has a low verification score — proceed with caution"}'),
  ('Flagged Startup Block',
   'Startups with critical risk cannot be matched',
   'eligibility',
   '{"field":"startup.risk_level","operator":"==","value":"critical"}',
   '{"type":"block","message":"Startup is flagged as critical risk — relationship blocked"}')
ON CONFLICT DO NOTHING;
