"use client";
import { useState } from "react";
import { GAME } from "@/lib/hmc";

export default function LotteryPanel() {
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [result, setResult] = useState<"win" | "lose" | null>(null);
  const [loading, setLoading] = useState(false);

  async function draw() {
    const addr = address.trim();
    if (!addr) { setMsg({ ok: false, text: "アドレスを入力してください" }); return; }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/lottery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      const j = await r.json();
      if (r.ok) {
        setResult(j.win ? "win" : "lose");
        setMsg({ ok: true, text: j.win ? `🎉 当選! +${j.prize} HMC! 現在: ${j.pending} HMC` : `残念... 現在: ${j.pending} HMC` });
      } else {
        setMsg({ ok: false, text: j.error || "抽選に失敗しました" });
      }
    } catch {
      setMsg({ ok: false, text: "通信エラー" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        <b className="text-amber-300">{GAME.lotteryCost} HMC</b> 消費で抽選。当たると{" "}
        <b className="text-amber-300">{GAME.lotteryWin} HMC</b>(当選確率{GAME.lotteryWinRate * 100}%)
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="ウォレットアドレス"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-amber-500"
        />
        <button
          onClick={draw}
          disabled={loading}
          className="rounded-lg bg-fuchsia-700 px-4 py-2 text-sm font-semibold hover:bg-fuchsia-600 disabled:opacity-50"
        >
          {loading ? "抽選中..." : "くじを引く"}
        </button>
      </div>
      {result && (
        <div className={`text-2xl font-bold ${result === "win" ? "text-amber-300" : "text-zinc-500"}`}>
          {result === "win" ? "🎉 当たり!!" : "😢 はずれ"}
        </div>
      )}
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
