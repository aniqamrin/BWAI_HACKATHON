import {
  MOCK_USERS, MOCK_STARTUPS, MOCK_MENTORS, MOCK_INVESTORS,
  MOCK_PROGRAMMES, MOCK_RELATIONSHIPS, MOCK_DASHBOARD,
  MOCK_GRAPH, MOCK_MENTOR_MATCHES, MOCK_PROGRAMME_MATCHES,
  MOCK_VERIFICATION, MOCK_ANALYTICS,
  MOCK_BLUEPRINTS, MOCK_GOVERNANCE_RULES, MOCK_COHORTS,
  MOCK_OUTCOMES, MOCK_OUTCOME_INSIGHTS, MOCK_LIFECYCLE_EVENTS,
  MOCK_LIFECYCLE_SUMMARY, MOCK_GRAPH_DIAGNOSTICS,
} from "./mockData";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ─── Demo mode: set to true to always use mock data ───────────────────────────
// Auto-detected: if API_URL is unreachable, falls back to mock automatically
const FORCE_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

// Wrap response in standard shape
const ok = (data: unknown, message = "Success") => ({ success: true, message, data });

// ─── Mock API handlers ────────────────────────────────────────────────────────
function mockHandler(endpoint: string, options: ApiOptions = {}): unknown {
  const { method = "GET", body } = options;
  const b = body as Record<string, unknown>;

  // AUTH
  if (endpoint === "/api/auth/login" && method === "POST") {
    const email = b?.email as string;
    const password = b?.password as string;
    const user = MOCK_USERS[email as keyof typeof MOCK_USERS];
    if (!user || password !== "Password123!") {
      throw new Error("Invalid credentials");
    }
    return ok({ user, token: "mock_jwt_token_" + user.role });
  }

  if (endpoint === "/api/auth/register" && method === "POST") {
    const newUser = {
      id: "new-" + Date.now(),
      full_name: b?.full_name as string,
      email: b?.email as string,
      role: (b?.role as string) || "startup",
      country: b?.country as string,
      created_at: new Date().toISOString(),
    };
    return ok({ user: newUser, token: "mock_jwt_token_" + newUser.role });
  }

  if (endpoint === "/api/auth/me") {
    const token = typeof window !== "undefined" ? localStorage.getItem("ecosystemos_token") : null;
    const role = token?.split("_").pop() || "admin";
    const user = Object.values(MOCK_USERS).find(u => u.role === role) || MOCK_USERS["admin@ecosystemos.ai"];
    return ok(user);
  }

  // STARTUPS
  if (endpoint.startsWith("/api/startups") && method === "GET") {
    if (endpoint === "/api/startups") return ok({ startups: MOCK_STARTUPS, total: MOCK_STARTUPS.length });
    const id = endpoint.split("/")[3];
    const s = MOCK_STARTUPS.find(s => s.id === id);
    if (!s) throw new Error("Startup not found");
    return ok(s);
  }
  if (endpoint === "/api/startups/create" && method === "POST") {
    const newStartup = { id: "new-" + Date.now(), ...b, verification_score: 0, risk_level: "unknown", verification_status: "pending", created_at: new Date().toISOString() };
    return ok(newStartup, "Startup registered successfully");
  }

  // MENTORS
  if (endpoint.startsWith("/api/mentors") && method === "GET") {
    if (endpoint === "/api/mentors") return ok({ mentors: MOCK_MENTORS, total: MOCK_MENTORS.length });
    const id = endpoint.split("/")[3];
    const m = MOCK_MENTORS.find(m => m.id === id);
    if (!m) throw new Error("Mentor not found");
    return ok(m);
  }

  // INVESTORS
  if (endpoint.startsWith("/api/investors") && method === "GET") {
    if (endpoint === "/api/investors") return ok({ investors: MOCK_INVESTORS });
    const id = endpoint.split("/")[3];
    return ok(MOCK_INVESTORS.find(i => i.id === id));
  }

  // PROGRAMMES
  if (endpoint.startsWith("/api/programmes") && method === "GET") {
    if (endpoint === "/api/programmes") return ok({ programmes: MOCK_PROGRAMMES, total: MOCK_PROGRAMMES.length });
    const id = endpoint.split("/")[3];
    return ok(MOCK_PROGRAMMES.find(p => p.id === id));
  }

  // VERIFY
  if (endpoint === "/api/verify/startup" && method === "POST") {
    return ok({ ...MOCK_VERIFICATION, startup_id: b?.startup_id, startup_name: "Your Startup" });
  }
  if (endpoint.startsWith("/api/verify/history")) {
    return ok({ history: [] });
  }

  // MATCH
  if (endpoint === "/api/match/mentor" && method === "POST") {
    return ok({ matches: MOCK_MENTOR_MATCHES, total: MOCK_MENTOR_MATCHES.length });
  }
  if (endpoint === "/api/match/programme" && method === "POST") {
    return ok({ matches: MOCK_PROGRAMME_MATCHES, total: MOCK_PROGRAMME_MATCHES.length });
  }
  if (endpoint.startsWith("/api/match/recommendations")) {
    return ok({ mentor_recommendations: MOCK_MENTOR_MATCHES.slice(0, 3), programme_recommendations: MOCK_PROGRAMME_MATCHES.slice(0, 3) });
  }

  // RELATIONSHIPS
  if (endpoint.startsWith("/api/relationships") && method === "GET") {
    if (endpoint === "/api/relationships" || endpoint.startsWith("/api/relationships?")) {
      return ok({ relationships: MOCK_RELATIONSHIPS, total: MOCK_RELATIONSHIPS.length });
    }
    const parts = endpoint.split("/");
    const id = parts[3];
    if (parts[4] === undefined) {
      const r = MOCK_RELATIONSHIPS.find(r => r.id === id) || MOCK_RELATIONSHIPS[0];
      const mockMilestones = [
        { id: "ms-1", title: "Initial Check-in & Goal Setting", due_at: "2024-03-01T00:00:00Z", status: "completed", completed_at: "2024-03-02T00:00:00Z", notes: "Strong start — clear goals set for Q1. Both parties aligned on priorities." },
        { id: "ms-2", title: "Mid-Point Review", due_at: "2024-04-15T00:00:00Z", status: "completed", completed_at: "2024-04-14T00:00:00Z", notes: "On track. 2 of 3 goals achieved. Product pivot discussed and approved." },
        { id: "ms-3", title: "Final Milestone & Graduation", due_at: "2024-06-01T00:00:00Z", status: "pending", completed_at: null, notes: null },
      ];
      const mockSignals = {
        avg_response_latency_hours: 4.2,
        meeting_commitment_ratio: 0.87,
        milestone_completion_rate: 0.67,
        next_action_followthrough_rate: 0.75,
        engagement_velocity: 1.2,
        composite_index: 78,
        computed_at: new Date(Date.now() - 3600000).toISOString(),
      };
      return ok({ ...r, engagement_logs: [], milestones: mockMilestones, behavioral_signals: mockSignals, lifecycle_events: MOCK_LIFECYCLE_EVENTS.slice(0, 4) });
    }
  }
  if (endpoint === "/api/relationships/create" && method === "POST") {
    return ok({ id: "new-" + Date.now(), ...b, match_score: 0, confidence_score: 0, engagement_health: "new", status: "active", ai_generated: false, created_at: new Date().toISOString() }, "Relationship created");
  }
  if (endpoint.endsWith("/health") && method === "POST") {
    return ok({ engagement_health: "good", health_score: 75, risk_of_inactivity: "low", recommended_next_actions: ["Schedule monthly check-in", "Review milestone progress"], intervention_suggestions: [], ai_summary: "Relationship is progressing well with consistent engagement." });
  }
  if (endpoint.endsWith("/log") && method === "POST") {
    return ok({ id: "log-" + Date.now(), ...b, created_at: new Date().toISOString() }, "Engagement logged");
  }
  if (endpoint.endsWith("/status") && method === "PATCH") {
    return ok({ status: b?.status }, "Status updated");
  }

  // DASHBOARD
  if (endpoint === "/api/dashboard/overview") return ok(MOCK_DASHBOARD);
  if (endpoint === "/api/dashboard/analytics") return ok(MOCK_ANALYTICS);
  if (endpoint === "/api/dashboard/insights") return ok(MOCK_DASHBOARD);

  // GRAPH
  if (endpoint === "/api/graph/network") return ok(MOCK_GRAPH);
  if (endpoint === "/api/graph/diagnostics") return ok(MOCK_GRAPH_DIAGNOSTICS);

  // BLUEPRINTS
  if (endpoint.startsWith("/api/blueprints") && method === "GET") {
    if (endpoint === "/api/blueprints") return ok({ blueprints: MOCK_BLUEPRINTS, total: MOCK_BLUEPRINTS.length });
    const id = endpoint.split("/")[3];
    return ok({ ...MOCK_BLUEPRINTS.find(b => b.id === id) || MOCK_BLUEPRINTS[0], relationships: [] });
  }
  if (endpoint === "/api/blueprints/create" && method === "POST") {
    return ok({ id: "bp-" + Date.now(), ...b, usage_count: 0, created_at: new Date().toISOString() }, "Blueprint created");
  }
  if (endpoint.includes("/api/blueprints/") && method === "PUT") {
    return ok({ ...b, updated_at: new Date().toISOString() }, "Blueprint updated");
  }

  // GOVERNANCE
  if (endpoint === "/api/governance/rules" && method === "GET") return ok({ rules: MOCK_GOVERNANCE_RULES, total: MOCK_GOVERNANCE_RULES.length });
  if (endpoint === "/api/governance/rules/create" && method === "POST") return ok({ id: "gr-" + Date.now(), ...b, violation_count: 0, is_active: true }, "Rule created");
  if (endpoint === "/api/governance/validate" && method === "POST") return ok({ violations: [], warnings: [], passed: true }, "Validation passed");
  if (endpoint === "/api/governance/violations") return ok({ violations: MOCK_LIFECYCLE_EVENTS.filter((e: any) => e.event_type === "governance_violation") });

  // COHORTS
  if (endpoint.startsWith("/api/cohorts") && method === "GET") {
    if (endpoint === "/api/cohorts") return ok({ cohorts: MOCK_COHORTS, total: MOCK_COHORTS.length });
    const parts = endpoint.split("/");
    const id = parts[3];
    if (parts[4] === "matrix") return ok({ match_matrix: MOCK_COHORTS[0].match_matrix, status: "matching" });
    return ok({ ...MOCK_COHORTS.find(c => c.id === id) || MOCK_COHORTS[0], startups: [], mentors: [], relationships: [] });
  }
  if (endpoint === "/api/cohorts/create" && method === "POST") return ok({ id: "cohort-" + Date.now(), ...b, status: "draft", match_matrix: {}, created_at: new Date().toISOString() }, "Cohort created");
  if (endpoint.endsWith("/run-matching") && method === "POST") return ok(MOCK_COHORTS[0].match_matrix, "Matching completed");
  if (endpoint.endsWith("/approve") && method === "POST") return ok({ created_count: 3, relationships: [] }, "3 relationships created");
  if (endpoint.endsWith("/update-members") && method === "PATCH") return ok({ ...b }, "Members updated");

  // OUTCOMES
  if (endpoint === "/api/outcomes" && method === "GET") return ok({ outcomes: MOCK_OUTCOMES, total: MOCK_OUTCOMES.length });
  if (endpoint === "/api/outcomes/insights") return ok(MOCK_OUTCOME_INSIGHTS);
  if (endpoint === "/api/outcomes/capture" && method === "POST") return ok({ id: "out-" + Date.now(), ...b, captured_at: new Date().toISOString() }, "Outcome captured");
  if (endpoint.startsWith("/api/outcomes/")) return ok(MOCK_OUTCOMES[0] || null);

  // LIFECYCLE
  if (endpoint === "/api/lifecycle/summary") return ok(MOCK_LIFECYCLE_SUMMARY);
  if (endpoint === "/api/lifecycle/status") return ok({ enabled: true, running: false, last_run: new Date(Date.now() - 3600000).toISOString(), last_stats: { nudges: 2, escalations: 1, health_checks: 5 }, next_run: "Every 6 hours" });
  if (endpoint === "/api/lifecycle/run" && method === "POST") return ok({ nudges: 2, escalations: 0, auto_completed: 1, health_checks: 8, errors: 0 }, "Lifecycle scan completed");

  // Relationships extended
  if (endpoint.endsWith("/timeline") && method === "GET") return ok({ timeline: MOCK_LIFECYCLE_EVENTS });
  if (endpoint.includes("/milestone/") && endpoint.endsWith("/complete") && method === "POST") return ok({ status: "completed", completed_at: new Date().toISOString() }, "Milestone completed");

  // Default
  return ok({});
}

