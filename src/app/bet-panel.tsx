"use client";
import { useState, useEffect } from "react";

interface Topic {
  id: string;
  title: string;
  options: string[];
  status: string;
  counts: Record<string, number>;
  totalBets: number;
}

export default function BetPanel() {
  const [address, setAddress] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/bet").then((r) => r.json()).then((j) => setTopics(j.topics || [])).catch(() => {});
  }, []);

  async function vote(topicId: string) {
    const addr = address.trim();
    const option = selected[topicId];
    if (!addr) { setMsg({ ok: false, text: "アドレスを入力してください" }); return; }
    if (!option) { setMsg({ ok: false, text: "選択肢を選んでください" }); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr, topicId, option }),
      });
      const j = await r.json();
      if (r.ok) {
        setMsg({ ok: true, text: `「${option}」に投票しました(50 HMC・残り ${j.pending} HMC)` });
        const j2 = await fetch("/api/bet").then((x) => x.json());
        setTopics(j2.topics || []);
      } else {
        setMsg({ ok: false, text: j.error || "投票に失敗しました" });
      }
    } catch {
      setMsg({ ok: false, text: "通信エラー" });
    }
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        界隈で起こることを予想して <b className="text-sky-300">50 HMC</b> で投票(配当は結果確定時)
      </p>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="ウォレットアドレス"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-sky-500"
      />
      {topics.map((t) => (
        <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{t.title}</p>
            <span className={`text-xs ${t.status === "open" ? "text-emerald-400" : "text-zinc-500"}`}>
              {t.status === "open" ? "受付中" : "締切"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {t.options.map((o) => (
              <button
                key={o}
                onClick={() => setSelected((s) => ({ ...s, [t.id]: o }))}
                className={`rounded-lg px-3 py-1.5 text-sm border ${
                  selected[t.id] === o
                    ? "border-sky-500 bg-sky-900/50 text-sky-300"
                    : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {o}
                <span className="ml-2 text-xs text-zinc-500">{t.counts[o] || 0} HMC</span>
              </button>
            ))}
          </div>
          {t.status === "open" && (
            <button
              onClick={() => vote(t.id)}
              disabled={loading}
              className="mt-3 rounded-lg bg-sky-700 px-4 py-1.5 text-sm font-semibold hover:bg-sky-600 disabled:opacity-50"
            >
              {loading ? "投票中..." : "投票する(50 HMC)"}
            </button>
          )}
          <p className="mt-2 text-xs text-zinc-500">総ベット: {t.totalBets} HMC</p>
        </div>
      ))}
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
