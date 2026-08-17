"use client";
import { useState } from "react";

export default function PointsPanel() {
  const [address, setAddress] = useState("");
  const [data, setData] = useState<{ pending: number; sent: number } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function check() {
    const addr = address.trim();
    if (!addr) { setMsg({ ok: false, text: "アドレスを入力してください" }); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/state?address=${encodeURIComponent(addr)}`);
      const j = await r.json();
      if (j.wallet) {
        setData(j.wallet);
        setMsg({ ok: true, text: j.wallet.sent > 0 ? "送金済みがあります" : "まだ送金されていません" });
      } else {
        setData(null);
        setMsg({ ok: false, text: "このアドレスのポイントはありません" });
      }
    } catch {
      setMsg({ ok: false, text: "通信エラー" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        ログインボーナス・くじで貯めたHMCポイントの残高を確認できます。
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="ウォレットアドレス"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-sky-500"
        />
        <button
          onClick={check}
          disabled={loading}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold hover:bg-sky-600 disabled:opacity-50"
        >
          {loading ? "確認中..." : "残高を確認"}
        </button>
      </div>
      {data && (
        <div className="rounded-lg bg-zinc-800/60 p-4 text-sm">
          <p>未送金: <b className="text-amber-300">{data.pending} HMC</b></p>
          <p className="mt-1">送金済み: <b className="text-emerald-300">{data.sent} HMC</b></p>
        </div>
      )}
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