// ─── Real API request with mock fallback ─────────────────────────────────────
async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  // Always use mock in demo mode
  if (FORCE_DEMO) {
    return mockHandler(endpoint, options) as T;
  }

  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (typeof window !== "undefined") {
    const storedToken = localStorage.getItem("ecosystemos_token");
    if (storedToken) {
      headers["Authorization"] = `Bearer ${storedToken}`;
    }
  }

  const config: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(5000), // 5s timeout
    ...(body && { body: JSON.stringify(body) }),
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "API request failed");
    }

    return data;
  } catch (err) {
    // Network error or timeout → fall back to mock data
    if (
      err instanceof TypeError ||
      (err instanceof Error && (err.name === "AbortError" || err.message.includes("fetch") || err.message.includes("network") || err.message.includes("Failed to fetch")))
    ) {
      console.warn(`[EcosystemOS] Backend unreachable, using demo data for: ${endpoint}`);
      return mockHandler(endpoint, options) as T;
    }
    throw err;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { full_name: string; email: string; password: string; role?: string; country?: string }) =>
    apiRequest("/api/auth/register", { method: "POST", body: data }),
  login: (data: { email: string; password: string }) =>
    apiRequest("/api/auth/login", { method: "POST", body: data }),
  me: () => apiRequest("/api/auth/me"),
};

