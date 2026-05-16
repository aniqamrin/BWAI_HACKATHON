-- EcosystemOS AI Platform — Seed Data
-- Run after schema.sql
-- Demo password for ALL seed users: "Password123!"
-- bcrypt hash ($2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay) verified with bcryptjs

-- ============================================================
-- USERS
-- ============================================================
INSERT INTO users (id, full_name, email, password_hash, role, country) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin User',       'admin@ecosystemos.ai',    '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'admin',    'Kenya'),
  ('a0000000-0000-0000-0000-000000000002', 'Sarah Kimani',     'sarah@techstartup.co.ke', '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'startup',  'Kenya'),
  ('a0000000-0000-0000-0000-000000000003', 'James Okonkwo',    'james@agritech.ng',       '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'startup',  'Nigeria'),
  ('a0000000-0000-0000-0000-000000000004', 'Amara Diallo',     'amara@fintech.sn',        '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'startup',  'Senegal'),
  ('a0000000-0000-0000-0000-000000000005', 'Dr. Michael Chen', 'mchen@mentor.com',        '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'mentor',   'Singapore'),
  ('a0000000-0000-0000-0000-000000000006', 'Priya Sharma',     'priya@mentor.in',         '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'mentor',   'India'),
  ('a0000000-0000-0000-0000-000000000007', 'David Osei',       'david@mentor.gh',         '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'mentor',   'Ghana'),
  ('a0000000-0000-0000-0000-000000000008', 'Victoria Fund',    'victoria@vcfund.com',     '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'investor', 'USA'),
  ('a0000000-0000-0000-0000-000000000009', 'Kwame Mensah',     'kwame@healthtech.gh',     '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'startup',  'Ghana'),
  ('a0000000-0000-0000-0000-000000000010', 'Fatima Al-Hassan', 'fatima@edtech.eg',        '$2a$10$pYUwBfgpyWQ10sB0Y7UGt.hkrna4oex0vdKO7QqG21BOmJrG2kcay', 'startup',  'Egypt')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- STARTUPS
-- ============================================================
INSERT INTO startups (id, user_id, startup_name, description, industry, stage, country, website,
  team_size, founded_year, problem_statement, solution, traction,
  funding_raised, verification_score, risk_level, verification_status, tags) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'PayFlow Africa', 'AI-powered cross-border payment infrastructure for African SMEs',
   'FinTech', 'seed', 'Kenya', 'https://payflow.africa', 8, 2022,
   'High transaction costs and slow cross-border payments in Africa',
   'ML-based FX optimization with mobile-first payment rails',
   '12,000 active users, $2M monthly transaction volume',
   500000, 87.5, 'low', 'verified', ARRAY['fintech','payments','africa','ai']),

  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003',
   'FarmSense AI', 'Precision agriculture platform using IoT sensors and AI crop prediction',
   'AgriTech', 'pre-seed', 'Nigeria', 'https://farmsense.ng', 4, 2023,
   'Smallholder farmers lack data-driven insights for crop management',
   'IoT sensor network with AI-powered yield prediction and advisory',
   '500 farmers onboarded, 23% yield improvement',
   150000, 72.0, 'medium', 'verified', ARRAY['agritech','iot','ai','nigeria']),

  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004',
   'CreditBridge', 'Alternative credit scoring for unbanked populations using mobile data',
   'FinTech', 'seed', 'Senegal', 'https://creditbridge.sn', 6, 2022,
   '70% of West Africans lack formal credit history',
   'Behavioral data analysis from mobile usage patterns for credit scoring',
   '8,000 credit assessments, 94% repayment rate',
   300000, 81.0, 'low', 'verified', ARRAY['fintech','credit','inclusion','west-africa']),

  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000009',
   'MediConnect', 'Telemedicine platform connecting rural patients with urban specialists',
   'HealthTech', 'series-a', 'Ghana', 'https://mediconnect.gh', 15, 2021,
   'Rural healthcare access gap in Sub-Saharan Africa',
   'Video consultation platform with AI triage and EHR integration',
   '45,000 consultations, 120 partner hospitals',
   1200000, 91.0, 'low', 'verified', ARRAY['healthtech','telemedicine','africa','ai']),

  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000010',
   'LearnPath', 'Adaptive learning platform for K-12 students in MENA region',
   'EdTech', 'seed', 'Egypt', 'https://learnpath.eg', 10, 2022,
   'One-size-fits-all education fails diverse learners',
   'AI-personalized curriculum with gamification and parent dashboards',
   '25,000 students, 4.7/5 teacher rating',
   400000, 78.5, 'low', 'verified', ARRAY['edtech','ai','mena','k12'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MENTORS
-- ============================================================
INSERT INTO mentors (id, user_id, bio, expertise, industries, years_experience,
  availability, rating, total_reviews, company, title, location) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005',
   'Former CTO at 3 successful fintech startups. Expert in scaling payment systems across Asia and Africa.',
   ARRAY['fintech','payments','scaling','product-strategy','fundraising'],
   ARRAY['FinTech','Banking','Payments'], 18, 'available', 4.9, 47,
   'PayScale Ventures', 'Managing Partner', 'Singapore'),

  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006',
   'Serial entrepreneur with 2 exits. Deep expertise in B2B SaaS and enterprise sales in emerging markets.',
   ARRAY['saas','enterprise-sales','product-market-fit','go-to-market','fundraising'],
   ARRAY['SaaS','Enterprise','B2B'], 14, 'available', 4.7, 32,
   'Emerge Capital', 'Venture Partner', 'Mumbai'),

  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000007',
   'AgriTech pioneer with 20 years in precision agriculture. Built and sold 2 agri-data companies.',
   ARRAY['agritech','iot','data-analytics','supply-chain','impact-investing'],
   ARRAY['AgriTech','FoodTech','CleanTech'], 20, 'limited', 4.8, 28,
   'AgroVentures Africa', 'Founder & CEO', 'Accra')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INVESTORS
-- ============================================================
INSERT INTO investors (id, user_id, firm_name, investment_thesis, focus_industries,
  investment_stages, ticket_size_min, ticket_size_max, portfolio_size, country) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000008',
   'Horizon Africa Fund',
   'Backing Africa-focused tech startups solving real problems at scale',
   ARRAY['FinTech','HealthTech','AgriTech','EdTech'], ARRAY['seed','series-a'],
   250000, 2000000, 23, 'USA')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PROGRAMMES
-- ============================================================
INSERT INTO programmes (id, programme_name, description, organizer, country, focus_area,
  cohort_size, duration_weeks, funding_offered, status, benefits, eligibility_criteria) VALUES
  ('e0000000-0000-0000-0000-000000000001',
   'Africa Innovation Accelerator',
   'Pan-African accelerator for early-stage tech startups with $100K equity-free grant',
   'African Development Bank', 'Pan-Africa',
   ARRAY['FinTech','AgriTech','HealthTech','CleanTech'], 20, 16, 100000, 'open',
   ARRAY['$100K grant','Mentorship','Network access','Demo Day','Investor introductions'],
   'Africa-based startup, team of 2+, working product'),

  ('e0000000-0000-0000-0000-000000000002',
   'GovTech Sandbox Kenya',
   'Government-backed programme for civic tech and digital public services',
   'Kenya ICT Authority', 'Kenya',
   ARRAY['GovTech','FinTech','HealthTech'], 15, 12, 50000, 'open',
   ARRAY['$50K grant','Government contracts','Regulatory sandbox','Technical support'],
   'Kenya-registered company, public-sector solution'),

  ('e0000000-0000-0000-0000-000000000003',
   'West Africa FinTech Hub',
   'Regional fintech accelerator focused on financial inclusion',
   'ECOWAS Innovation Fund', 'Nigeria',
   ARRAY['FinTech','InsurTech','WealthTech'], 12, 20, 150000, 'ongoing',
   ARRAY['$150K investment','Banking partnerships','Regulatory guidance','Regional expansion support'],
   'West African fintech, seed stage or beyond')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RELATIONSHIP BLUEPRINTS
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

-- ============================================================
-- GOVERNANCE RULES
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
   'Startups with critical risk level cannot be matched',
   'eligibility',
   '{"field":"startup.risk_level","operator":"==","value":"critical"}',
   '{"type":"block","message":"Startup is flagged as critical risk — relationship blocked"}')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RELATIONSHIPS
