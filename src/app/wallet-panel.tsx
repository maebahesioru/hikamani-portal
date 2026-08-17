"use client";
import { useState } from "react";

export default function WalletPanel() {
  const [address, setAddress] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function register() {
    const addr = address.trim();
    if (!addr) { setMsg({ ok: false, text: "アドレスを入力してください" }); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      const j = await r.json();
      if (r.ok) {
        setMsg({ ok: true, text: `登録完了! エアドロップ ${j.airdropAmount} HMC の対象になりました` });
      } else {
        setMsg({ ok: false, text: j.error || "登録に失敗しました" });
      }
    } catch {
      setMsg({ ok: false, text: "通信エラー" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        Phantom等のSolanaウォレットのアドレスを貼り付けて登録すると、<b className="text-amber-300">エアドロップの対象</b>になります。
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="例: E89qnpMgQXX7gz8Rp1d5BRRnbw285Xhdpa4nvvEuLdxi"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-amber-500"
        />
        <button
          onClick={register}
          disabled={loading}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold hover:bg-amber-500 disabled:opacity-50"
        >
          {loading ? "登録中..." : "登録する"}
        </button>
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
