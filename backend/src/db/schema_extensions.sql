-- EcosystemOS Schema Extensions
-- Run AFTER the base schema.sql

-- ============================================================
-- ALTER RELATIONSHIPS TABLE (add new columns)
-- ============================================================
ALTER TABLE relationships
  ADD COLUMN IF NOT EXISTS blueprint_id UUID,
  ADD COLUMN IF NOT EXISTS health_score DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_index DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_action_due DATE,
  ADD COLUMN IF NOT EXISTS governance_violations JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS cohort_id UUID;

-- ALTER ENGAGEMENT_LOGS TABLE
ALTER TABLE engagement_logs
  ADD COLUMN IF NOT EXISTS response_latency_hours DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS commitment_fulfilled BOOLEAN DEFAULT true;

-- ============================================================
-- RELATIONSHIP BLUEPRINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS relationship_blueprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
    'mentor_startup', 'startup_programme', 'startup_investor', 'partner_startup'
  )),
  duration_weeks INTEGER DEFAULT 12,
  required_checkins_per_month INTEGER DEFAULT 2,
  milestone_week_schedule INTEGER[] DEFAULT ARRAY[4, 8, 12],
  health_alert_threshold INTEGER DEFAULT 60,
  escalation_threshold INTEGER DEFAULT 40,
  inactivity_alert_days INTEGER DEFAULT 7,
  auto_complete_on_end_date BOOLEAN DEFAULT true,
  eligibility_rules JSONB DEFAULT '{}',
  auto_actions JSONB DEFAULT '{"on_inactivity": "nudge", "on_health_below_threshold": "escalate", "on_completion": "capture_outcome"}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprints_type ON relationship_blueprints(relationship_type);
CREATE INDEX IF NOT EXISTS idx_blueprints_active ON relationship_blueprints(is_active);

CREATE TRIGGER update_blueprints_updated_at BEFORE UPDATE ON relationship_blueprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- GOVERNANCE RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS governance_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('capacity', 'eligibility', 'conflict', 'cooldown', 'quality')),
  scope VARCHAR(50) DEFAULT 'platform' CHECK (scope IN ('platform', 'programme', 'relationship_type')),
  scope_id UUID,
  condition_json JSONB NOT NULL,
  action_json JSONB NOT NULL DEFAULT '{"type": "block", "message": "Governance rule violation"}',
  is_active BOOLEAN DEFAULT true,
  violation_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governance_active ON governance_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_governance_type ON governance_rules(rule_type);

-- ============================================================
-- COHORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100),
  description TEXT,
  startup_ids UUID[] DEFAULT '{}',
  mentor_ids UUID[] DEFAULT '{}',
  blueprint_id UUID REFERENCES relationship_blueprints(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'matching', 'active', 'completed')),
  match_matrix JSONB DEFAULT '{}',
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cohorts_programme ON cohorts(programme_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);

CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RELATIONSHIP MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS relationship_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_week INTEGER,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_relationship ON relationship_milestones(relationship_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON relationship_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_due_date ON relationship_milestones(due_date);

-- ============================================================
-- RELATIONSHIP OUTCOMES
-- ============================================================
CREATE TABLE IF NOT EXISTS relationship_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startups(id) ON DELETE SET NULL,
  mentor_id UUID REFERENCES mentors(id) ON DELETE SET NULL,
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  funding_raised_after DECIMAL(15,2) DEFAULT 0,
  milestone_completion_rate DECIMAL(4,3) DEFAULT 0,
  mentor_nps INTEGER CHECK (mentor_nps >= 0 AND mentor_nps <= 10),
  programme_graduation BOOLEAN DEFAULT false,
  key_wins TEXT[] DEFAULT '{}',
  key_challenges TEXT[] DEFAULT '{}',
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  success_classification VARCHAR(20) CHECK (success_classification IN ('high', 'medium', 'low')),
  key_success_factors TEXT[] DEFAULT '{}',
  learning_points TEXT[] DEFAULT '{}',
  pattern_tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_relationship ON relationship_outcomes(relationship_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_startup ON relationship_outcomes(startup_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_mentor ON relationship_outcomes(mentor_id);

-- ============================================================
-- LIFECYCLE EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS lifecycle_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created', 'health_check', 'nudge_sent', 'escalation', 'milestone_due',
    'milestone_completed', 'auto_completed', 'governance_violation',
    'outcome_captured', 'status_changed', 'log_added'
  )),
  triggered_by VARCHAR(20) DEFAULT 'system' CHECK (triggered_by IN ('scheduler', 'user', 'ai', 'system')),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_relationship ON lifecycle_events(relationship_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_event_type ON lifecycle_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lifecycle_created ON lifecycle_events(created_at DESC);

-- ============================================================
-- BEHAVIORAL SIGNALS
-- ============================================================
CREATE TABLE IF NOT EXISTS behavioral_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE UNIQUE,
  avg_response_latency_hours DECIMAL(8,2) DEFAULT 0,
  meeting_commitment_ratio DECIMAL(4,3) DEFAULT 0,
  milestone_completion_rate DECIMAL(4,3) DEFAULT 0,
  next_action_followthrough_rate DECIMAL(4,3) DEFAULT 0,
  engagement_velocity DECIMAL(4,3) DEFAULT 0,
  composite_index DECIMAL(5,2) DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_relationship ON behavioral_signals(relationship_id);
