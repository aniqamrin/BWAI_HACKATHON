import {
  MOCK_USERS, MOCK_STARTUPS, MOCK_MENTORS, MOCK_INVESTORS,
  MOCK_PROGRAMMES, MOCK_RELATIONSHIPS, MOCK_DASHBOARD,
  MOCK_GRAPH, MOCK_MENTOR_MATCHES, MOCK_PROGRAMME_MATCHES,
  MOCK_VERIFICATION, MOCK_ANALYTICS,
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
      const r = MOCK_RELATIONSHIPS.find(r => r.id === id);
      return ok({ ...r, engagement_logs: [] });
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
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/api/relationships${query}`);
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
};

export default apiRequest;

export const firestoreApi = {
  getActivity: (limit = 20) => apiRequest(`/api/firestore/activity?limit=${limit}`),
  getNotifications: () => apiRequest('/api/firestore/notifications'),
  markRead: (id: string) => apiRequest(`/api/firestore/notifications/${id}/read`, { method: 'PATCH' }),
};
