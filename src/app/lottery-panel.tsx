"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { GAME, GAME_LOTTERIES } from "@/lib/hmc";

export default function LotteryPanel() {
  const { session, authFetch, refresh } = useAuth();
  const { t } = useLang();
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
          text: j.won ? `🎉 ${j.name} 当選! +${j.prize.toLocaleString()} HMC! (現在 ${j.pending.toLocaleString()} HMC)` : `${j.name}: ${j.prize.toLocaleString()} HMC... (現在 ${j.pending.toLocaleString()} HMC)`,
        });
        await refresh(); // 残高表示を更新
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
      {/* 当選テーブル */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-left text-zinc-500 dark:text-zinc-400">
              <th className="py-2 pl-3 pr-2 font-medium">賞</th>
              <th className="py-2 px-2 font-medium">賞金</th>
              <th className="py-2 pr-3 font-medium text-right">確率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
            {GAME_LOTTERIES.map((l) => (
              <tr key={l.name}>
                <td className={`py-2 pl-3 pr-2 font-semibold ${l.name === "福島賞" ? "text-amber-400" : ""}`}>{l.name}</td>
                <td className={`py-2 px-2 font-mono ${l.name === "福島賞" ? "text-amber-300" : ""}`}>{l.prize.toLocaleString()} HMC</td>
                <td className="py-2 pr-3 font-mono text-right text-zinc-500 dark:text-zinc-400">{(l.rate * 100).toFixed(4)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={draw}
        disabled={loading}
        className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold hover:bg-amber-500 disabled:opacity-50"
      >
        {loading ? "..." : `くじを引く(${GAME.lotteryCost} HMC)`}
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
