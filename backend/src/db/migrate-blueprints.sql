-- Migration: Relationship Blueprints & supporting tables
-- Run once against the live database:
--   psql $DATABASE_URL -f src/db/migrate-blueprints.sql

-- ============================================================
-- RELATIONSHIP BLUEPRINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS relationship_blueprints (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                        VARCHAR(255) NOT NULL,
  description                 TEXT,
  relationship_type           VARCHAR(50) NOT NULL CHECK (relationship_type IN (
                                'mentor_startup','startup_programme','startup_investor','partner_startup'
                              )),
  duration_weeks              INTEGER DEFAULT 12,
  required_checkins_per_month INTEGER DEFAULT 2,
  milestone_week_schedule     INTEGER[] DEFAULT '{4,8,12}',
  health_alert_threshold      INTEGER DEFAULT 60,
  escalation_threshold        INTEGER DEFAULT 40,
  inactivity_alert_days       INTEGER DEFAULT 7,
  auto_complete_on_end_date   BOOLEAN DEFAULT true,
  eligibility_rules           JSONB DEFAULT '{}',
  auto_actions                JSONB DEFAULT '{
    "on_inactivity": "nudge",
    "on_health_below_threshold": "escalate",
    "on_completion": "capture_outcome"
  }',
  created_by                  UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active                   BOOLEAN DEFAULT true,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprints_type      ON relationship_blueprints(relationship_type);
CREATE INDEX IF NOT EXISTS idx_blueprints_active     ON relationship_blueprints(is_active);
CREATE INDEX IF NOT EXISTS idx_blueprints_created_by ON relationship_blueprints(created_by);

-- ============================================================
-- Add blueprint_id + health_score to relationships
-- ============================================================
ALTER TABLE relationships
  ADD COLUMN IF NOT EXISTS blueprint_id  UUID REFERENCES relationship_blueprints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS health_score  DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS end_date      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_relationships_blueprint ON relationships(blueprint_id);

-- ============================================================
-- RELATIONSHIP OUTCOMES
-- ============================================================
CREATE TABLE IF NOT EXISTS relationship_outcomes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id   UUID REFERENCES relationships(id) ON DELETE CASCADE,
  overall_rating    DECIMAL(3,1) CHECK (overall_rating BETWEEN 1 AND 5),
  goal_achievement  DECIMAL(5,2),
  nps_score         INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  key_wins          TEXT[],
  challenges        TEXT[],
  testimonial       TEXT,
  captured_by       UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_relationship ON relationship_outcomes(relationship_id);

-- ============================================================
-- Seed two starter blueprints so the page is not empty
-- ============================================================
INSERT INTO relationship_blueprints
  (name, description, relationship_type, duration_weeks,
   required_checkins_per_month, milestone_week_schedule,
   health_alert_threshold, escalation_threshold, inactivity_alert_days)
VALUES
  ('3-Month Growth Mentorship',
   'A structured 12-week mentorship focused on go-to-market strategy, fundraising preparation, and team building for early-stage startups.',
   'mentor_startup', 12, 2, '{4,8,12}', 60, 40, 7),
  ('6-Month Accelerator Programme',
   'A 24-week accelerator engagement covering product-market fit, investor readiness, and regional expansion for seed-stage companies.',
   'startup_programme', 24, 4, '{4,8,12,16,20,24}', 65, 45, 10)
ON CONFLICT DO NOTHING;
