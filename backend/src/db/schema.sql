-- EcosystemOS AI Platform - Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'startup', 'mentor', 'investor', 'user')),
  country VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- STARTUPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  startup_name VARCHAR(255) NOT NULL,
  description TEXT,
  industry VARCHAR(100),
  stage VARCHAR(50) CHECK (stage IN ('idea', 'pre-seed', 'seed', 'series-a', 'series-b', 'growth', 'mature')),
  country VARCHAR(100),
  website VARCHAR(255),
  team_size INTEGER DEFAULT 1,
  founded_year INTEGER,
  revenue_model TEXT,
  target_market TEXT,
  problem_statement TEXT,
  solution TEXT,
  traction TEXT,
  funding_raised DECIMAL(15,2) DEFAULT 0,
  funding_needed DECIMAL(15,2),
  verification_score DECIMAL(5,2) DEFAULT 0,
  risk_level VARCHAR(20) DEFAULT 'unknown' CHECK (risk_level IN ('low', 'medium', 'high', 'critical', 'unknown')),
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'under_review')),
  ai_summary TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_startups_user_id ON startups(user_id);
CREATE INDEX IF NOT EXISTS idx_startups_industry ON startups(industry);
CREATE INDEX IF NOT EXISTS idx_startups_stage ON startups(stage);
CREATE INDEX IF NOT EXISTS idx_startups_country ON startups(country);
CREATE INDEX IF NOT EXISTS idx_startups_verification_score ON startups(verification_score);

-- ============================================================
-- MENTORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  expertise TEXT[],
  industries TEXT[],
  years_experience INTEGER DEFAULT 0,
  availability VARCHAR(50) DEFAULT 'available' CHECK (availability IN ('available', 'limited', 'unavailable')),
  mentorship_style TEXT,
  max_startups INTEGER DEFAULT 3,
  current_startups INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  linkedin_url TEXT,
  company VARCHAR(255),
  title VARCHAR(255),
  location VARCHAR(255),
  timezone VARCHAR(100),
  languages TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mentors_user_id ON mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_mentors_availability ON mentors(availability);
CREATE INDEX IF NOT EXISTS idx_mentors_rating ON mentors(rating);

-- ============================================================
-- INVESTORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS investors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  firm_name VARCHAR(255),
  investment_thesis TEXT,
  focus_industries TEXT[],
  investment_stages TEXT[],
  ticket_size_min DECIMAL(15,2),
  ticket_size_max DECIMAL(15,2),
  portfolio_size INTEGER DEFAULT 0,
  country VARCHAR(100),
  website TEXT,
  linkedin_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investors_user_id ON investors(user_id);

-- ============================================================
-- PROGRAMMES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS programmes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  programme_name VARCHAR(255) NOT NULL,
  description TEXT,
  organizer VARCHAR(255),
  country VARCHAR(100),
  focus_area TEXT[],
  cohort_size INTEGER DEFAULT 10,
  duration_weeks INTEGER,
  funding_offered DECIMAL(15,2),
  equity_taken DECIMAL(5,2),
  application_deadline TIMESTAMPTZ,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'ongoing', 'completed')),
  eligibility_criteria TEXT,
  benefits TEXT[],
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programmes_country ON programmes(country);
CREATE INDEX IF NOT EXISTS idx_programmes_status ON programmes(status);

-- ============================================================
-- RELATIONSHIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
    'mentor_startup', 'startup_programme', 'startup_investor',
    'mentor_programme', 'investor_programme', 'partner_startup'
  )),
  startup_id UUID REFERENCES startups(id) ON DELETE SET NULL,
  mentor_id UUID REFERENCES mentors(id) ON DELETE SET NULL,
  programme_id UUID REFERENCES programmes(id) ON DELETE SET NULL,
  investor_id UUID REFERENCES investors(id) ON DELETE SET NULL,
  match_score DECIMAL(5,2) DEFAULT 0,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  engagement_health VARCHAR(20) DEFAULT 'new' CHECK (engagement_health IN ('excellent', 'good', 'fair', 'poor', 'inactive', 'new')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'rejected')),
  ai_generated BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  notes TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_startup ON relationships(startup_id);
CREATE INDEX IF NOT EXISTS idx_relationships_mentor ON relationships(mentor_id);
CREATE INDEX IF NOT EXISTS idx_relationships_status ON relationships(status);

-- ============================================================
-- VERIFICATION ATTEMPTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
  verification_score DECIMAL(5,2),
  risk_level VARCHAR(20),
  ai_summary TEXT,
  industry_classification VARCHAR(100),
  stage_classification VARCHAR(50),
  risk_factors TEXT[],
  strengths TEXT[],
  recommendations TEXT[],
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_startup ON verification_attempts(startup_id);

-- ============================================================
-- ENGAGEMENT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS engagement_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  notes TEXT,
  outcome VARCHAR(100),
  duration_minutes INTEGER,
  logged_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_engagement_relationship ON engagement_logs(relationship_id);
CREATE INDEX IF NOT EXISTS idx_engagement_created ON engagement_logs(created_at);

-- ============================================================
-- AI RECOMMENDATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  recommended_id UUID NOT NULL,
  recommended_type VARCHAR(50) NOT NULL,
  score DECIMAL(5,2),
  reasoning TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_target ON ai_recommendations(target_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON ai_recommendations(recommendation_type);

-- ============================================================
-- ANALYTICS SUMMARY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_startups INTEGER DEFAULT 0,
  total_mentors INTEGER DEFAULT 0,
  total_investors INTEGER DEFAULT 0,
  total_programmes INTEGER DEFAULT 0,
  total_relationships INTEGER DEFAULT 0,
  successful_matches INTEGER DEFAULT 0,
  active_programmes INTEGER DEFAULT 0,
  avg_verification_score DECIMAL(5,2) DEFAULT 0,
  avg_match_score DECIMAL(5,2) DEFAULT 0,
  ecosystem_health_score DECIMAL(5,2) DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON startups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentors_updated_at BEFORE UPDATE ON mentors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programmes_updated_at BEFORE UPDATE ON programmes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
