"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { setAuth, clearAuth, getToken, getUser } from "@/lib/auth";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getUser();
    const token = getToken();
    if (storedUser && token) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password }) as { data: { user: User; token: string } };
      setAuth(res.data.token, res.data.user);
      setUser(res.data.user);
      return res.data;
    },
    []
  );

  const register = useCallback(
    async (data: { full_name: string; email: string; password: string; role?: string; country?: string }) => {
      const res = await authApi.register(data) as { data: { user: User; token: string } };
      setAuth(res.data.token, res.data.user);
      setUser(res.data.user);
      return res.data;
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push("/");
  }, [router]);

  return { user, loading, login, register, logout, isAuthenticated: !!user };
}