-- ============================================================
INSERT INTO relationships (id, relationship_type, startup_id, mentor_id, programme_id,
  investor_id, match_score, confidence_score, engagement_health, status,
  ai_generated, ai_reasoning) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'mentor_startup',
   'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL, NULL,
   94.5, 91.0, 'excellent', 'active', true,
   'Strong alignment: both in fintech payments space, mentor has direct experience scaling similar products in African markets'),

  ('f0000000-0000-0000-0000-000000000002', 'mentor_startup',
   'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', NULL, NULL,
   88.0, 85.5, 'good', 'active', true,
   'Excellent match: mentor is AgriTech pioneer with IoT expertise, directly relevant to FarmSense AI product'),

  ('f0000000-0000-0000-0000-000000000003', 'startup_programme',
   'b0000000-0000-0000-0000-000000000001', NULL, 'e0000000-0000-0000-0000-000000000001', NULL,
   89.0, 87.0, 'good', 'active', true,
   'PayFlow Africa aligns with programme focus on FinTech and financial inclusion across Africa'),

  ('f0000000-0000-0000-0000-000000000004', 'startup_investor',
   'b0000000-0000-0000-0000-000000000004', NULL, NULL, 'd0000000-0000-0000-0000-000000000001',
   92.0, 89.5, 'excellent', 'active', true,
   'MediConnect is in HealthTech at Series A stage, perfectly matching Horizon Africa Fund investment thesis'),

  ('f0000000-0000-0000-0000-000000000005', 'startup_programme',
   'b0000000-0000-0000-0000-000000000003', NULL, 'e0000000-0000-0000-0000-000000000003', NULL,
   95.0, 93.0, 'excellent', 'active', true,
   'CreditBridge is a perfect fit for West Africa FinTech Hub - financial inclusion focus and West African market')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ENGAGEMENT LOGS  (with commitment and latency data for CEI computation)
