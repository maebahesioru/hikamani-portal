"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const KEY = "hmc_session";

interface Session {
  token: string;
  accountNumber: string;
  receiveId: string;
  solanaAddress: string;
  pending: number;
  sent: number;
}

const AuthContext = createContext<{
session: Session | null;
createAccount: (password: string) => Promise<{ error: string | null; accountNumber: string | null }>;
login: (accountNumber: string, password: string) => Promise<string | null>;
logout: () => void;
refresh: () => Promise<void>;
authFetch: (path: string, options?: RequestInit) => Promise<Response>;
}>({
session: null,
createAccount: async () => ({ error: null, accountNumber: null }),
login: async () => null,
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
    const res = await fetch(path, { ...options, headers });
    // 401(セッション無効: トークン失効 or ユーザー消滅)を受けたら、自動でログアウト状態に戻す
    // →「ログイン中なのに『ログインが必要です』」の矛盾を防ぐ
    if (res.status === 401 && session?.token) {
      save(null);
    }
    return res;
  }

  async function login(accountNumber: string, password: string): Promise<string | null> {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountNumber, password }),
    });
    const j = await r.json();
    if (!r.ok) return j.error || "ログイン失敗";
    save({ token: j.token, accountNumber: j.accountNumber, receiveId: j.receiveId || "", solanaAddress: j.solanaAddress, pending: 0, sent: 0 });
    await refresh();
    return null;
  }

  async function createAccount(password: string): Promise<{ error: string | null; accountNumber: string | null }> {
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const j = await r.json();
    if (!r.ok) return { error: j.error || "発行失敗", accountNumber: null };
    save({ token: j.token, accountNumber: j.accountNumber, receiveId: j.receiveId || "", solanaAddress: j.solanaAddress, pending: 0, sent: 0 });
    await refresh();
    return { error: null, accountNumber: j.accountNumber };
  }

  async function refresh() {
    if (!session?.token) return;
    const r = await authFetch("/api/state");
    if (r.ok) {
      const j = await r.json();
      setSession((s) => s ? { ...s, receiveId: j.user?.receiveId ?? s.receiveId, pending: j.wallet?.pending ?? s.pending, sent: j.wallet?.sent ?? s.sent } : s);
    }
  }

  function logout() {
    authFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    save(null);
  }

  return (
    <AuthContext.Provider value={{ session, createAccount, login, logout, refresh, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
