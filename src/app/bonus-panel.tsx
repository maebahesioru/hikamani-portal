"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { GAME } from "@/lib/hmc";

export default function BonusPanel() {
  const { session, authFetch, refresh } = useAuth();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function claim() {
    if (!session) { setMsg({ ok: false, text: "ログインが必要です(上部の「ログイン/登録」から)" }); return; }
    setLoading(true);
    try {
      const r = await authFetch("/api/bonus", { method: "POST" });
      const j = await r.json();
      if (r.ok) {
        setMsg({ ok: true, text: `+${j.amount} HMC 獲得! 現在 ${j.pending} HMC` });
        await refresh(); // 残高表示を更新
      } else {
        setMsg({ ok: false, text: j.error || "受け取りに失敗しました" });
      }
    } catch {
      setMsg({ ok: false, text: "通信エラー" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        毎日1回 <b className="text-emerald-300">+{GAME.bonusPerDay} HMC</b> を獲得
      </p>
      <button
        onClick={claim}
        disabled={loading}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
      >
        {loading ? "受け取り中..." : "今日のボーナスを受け取る"}
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}