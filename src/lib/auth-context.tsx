"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const KEY = "hmc_session";

interface Session {
  token: string;
  username: string;
  solanaAddress: string;
  pending: number;
  sent: number;
}

const AuthContext = createContext<{
  session: Session | null;
  login: (username: string, password: string) => Promise<string | null>;
  register: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  refresh: () => Promise<void>;
  authFetch: (path: string, options?: RequestInit) => Promise<Response>;
}>({
  session: null,
  login: async () => null,
  register: async () => null,
  logout: () => {},
  refresh: async () => {},
  authFetch: async () => new Response(),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try { setSession(JSON.parse(saved)); } catch { localStorage.removeItem(KEY); }
    }
  }, []);

  function save(s: Session | null) {
    setSession(s);
    if (s) localStorage.setItem(KEY, JSON.stringify(s));
    else localStorage.removeItem(KEY);
  }

  async function authFetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (session?.token) headers.set("authorization", `Bearer ${session.token}`);
    return fetch(path, { ...options, headers });
  }

  async function login(username: string, password: string): Promise<string | null> {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const j = await r.json();
    if (!r.ok) return j.error || "ログイン失敗";
    save({ token: j.token, username: j.username, solanaAddress: j.solanaAddress, pending: 0, sent: 0 });
    await refresh();
    return null;
  }

  async function register(username: string, password: string): Promise<string | null> {
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const j = await r.json();
    if (!r.ok) return j.error || "登録失敗";
    save({ token: j.token, username: j.username, solanaAddress: j.solanaAddress, pending: 0, sent: 0 });
    await refresh();
    return null;
  }

  async function refresh() {
    if (!session?.token) return;
    const r = await authFetch("/api/state");
    if (r.ok) {
      const j = await r.json();
      setSession((s) => s ? { ...s, pending: j.wallet?.pending ?? s.pending, sent: j.wallet?.sent ?? s.sent } : s);
    }
  }

  function logout() {
    authFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    save(null);
  }

  return (
    <AuthContext.Provider value={{ session, login, register, logout, refresh, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
