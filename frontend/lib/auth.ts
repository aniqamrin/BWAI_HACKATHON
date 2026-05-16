"use client";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  country?: string;
  avatar_url?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("ecosystemos_token");
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("ecosystemos_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem("ecosystemos_token", token);
  localStorage.setItem("ecosystemos_user", JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem("ecosystemos_token");
  localStorage.removeItem("ecosystemos_user");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === "admin";
}