// ─── Startups ─────────────────────────────────────────────────────────────────
export const startupsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/api/startups${query}`);
  },
  getById: (id: string) => apiRequest(`/api/startups/${id}`),
  create: (data: unknown) => apiRequest("/api/startups/create", { method: "POST", body: data }),
  update: (id: string, data: unknown) => apiRequest(`/api/startups/${id}`, { method: "PUT", body: data }),
};

// ─── Mentors ──────────────────────────────────────────────────────────────────
export const mentorsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/api/mentors${query}`);
  },
  getById: (id: string) => apiRequest(`/api/mentors/${id}`),
  create: (data: unknown) => apiRequest("/api/mentors/create", { method: "POST", body: data }),
};

// ─── Programmes ───────────────────────────────────────────────────────────────
export const programmesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/api/programmes${query}`);
  },
  getById: (id: string) => apiRequest(`/api/programmes/${id}`),
  create: (data: unknown) => apiRequest("/api/programmes/create", { method: "POST", body: data }),
};

// ─── Investors ────────────────────────────────────────────────────────────────
export const investorsApi = {
  getAll: () => apiRequest("/api/investors"),
  getById: (id: string) => apiRequest(`/api/investors/${id}`),
};

// ─── Verification ─────────────────────────────────────────────────────────────
export const verifyApi = {
  verifyStartup: (startup_id: string) =>
    apiRequest("/api/verify/startup", { method: "POST", body: { startup_id } }),
  getHistory: (startup_id: string) => apiRequest(`/api/verify/history/${startup_id}`),
};

// ─── Matching ─────────────────────────────────────────────────────────────────
export const matchApi = {
  matchMentors: (startup_id: string, limit?: number) =>
    apiRequest("/api/match/mentor", { method: "POST", body: { startup_id, limit } }),
  matchProgrammes: (startup_id: string, limit?: number) =>
    apiRequest("/api/match/programme", { method: "POST", body: { startup_id, limit } }),
  getRecommendations: (startup_id: string) =>
    apiRequest(`/api/match/recommendations/${startup_id}`),
};

// ─── Relationships ────────────────────────────────────────────────────────────
export const relationshipsApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/api/relationships${qs}`);
  },
  getById: (id: string) => apiRequest(`/api/relationships/${id}`),
  create: (data: unknown) =>
    apiRequest("/api/relationships/create", { method: "POST", body: data }),
  analyzeHealth: (id: string) =>
    apiRequest(`/api/relationships/${id}/health`, { method: "POST" }),
  logEngagement: (id: string, data: unknown) =>
    apiRequest(`/api/relationships/${id}/log`, { method: "POST", body: data }),
  updateStatus: (id: string, status: string) =>
    apiRequest(`/api/relationships/${id}/status`, { method: "PATCH", body: { status } }),
  getTimeline: (id: string) => apiRequest(`/api/relationships/${id}/timeline`),
  completeMilestone: (relId: string, milestoneId: string, notes?: string) =>
    apiRequest(`/api/relationships/${relId}/milestone/${milestoneId}/complete`, { method: "POST", body: { notes } }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getOverview: () => apiRequest("/api/dashboard/overview"),
  getAnalytics: () => apiRequest("/api/dashboard/analytics"),
  getInsights: () => apiRequest("/api/dashboard/insights"),
};

