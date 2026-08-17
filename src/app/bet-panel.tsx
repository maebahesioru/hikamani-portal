"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

interface Topic {
  id: string;
  title: string;
  options: string[];
  status: string;
  winner: string | null;
  counts: Record<string, number>;
  totalBets: number;
}

export default function BetPanel() {
  const { session, authFetch } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/bet").then((r) => r.json()).then((j) => setTopics(j.topics || [])).catch(() => {});
  }, []);

  async function vote(topicId: string) {
    const option = selected[topicId];
    if (!session) { setMsg({ ok: false, text: "ログインが必要です(上部の「ログイン/登録」から)" }); return; }
    if (!option) { setMsg({ ok: false, text: "選択肢を選んでください" }); return; }
    setLoading(true);
    try {
      const r = await authFetch("/api/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, option }),
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
      {topics.map((t) => (
        <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{t.title}</p>
            <span className={`text-xs ${t.status === "open" ? "text-emerald-400" : "text-zinc-500"}`}>
              {t.status === "open" ? "受付中" : `確定: ${t.winner}`}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {t.options.map((o) => (
              <button
                key={o}
                onClick={() => setSelected((s) => ({ ...s, [t.id]: o }))}
                disabled={t.status !== "open"}
                className={`rounded-lg px-3 py-1.5 text-sm border ${
                  selected[t.id] === o
                    ? "border-sky-500 bg-sky-900/50 text-sky-300"
                    : "border-zinc-700 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40"
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