-- ============================================================
INSERT INTO engagement_logs (relationship_id, activity_type, notes, outcome,
  duration_minutes, response_latency_hours, commitment_fulfilled, created_at) VALUES
  -- rel 001: strong engagement
  ('f0000000-0000-0000-0000-000000000001', 'mentoring_session',
   'Discussed go-to-market strategy for East Africa expansion', 'Action plan created',
   60, 2.5, true, NOW() - INTERVAL '17 days'),
  ('f0000000-0000-0000-0000-000000000001', 'review_meeting',
   'Reviewed Q1 metrics and fundraising deck', 'Deck improved, intro to 3 investors',
   90, 4.0, true, NOW() - INTERVAL '10 days'),
  ('f0000000-0000-0000-0000-000000000001', 'mentoring_session',
   'Pitch practice with mock investor panel', 'Deck polished, ready for seed round',
   45, 1.5, true, NOW() - INTERVAL '3 days'),

  -- rel 002: mediocre — high latency, some missed commitments
  ('f0000000-0000-0000-0000-000000000002', 'mentoring_session',
   'Technical review of IoT sensor architecture', 'Architecture optimized for scale',
   45, 8.0, true, NOW() - INTERVAL '20 days'),
  ('f0000000-0000-0000-0000-000000000002', 'check_in',
   'Scheduled sync - mentor arrived 45 min late', 'Partial notes only',
   30, 22.0, false, NOW() - INTERVAL '12 days'),
  ('f0000000-0000-0000-0000-000000000002', 'check_in',
   'No-show from startup founder', 'No show',
   0, 18.0, false, NOW() - INTERVAL '5 days'),

  -- rel 003: at-risk — poor follow-through
  ('f0000000-0000-0000-0000-000000000003', 'programme_onboarding',
   'Programme kickoff and cohort introduction', 'Onboarded successfully',
   120, 3.0, true, NOW() - INTERVAL '50 days'),
  ('f0000000-0000-0000-0000-000000000003', 'check_in',
   'Catch-up attempt — no response', 'No response',
   0, 48.0, false, NOW() - INTERVAL '11 days'),
  ('f0000000-0000-0000-0000-000000000003', 'check_in',
   'Programme session missed', 'Missed',
   0, 36.0, false, NOW() - INTERVAL '4 days'),

  -- rel 004: excellent — fast responses, all commitments
  ('f0000000-0000-0000-0000-000000000004', 'investor_call',
   'Initial pitch and due diligence discussion', 'Term sheet requested',
   60, 1.0, true, NOW() - INTERVAL '9 days'),
  ('f0000000-0000-0000-0000-000000000004', 'investor_call',
   'Term sheet review and negotiation', 'Signed LOI',
   60, 0.5, true, NOW() - INTERVAL '2 days'),

  -- rel 005: good — consistent, moderate latency
  ('f0000000-0000-0000-0000-000000000005', 'programme_onboarding',
   'Programme kickoff and cohort introduction', 'Onboarded successfully',
   120, 3.0, true, NOW() - INTERVAL '40 days'),
  ('f0000000-0000-0000-0000-000000000005', 'programme_session',
   'Workshop attendance — regulatory compliance module', 'Key learnings documented',
   120, 5.0, true, NOW() - INTERVAL '13 days'),
  ('f0000000-0000-0000-0000-000000000005', 'check_in',
   'Weekly standup — on track with milestones', 'On track',
   30, 4.0, true, NOW() - INTERVAL '6 days');

