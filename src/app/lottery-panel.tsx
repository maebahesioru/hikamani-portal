"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { GAME } from "@/lib/hmc";

export default function LotteryPanel() {
  const { session, authFetch } = useAuth();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function draw() {
    if (!session) { setMsg({ ok: false, text: "ログインが必要です(上部の「ログイン/登録」から)" }); return; }
    setLoading(true);
    try {
      const r = await authFetch("/api/lottery", { method: "POST" });
      const j = await r.json();
      if (r.ok) {
        setMsg({
          ok: true,
          text: j.won ? `🎉 大当たり! +${j.prize} HMC! (現在 ${j.pending} HMC)` : `はずれ... 現在 ${j.pending} HMC`,
        });
      } else {
        setMsg({ ok: false, text: j.error || "くじを引けませんでした" });
      }
    } catch {
      setMsg({ ok: false, text: "通信エラー" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        {GAME.lotteryCost} HMCで1回抽選。当たると <b className="text-amber-300">+{GAME.lotteryWin} HMC</b>(当選確率{GAME.lotteryWinRate * 100}%)
      </p>
      <button
        onClick={draw}
        disabled={loading}
        className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold hover:bg-amber-500 disabled:opacity-50"
      >
        {loading ? "抽選中..." : `くじを引く(${GAME.lotteryCost} HMC)`}
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}