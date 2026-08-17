"use client";
import { useState } from "react";
import { GAME } from "@/lib/hmc";

export default function BonusPanel() {
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function claim() {
    const addr = address.trim();
    if (!addr) { setMsg({ ok: false, text: "アドレスを入力してください" }); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      const j = await r.json();
      if (r.ok) {
        setMsg({ ok: true, text: `+${j.amount} HMC 獲得! 現在のポイント: ${j.pending} HMC` });
      } else {
        setMsg({ ok: false, text: j.error || "取得に失敗しました" });
      }
    } catch {
      setMsg({ ok: false, text: "通信エラー" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        毎日1回、ログインボーナスとして <b className="text-emerald-300">{GAME.bonusPerDay} HMC</b> をポイントで獲得できます。
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="ウォレットアドレス"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-500"
        />
        <button
          onClick={claim}
          disabled={loading}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading ? "取得中..." : "受け取る"}
        </button>
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
