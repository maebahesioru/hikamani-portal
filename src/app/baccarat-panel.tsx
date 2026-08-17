"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

const MIN_BET = 50;

export default function BaccaratPanel() {
  const { session, authFetch } = useAuth();
  const [bet, setBet] = useState<"player" | "banker" | "tie">("player");
  const [amount, setAmount] = useState(MIN_BET);
  const [result, setResult] = useState<{ win: boolean; result: string; payout: number; pending: number } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function play() {
    if (!session) { setMsg({ ok: false, text: "ログインが必要です(上部の「ログイン/登録」から)" }); return; }
    setLoading(true);
    setResult(null);
    try {
      const r = await authFetch("/api/baccarat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bet, amount }),
      });
      const j = await r.json();
      if (r.ok) {
        setResult({ win: j.win, result: j.result, payout: j.payout, pending: j.pending });
        setMsg({ ok: true, text: j.win ? `🎉 当たり! +${j.payout} HMC` : `残念... 残り ${j.pending} HMC` });
      } else {
        setMsg({ ok: false, text: j.error || "プレイに失敗しました" });
      }
    } catch {
      setMsg({ ok: false, text: "通信エラー" });
    }
    setLoading(false);
  }

  const labels: Record<string, string> = { player: "プレイヤー(2倍)", banker: "バンカー(1.95倍)", tie: "タイ(9倍)" };

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        バカラ(簡易版)。<b className="text-fuchsia-300">{MIN_BET} HMC</b> からベット。換金なしのゲーム内ポイント
      </p>
      <div className="flex flex-wrap gap-2">
        {(["player", "banker", "tie"] as const).map((b) => (
          <button
            key={b}
            onClick={() => setBet(b)}
            className={`rounded-lg px-3 py-1.5 text-sm border ${
              bet === b ? "border-fuchsia-500 bg-fuchsia-900/50 text-fuchsia-300" : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            {labels[b]}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-zinc-400">ベット額:</span>
        <input
          type="number"
          min={MIN_BET}
          step={10}
          value={amount}
          onChange={(e) => setAmount(Math.max(MIN_BET, Math.floor(Number(e.target.value) || MIN_BET)))}
          className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-fuchsia-500"
        />
        <span className="text-sm text-zinc-500">HMC</span>
      </div>
      <button
        onClick={play}
        disabled={loading}
        className="rounded-lg bg-fuchsia-700 px-4 py-2 text-sm font-semibold hover:bg-fuchsia-600 disabled:opacity-50"
      >
        {loading ? "プレイ中..." : "ベットする"}
      </button>
      {result && (
        <div className="rounded-lg bg-zinc-800/60 p-3 text-sm">
          <p className={result.win ? "text-amber-300 font-bold" : "text-zinc-500"}>
            結果: {labels[result.result]} {result.win ? `→ +${result.payout} HMC 🎉` : "→ はずれ"}
          </p>
          <p className="mt-1 text-zinc-400">現在のポイント: {result.pending} HMC</p>
        </div>
      )}
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}