-- ============================================================
-- RELATIONSHIP MILESTONES
-- ============================================================
INSERT INTO relationship_milestones
  (relationship_id, title, due_week, due_date, status, completed_at) VALUES
  -- rel 001: 2 done on time, 2 upcoming
  ('f0000000-0000-0000-0000-000000000001', 'Define 90-day goals',      1,  NOW() - INTERVAL '60 days', 'completed', NOW() - INTERVAL '63 days'),
  ('f0000000-0000-0000-0000-000000000001', 'First investor intro',      4,  NOW() - INTERVAL '30 days', 'completed', NOW() - INTERVAL '33 days'),
  ('f0000000-0000-0000-0000-000000000001', 'Close pre-seed round',      8,  NOW() + INTERVAL '10 days', 'pending',   NULL),
  ('f0000000-0000-0000-0000-000000000001', 'Launch MVP in market',      12, NOW() + INTERVAL '30 days', 'pending',   NULL),

  -- rel 002: 1 done late, 1 missed, 1 upcoming
  ('f0000000-0000-0000-0000-000000000002', 'Architecture review',       2,  NOW() - INTERVAL '42 days', 'completed', NOW() - INTERVAL '39 days'),
  ('f0000000-0000-0000-0000-000000000002', 'Pilot customer onboard',    6,  NOW() - INTERVAL '15 days', 'missed',    NULL),
  ('f0000000-0000-0000-0000-000000000002', 'Series A readiness',        12, NOW() + INTERVAL '20 days', 'pending',   NULL),

  -- rel 003: 1 done, 1 missed
  ('f0000000-0000-0000-0000-000000000003', 'Programme orientation',     1,  NOW() - INTERVAL '53 days', 'completed', NOW() - INTERVAL '56 days'),
  ('f0000000-0000-0000-0000-000000000003', 'Submit market report',      3,  NOW() - INTERVAL '20 days', 'missed',    NULL),
  ('f0000000-0000-0000-0000-000000000003', 'Demo day preparation',      8,  NOW() + INTERVAL '10 days', 'pending',   NULL),

  -- rel 004: 3 done on time (excellent)
  ('f0000000-0000-0000-0000-000000000004', 'Pitch deck finalised',      1,  NOW() - INTERVAL '58 days', 'completed', NOW() - INTERVAL '61 days'),
  ('f0000000-0000-0000-0000-000000000004', 'Due diligence complete',    3,  NOW() - INTERVAL '38 days', 'completed', NOW() - INTERVAL '41 days'),
  ('f0000000-0000-0000-0000-000000000004', 'Term sheet signed',         6,  NOW() - INTERVAL '8 days',  'completed', NOW() - INTERVAL '11 days'),

  -- rel 005: 2 done, 1 upcoming
  ('f0000000-0000-0000-0000-000000000005', 'Programme kickoff',         1,  NOW() - INTERVAL '43 days', 'completed', NOW() - INTERVAL '46 days'),
  ('f0000000-0000-0000-0000-000000000005', 'Cohort networking event',   4,  NOW() - INTERVAL '15 days', 'completed', NOW() - INTERVAL '18 days'),
  ('f0000000-0000-0000-0000-000000000005', 'Mid-programme review',      6,  NOW() + INTERVAL '5 days',  'pending',   NULL);

-- ============================================================
-- BEHAVIORAL SIGNALS  (pre-computed so page shows data on first boot)
-- ============================================================
INSERT INTO behavioral_signals
  (relationship_id, avg_response_latency_hours, meeting_commitment_ratio,
   milestone_completion_rate, next_action_followthrough_rate,
   engagement_velocity, composite_index, computed_at)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 2.67,  1.000, 1.000, 1.000, 1.000, 87.00, NOW()),
  ('f0000000-0000-0000-0000-000000000002', 16.00, 0.333, 0.500, 0.333, 1.000, 31.00, NOW()),
  ('f0000000-0000-0000-0000-000000000003', 29.00, 0.333, 0.500, 0.333, 0.000, 20.00, NOW()),
  ('f0000000-0000-0000-0000-000000000004', 0.75,  1.000, 1.000, 1.000, 1.000, 92.00, NOW()),
  ('f0000000-0000-0000-0000-000000000005', 4.00,  1.000, 1.000, 1.000, 1.000, 82.00, NOW())
ON CONFLICT (relationship_id) DO UPDATE SET
  avg_response_latency_hours     = EXCLUDED.avg_response_latency_hours,
  meeting_commitment_ratio       = EXCLUDED.meeting_commitment_ratio,
  milestone_completion_rate      = EXCLUDED.milestone_completion_rate,
  next_action_followthrough_rate = EXCLUDED.next_action_followthrough_rate,
  engagement_velocity            = EXCLUDED.engagement_velocity,
  composite_index                = EXCLUDED.composite_index,
  computed_at                    = EXCLUDED.computed_at;

-- ============================================================
-- ANALYTICS SUMMARY
-- ============================================================
INSERT INTO analytics_summary
  (total_startups, total_mentors, total_investors, total_programmes,
   total_relationships, successful_matches, active_programmes,
   avg_verification_score, avg_match_score, ecosystem_health_score)
VALUES (5, 3, 1, 3, 5, 4, 2, 82.0, 91.7, 78.5);
