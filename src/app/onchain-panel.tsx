"use client";
import { useState, useEffect } from "react";

interface OnchainData {
  wallets: Record<string, { address: string; balance: number | null }>;
  updatedAt: string;
}

export default function OnchainPanel() {
  const [data, setData] = useState<OnchainData | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch("/api/onchain").then((r) => r.json()).then((j) => {
      if (j.wallets) setData(j);
      else setErr(true);
    }).catch(() => setErr(true));
  }, []);

  if (err) return <p className="text-xs text-zinc-600">オンチェーン残高を取得できませんでした(表示は固定値)</p>;
  if (!data) return <p className="text-xs text-zinc-600">オンチェーン残高を取得中...</p>;

  const labels: Record<string, string> = { reward: "報酬プール", ops: "運営リザーブ", airdrop: "エアドロップ" };
  return (
    <div className="space-y-1">
      {Object.entries(data.wallets).map(([name, w]) => (
        <div key={name} className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">{labels[name] || name}</span>
          <span className="font-mono">
            {w.balance !== null ? `${w.balance.toLocaleString()} HMC` : "ATA未作成"}
          </span>
        </div>
      ))}
      <p className="pt-1 text-[10px] text-zinc-700">実残高(オンチェーン)・{new Date(data.updatedAt).toLocaleTimeString("ja-JP")} 時点</p>
    </div>
  );
}
