export const APP_NAME = "EcosystemOS AI";
export const APP_DESCRIPTION = "Intelligent Ecosystem Relationship Orchestration Platform";
export const APP_VERSION = "1.0.0";

export const INDUSTRIES = [
  "FinTech", "AgriTech", "HealthTech", "EdTech", "CleanTech",
  "LogTech", "GovTech", "E-Commerce", "SaaS", "AI/ML",
  "InsurTech", "PropTech", "LegalTech", "HRTech", "Other"
] as const;

export const STAGES = [
  { value: "idea", label: "Idea" },
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "growth", label: "Growth" },
  { value: "mature", label: "Mature" },
] as const;

export const ROLES = [
  { value: "startup", label: "Startup Founder" },
  { value: "mentor", label: "Mentor" },
  { value: "investor", label: "Investor" },
  { value: "user", label: "Observer" },
] as const;

export const RELATIONSHIP_TYPES = [
  { value: "mentor_startup", label: "Mentorship" },
  { value: "startup_programme", label: "Programme Participation" },
  { value: "startup_investor", label: "Investment" },
  { value: "mentor_programme", label: "Mentor-Programme" },
  { value: "investor_programme", label: "Investor-Programme" },
  { value: "partner_startup", label: "Partnership" },
] as const;

export const HEALTH_STATUSES = [
  { value: "excellent", label: "Excellent", color: "text-green-400" },
  { value: "good", label: "Good", color: "text-blue-400" },
  { value: "fair", label: "Fair", color: "text-yellow-400" },
  { value: "poor", label: "Poor", color: "text-orange-400" },
  { value: "inactive", label: "Inactive", color: "text-red-400" },
] as const;

export const AFRICAN_COUNTRIES = [
  "Kenya", "Nigeria", "Ghana", "South Africa", "Egypt", "Ethiopia",
  "Tanzania", "Uganda", "Rwanda", "Senegal", "Côte d'Ivoire", "Morocco",
  "Tunisia", "Cameroon", "Zimbabwe", "Zambia", "Mozambique", "Angola",
  "Other"
] as const;

export const GRAPH_NODE_COLORS = {
  startup: { bg: "rgba(124,58,237,0.15)", border: "rgba(124,58,237,0.5)", text: "#a78bfa" },
  mentor: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.5)", text: "#34d399" },
  programme: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.5)", text: "#fbbf24" },
  investor: { bg: "rgba(236,72,153,0.15)", border: "rgba(236,72,153,0.5)", text: "#f472b6" },
} as const;

export const CHART_COLORS = [
  "#7C3AED", "#2563EB", "#10B981", "#F59E0B", "#EC4899", "#06B6D4", "#EF4444"
] as const;
