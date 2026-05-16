-- EcosystemOS AI Platform - Seed Data
-- Run after schema.sql

-- ============================================================
-- SEED USERS
-- ============================================================
-- Password for all seed users: "Password123!" (bcrypt hashed)
INSERT INTO users (id, full_name, email, password_hash, role, country) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin User', 'admin@ecosystemos.ai', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'admin', 'Kenya'),
  ('a0000000-0000-0000-0000-000000000002', 'Sarah Kimani', 'sarah@techstartup.co.ke', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'startup', 'Kenya'),
  ('a0000000-0000-0000-0000-000000000003', 'James Okonkwo', 'james@agritech.ng', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'startup', 'Nigeria'),
  ('a0000000-0000-0000-0000-000000000004', 'Amara Diallo', 'amara@fintech.sn', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'startup', 'Senegal'),
  ('a0000000-0000-0000-0000-000000000005', 'Dr. Michael Chen', 'mchen@mentor.com', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'mentor', 'Singapore'),
  ('a0000000-0000-0000-0000-000000000006', 'Priya Sharma', 'priya@mentor.in', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'mentor', 'India'),
  ('a0000000-0000-0000-0000-000000000007', 'David Osei', 'david@mentor.gh', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'mentor', 'Ghana'),
  ('a0000000-0000-0000-0000-000000000008', 'Victoria Fund', 'victoria@vcfund.com', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'investor', 'USA'),
  ('a0000000-0000-0000-0000-000000000009', 'Kwame Mensah', 'kwame@healthtech.gh', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'startup', 'Ghana'),
  ('a0000000-0000-0000-0000-000000000010', 'Fatima Al-Hassan', 'fatima@edtech.eg', '$2b$10$rQZ9uAVn8MqKjZ5Yx3mHOeN1vL2kP4sT6wX8yA0bC3dE5fG7hI9j', 'startup', 'Egypt')
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- SEED STARTUPS
-- ============================================================
INSERT INTO startups (id, user_id, startup_name, description, industry, stage, country, website, team_size, founded_year, problem_statement, solution, traction, funding_raised, verification_score, risk_level, verification_status, tags) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'PayFlow Africa', 'AI-powered cross-border payment infrastructure for African SMEs', 'FinTech', 'seed', 'Kenya', 'https://payflow.africa', 8, 2022, 'High transaction costs and slow cross-border payments in Africa', 'ML-based FX optimization with mobile-first payment rails', '12,000 active users, $2M monthly transaction volume', 500000, 87.5, 'low', 'verified', ARRAY['fintech', 'payments', 'africa', 'ai']),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'FarmSense AI', 'Precision agriculture platform using IoT sensors and AI crop prediction', 'AgriTech', 'pre-seed', 'Nigeria', 'https://farmsense.ng', 4, 2023, 'Smallholder farmers lack data-driven insights for crop management', 'IoT sensor network with AI-powered yield prediction and advisory', '500 farmers onboarded, 23% yield improvement', 150000, 72.0, 'medium', 'verified', ARRAY['agritech', 'iot', 'ai', 'nigeria']),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'CreditBridge', 'Alternative credit scoring for unbanked populations using mobile data', 'FinTech', 'seed', 'Senegal', 'https://creditbridge.sn', 6, 2022, '70% of West Africans lack formal credit history', 'Behavioral data analysis from mobile usage patterns for credit scoring', '8,000 credit assessments, 94% repayment rate', 300000, 81.0, 'low', 'verified', ARRAY['fintech', 'credit', 'inclusion', 'west-africa']),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000009', 'MediConnect', 'Telemedicine platform connecting rural patients with urban specialists', 'HealthTech', 'series-a', 'Ghana', 'https://mediconnect.gh', 15, 2021, 'Rural healthcare access gap in Sub-Saharan Africa', 'Video consultation platform with AI triage and EHR integration', '45,000 consultations, 120 partner hospitals', 1200000, 91.0, 'low', 'verified', ARRAY['healthtech', 'telemedicine', 'africa', 'ai']),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000010', 'LearnPath', 'Adaptive learning platform for K-12 students in MENA region', 'EdTech', 'seed', 'Egypt', 'https://learnpath.eg', 10, 2022, 'One-size-fits-all education fails diverse learners', 'AI-personalized curriculum with gamification and parent dashboards', '25,000 students, 4.7/5 teacher rating', 400000, 78.5, 'low', 'verified', ARRAY['edtech', 'ai', 'mena', 'k12'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED MENTORS
-- ============================================================
INSERT INTO mentors (id, user_id, bio, expertise, industries, years_experience, availability, rating, total_reviews, company, title, location) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'Former CTO at 3 successful fintech startups. Expert in scaling payment systems across Asia and Africa.', ARRAY['fintech', 'payments', 'scaling', 'product-strategy', 'fundraising'], ARRAY['FinTech', 'Banking', 'Payments'], 18, 'available', 4.9, 47, 'PayScale Ventures', 'Managing Partner', 'Singapore'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000006', 'Serial entrepreneur with 2 exits. Deep expertise in B2B SaaS and enterprise sales in emerging markets.', ARRAY['saas', 'enterprise-sales', 'product-market-fit', 'go-to-market', 'fundraising'], ARRAY['SaaS', 'Enterprise', 'B2B'], 14, 'available', 4.7, 32, 'Emerge Capital', 'Venture Partner', 'Mumbai'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000007', 'AgriTech pioneer with 20 years in precision agriculture. Built and sold 2 agri-data companies.', ARRAY['agritech', 'iot', 'data-analytics', 'supply-chain', 'impact-investing'], ARRAY['AgriTech', 'FoodTech', 'CleanTech'], 20, 'limited', 4.8, 28, 'AgroVentures Africa', 'Founder & CEO', 'Accra')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED INVESTORS
-- ============================================================
INSERT INTO investors (id, user_id, firm_name, investment_thesis, focus_industries, investment_stages, ticket_size_min, ticket_size_max, portfolio_size, country) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000008', 'Horizon Africa Fund', 'Backing Africa-focused tech startups solving real problems at scale', ARRAY['FinTech', 'HealthTech', 'AgriTech', 'EdTech'], ARRAY['seed', 'series-a'], 250000, 2000000, 23, 'USA')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED PROGRAMMES
-- ============================================================
INSERT INTO programmes (id, programme_name, description, organizer, country, focus_area, cohort_size, duration_weeks, funding_offered, status, benefits) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'Africa Innovation Accelerator', 'Pan-African accelerator for early-stage tech startups with $100K equity-free grant', 'African Development Bank', 'Pan-Africa', ARRAY['FinTech', 'AgriTech', 'HealthTech', 'CleanTech'], 20, 16, 100000, 'open', ARRAY['$100K grant', 'Mentorship', 'Network access', 'Demo Day', 'Investor introductions']),
  ('e0000000-0000-0000-0000-000000000002', 'GovTech Sandbox Kenya', 'Government-backed programme for civic tech and digital public services', 'Kenya ICT Authority', 'Kenya', ARRAY['GovTech', 'FinTech', 'HealthTech'], 15, 12, 50000, 'open', ARRAY['$50K grant', 'Government contracts', 'Regulatory sandbox', 'Technical support']),
  ('e0000000-0000-0000-0000-000000000003', 'West Africa FinTech Hub', 'Regional fintech accelerator focused on financial inclusion', 'ECOWAS Innovation Fund', 'Nigeria', ARRAY['FinTech', 'InsurTech', 'WealthTech'], 12, 20, 150000, 'ongoing', ARRAY['$150K investment', 'Banking partnerships', 'Regulatory guidance', 'Regional expansion support'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED RELATIONSHIPS
-- ============================================================
INSERT INTO relationships (id, relationship_type, startup_id, mentor_id, programme_id, investor_id, match_score, confidence_score, engagement_health, status, ai_generated, ai_reasoning) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'mentor_startup', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', NULL, NULL, 94.5, 91.0, 'excellent', 'active', true, 'Strong alignment: both in fintech payments space, mentor has direct experience scaling similar products in African markets'),
  ('f0000000-0000-0000-0000-000000000002', 'mentor_startup', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003', NULL, NULL, 88.0, 85.5, 'good', 'active', true, 'Excellent match: mentor is AgriTech pioneer with IoT expertise, directly relevant to FarmSense AI product'),
  ('f0000000-0000-0000-0000-000000000003', 'startup_programme', 'b0000000-0000-0000-0000-000000000001', NULL, 'e0000000-0000-0000-0000-000000000001', NULL, 89.0, 87.0, 'good', 'active', true, 'PayFlow Africa aligns with programme focus on FinTech and financial inclusion across Africa'),
  ('f0000000-0000-0000-0000-000000000004', 'startup_investor', 'b0000000-0000-0000-0000-000000000004', NULL, NULL, 'd0000000-0000-0000-0000-000000000001', 92.0, 89.5, 'excellent', 'active', true, 'MediConnect is in HealthTech at Series A stage, perfectly matching Horizon Africa Fund investment thesis'),
  ('f0000000-0000-0000-0000-000000000005', 'startup_programme', 'b0000000-0000-0000-0000-000000000003', NULL, 'e0000000-0000-0000-0000-000000000003', NULL, 95.0, 93.0, 'excellent', 'active', true, 'CreditBridge is a perfect fit for West Africa FinTech Hub - financial inclusion focus and West African market')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED ENGAGEMENT LOGS
-- ============================================================
INSERT INTO engagement_logs (relationship_id, activity_type, notes, outcome, duration_minutes) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'mentoring_session', 'Discussed go-to-market strategy for East Africa expansion', 'Action plan created', 60),
  ('f0000000-0000-0000-0000-000000000001', 'review_meeting', 'Reviewed Q1 metrics and fundraising deck', 'Deck improved, intro to 3 investors', 90),
  ('f0000000-0000-0000-0000-000000000002', 'mentoring_session', 'Technical review of IoT sensor architecture', 'Architecture optimized for scale', 45),
  ('f0000000-0000-0000-0000-000000000004', 'investor_call', 'Initial pitch and due diligence discussion', 'Term sheet requested', 60),
  ('f0000000-0000-0000-0000-000000000005', 'programme_onboarding', 'Programme kickoff and cohort introduction', 'Onboarded successfully', 120);

-- ============================================================
-- SEED ANALYTICS SUMMARY
-- ============================================================
INSERT INTO analytics_summary (total_startups, total_mentors, total_investors, total_programmes, total_relationships, successful_matches, active_programmes, avg_verification_score, avg_match_score, ecosystem_health_score)
VALUES (5, 3, 1, 3, 5, 4, 2, 82.0, 91.7, 78.5);
