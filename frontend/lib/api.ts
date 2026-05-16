const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
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
    ...(body && { body: JSON.stringify(body) }),
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || "API request failed");
  }

  return data;
}

// Auth
export const authApi = {
  register: (data: { full_name: string; email: string; password: string; role?: string; country?: string }) =>
    apiRequest("/api/auth/register", { method: "POST", body: data }),
  login: (data: { email: string; password: string }) =>
    apiRequest("/api/auth/login", { method: "POST", body: data }),
  me: () => apiRequest("/api/auth/me"),
};

// Startups
export const startupsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/api/startups${query}`);
  },
  getById: (id: string) => apiRequest(`/api/startups/${id}`),
  create: (data: unknown) => apiRequest("/api/startups/create", { method: "POST", body: data }),
  update: (id: string, data: unknown) => apiRequest(`/api/startups/${id}`, { method: "PUT", body: data }),
};

// Mentors
export const mentorsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/api/mentors${query}`);
  },
  getById: (id: string) => apiRequest(`/api/mentors/${id}`),
  create: (data: unknown) => apiRequest("/api/mentors/create", { method: "POST", body: data }),
};

// Programmes
export const programmesApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiRequest(`/api/programmes${query}`);
  },
  getById: (id: string) => apiRequest(`/api/programmes/${id}`),
  create: (data: unknown) => apiRequest("/api/programmes/create", { method: "POST", body: data }),
};

// Investors
export const investorsApi = {
  getAll: () => apiRequest("/api/investors"),
  getById: (id: string) => apiRequest(`/api/investors/${id}`),
};

// Verification
export const verifyApi = {
  verifyStartup: (startup_id: string) =>
    apiRequest("/api/verify/startup", { method: "POST", body: { startup_id } }),
  getHistory: (startup_id: string) => apiRequest(`/api/verify/history/${startup_id}`),
};

// Matching
export const matchApi = {
  matchMentors: (startup_id: string, limit?: number) =>
    apiRequest("/api/match/mentor", { method: "POST", body: { startup_id, limit } }),
  matchProgrammes: (startup_id: string, limit?: number) =>
    apiRequest("/api/match/programme", { method: "POST", body: { startup_id, limit } }),
  getRecommendations: (startup_id: string) =>
    apiRequest(`/api/match/recommendations/${startup_id}`),
};

// Relationships
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

// Dashboard
export const dashboardApi = {
  getOverview: () => apiRequest("/api/dashboard/overview"),
  getAnalytics: () => apiRequest("/api/dashboard/analytics"),
  getInsights: () => apiRequest("/api/dashboard/insights"),
};

// Graph
export const graphApi = {
  getNetwork: () => apiRequest("/api/graph/network"),
};

export default apiRequest;