// ─── Graph ────────────────────────────────────────────────────────────────────
export const graphApi = {
  getNetwork: () => apiRequest("/api/graph/network"),
  getDiagnostics: () => apiRequest("/api/graph/diagnostics"),
};

// ─── Blueprints ───────────────────────────────────────────────────────────────
export const blueprintsApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/api/blueprints${qs}`);
  },
  getById: (id: string) => apiRequest(`/api/blueprints/${id}`),
  create: (data: unknown) => apiRequest("/api/blueprints/create", { method: "POST", body: data }),
  update: (id: string, data: unknown) => apiRequest(`/api/blueprints/${id}`, { method: "PUT", body: data }),
  delete: (id: string) => apiRequest(`/api/blueprints/${id}`, { method: "DELETE" }),
};

// ─── Governance ───────────────────────────────────────────────────────────────
export const governanceApi = {
  getRules: () => apiRequest("/api/governance/rules"),
  createRule: (data: unknown) => apiRequest("/api/governance/rules/create", { method: "POST", body: data }),
  updateRule: (id: string, data: unknown) => apiRequest(`/api/governance/rules/${id}`, { method: "PUT", body: data }),
  validate: (data: unknown) => apiRequest("/api/governance/validate", { method: "POST", body: data }),
  getViolations: () => apiRequest("/api/governance/violations"),
};

// ─── Cohorts ──────────────────────────────────────────────────────────────────
export const cohortsApi = {
  getAll: () => apiRequest("/api/cohorts"),
  getById: (id: string) => apiRequest(`/api/cohorts/${id}`),
  create: (data: unknown) => apiRequest("/api/cohorts/create", { method: "POST", body: data }),
  runMatching: (id: string) => apiRequest(`/api/cohorts/${id}/run-matching`, { method: "POST" }),
  approve: (id: string) => apiRequest(`/api/cohorts/${id}/approve`, { method: "POST" }),
  getMatrix: (id: string) => apiRequest(`/api/cohorts/${id}/matrix`),
  updateMembers: (id: string, data: unknown) => apiRequest(`/api/cohorts/${id}/update-members`, { method: "PATCH", body: data }),
};

// ─── Outcomes ─────────────────────────────────────────────────────────────────
export const outcomesApi = {
  getAll: () => apiRequest("/api/outcomes"),
  getByRelationship: (relationshipId: string) => apiRequest(`/api/outcomes/${relationshipId}`),
  capture: (data: unknown) => apiRequest("/api/outcomes/capture", { method: "POST", body: data }),
  getInsights: () => apiRequest("/api/outcomes/insights"),
};

// ─── Lifecycle ────────────────────────────────────────────────────────────────
export const lifecycleApi = {
  getSummary: () => apiRequest("/api/lifecycle/summary"),
  getStatus: () => apiRequest("/api/lifecycle/status"),
  run: () => apiRequest("/api/lifecycle/run", { method: "POST" }),
};

export default apiRequest;

export const firestoreApi = {
  getActivity: (limit = 20) => apiRequest(`/api/firestore/activity?limit=${limit}`),
  getNotifications: () => apiRequest('/api/firestore/notifications'),
  markRead: (id: string) => apiRequest(`/api/firestore/notifications/${id}/read`, { method: 'PATCH' }),
};
