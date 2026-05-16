export interface User {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "startup" | "mentor" | "investor" | "user";
  country?: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export interface Startup {
  id: string;
  user_id: string;
  startup_name: string;
  description: string;
  industry: string;
  stage: "idea" | "pre-seed" | "seed" | "series-a" | "series-b" | "growth" | "mature";
  country: string;
  website?: string;
  team_size: number;
  founded_year?: number;
  revenue_model?: string;
  target_market?: string;
  problem_statement?: string;
  solution?: string;
  traction?: string;
  funding_raised: number;
  funding_needed?: number;
  verification_score: number;
  risk_level: "low" | "medium" | "high" | "critical" | "unknown";
  verification_status: "pending" | "verified" | "rejected" | "under_review";
  ai_summary?: string;
  tags?: string[];
  founder_name?: string;
  founder_email?: string;
  active_relationships?: number;
  created_at: string;
}

export interface Mentor {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  bio?: string;
  expertise: string[];
  industries: string[];
  years_experience: number;
  availability: "available" | "limited" | "unavailable";
  mentorship_style?: string;
  max_startups: number;
  current_startups: number;
  rating: number;
  total_reviews: number;
  linkedin_url?: string;
  company?: string;
  title?: string;
  location?: string;
  timezone?: string;
  languages?: string[];
  active_mentorships?: number;
  created_at: string;
}

export interface Investor {
  id: string;
  user_id: string;
  full_name: string;
  firm_name: string;
  investment_thesis?: string;
  focus_industries: string[];
  investment_stages: string[];
  ticket_size_min?: number;
  ticket_size_max?: number;
  portfolio_size: number;
  country?: string;
  website?: string;
  created_at: string;
}

export interface Programme {
  id: string;
  programme_name: string;
  description?: string;
  organizer?: string;
  country: string;
  focus_area: string[];
  cohort_size: number;
  duration_weeks?: number;
  funding_offered?: number;
  equity_taken?: number;
  application_deadline?: string;
  start_date?: string;
  end_date?: string;
  status: "open" | "closed" | "ongoing" | "completed";
  eligibility_criteria?: string;
  benefits?: string[];
  website?: string;
  enrolled_startups?: number;
  created_at: string;
}

export interface Relationship {
  id: string;
  relationship_type:
    | "mentor_startup"
    | "startup_programme"
    | "startup_investor"
    | "mentor_programme"
    | "investor_programme"
    | "partner_startup";
  startup_id?: string;
  mentor_id?: string;
  programme_id?: string;
  investor_id?: string;
  match_score: number;
  confidence_score: number;
  engagement_health: "excellent" | "good" | "fair" | "poor" | "inactive" | "new";
  status: "pending" | "active" | "paused" | "completed" | "rejected";
  ai_generated: boolean;
  ai_reasoning?: string;
  notes?: string;
  next_action?: string;
  startup_name?: string;
  mentor_name?: string;
  programme_name?: string;
  investor_name?: string;
  created_at: string;
}

export interface VerificationResult {
  startup_id: string;
  startup_name: string;
  verification_score: number;
  risk_level: string;
  industry_classification: string;
  stage_classification: string;
  legitimacy_score: number;
  confidence_level: number;
  risk_factors: string[];
  strengths: string[];
  recommendations: string[];
  ai_summary: string;
}

export interface MentorMatch {
  mentor_id: string;
  mentor_name: string;
  mentor_title?: string;
  mentor_company?: string;
  mentor_location?: string;
  mentor_expertise: string[];
  mentor_industries: string[];
  mentor_rating: number;
  mentor_availability: string;
  years_experience: number;
  compatibility_score: number;
  confidence_score: number;
  mentorship_quality: string;
  expertise_relevance: number;
  reasoning: string;
  recommended_focus_areas: string[];
  estimated_impact: string;
}

export interface ProgrammeMatch {
  programme_id: string;
  programme_name: string;
  organizer?: string;
  country: string;
  focus_area: string[];
  duration_weeks?: number;
  funding_offered?: number;
  status: string;
  benefits?: string[];
  fit_score: number;
  confidence_score: number;
  eligibility_assessment: string;
  reasoning: string;
  application_recommendation: string;
}

export interface DashboardStats {
  startups: {
    total: string;
    verified: string;
    avg_score: string;
    low_risk: string;
    high_risk: string;
  };
  mentors: {
    total: string;
    available: string;
    avg_rating: string;
  };
  programmes: {
    total: string;
    open: string;
    ongoing: string;
  };
  relationships: {
    total: string;
    active: string;
    ai_generated: string;
    avg_match_score: string;
    excellent_health: string;
  };
}

export interface EcosystemInsights {
  ecosystem_health_score: number;
  key_insights: string[];
  opportunities: string[];
  risks: string[];
  recommendations: string[];
  growth_trajectory: string;
  headline: string;
}

export interface GraphNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: Record<string, unknown>;
  animated?: boolean;
  label?: string;
}
