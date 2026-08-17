"use client";
import { useState } from "react";

interface AdminState {
  stats: { users: number; airdropTotal: number; bonuses: number; lotteries: number; bets: number; baccarats: number; totalPending: number; totalSent: number };
  users: Record<string, any>;
  points: Record<string, any>;
  topics: any[];
  lastBonuses: any[];
  lastLotteries: any[];
  lastBets: any[];
}

export default function AdminPanel() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState<AdminState | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newOptions, setNewOptions] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/state", { headers: { "x-admin-key": key } });
    if (r.status === 401) { setMsg({ ok: false, text: "パスワードが違います" }); return; }
    const j = await r.json();
    setData(j);
    setAuthed(true);
    setMsg(null);
  }

  async function addTopic() {
    const options = newOptions.split(/[,、\n]/).map((o) => o.trim()).filter(Boolean);
    setLoading(true);
    const r = await fetch("/api/admin/topic", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ title: newTitle, options }),
    });
    const j = await r.json();
    setMsg(r.ok ? { ok: true, text: `テーマ「${j.topic?.title}」を追加しました` } : { ok: false, text: j.error || "失敗" });
    if (r.ok) { setNewTitle(""); setNewOptions(""); load(); }
    setLoading(false);
  }

  async function resolve(topicId: string, winner: string) {
    if (!confirm(`「${winner}」で結果確定します。よろしいですか?`)) return;
    setLoading(true);
    const r = await fetch("/api/admin/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ topicId, winner }),
    });
    const j = await r.json();
    setMsg(r.ok
      ? { ok: true, text: `確定完了: 的中${j.winners}人・配当合計${j.totalPayout} HMC` }
      : { ok: false, text: j.error || "失敗" });
    if (r.ok) load();
    setLoading(false);
  }

  if (!authed) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">管理パスワードを入力してください</p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="管理パスワード"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-emerald-500"
        />
        <button onClick={load} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600">
          ログイン
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>}

      {/* 統計 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["登録ユーザー", data?.stats.users],
          ["エアドロ対象", data?.stats.airdropTotal.toLocaleString() + " HMC"],
          ["未送金ポイント", data?.stats.totalPending.toLocaleString() + " HMC"],
          ["送金済み", data?.stats.totalSent.toLocaleString() + " HMC"],
        ].map(([label, val]) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-1 text-lg font-bold">{val}</p>
          </div>
        ))}
      </div>

      {/* テーマ追加 */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="mb-2 font-semibold">📝 投票テーマ追加</p>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="テーマ名(例: 次のヒカマー大賞は誰?)"
          className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <input
          value={newOptions}
          onChange={(e) => setNewOptions(e.target.value)}
          placeholder="選択肢(カンマ区切り・例: Aさん, Bさん, わからない)"
          className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button onClick={addTopic} disabled={loading} className="rounded-lg bg-emerald-700 px-4 py-1.5 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50">
          追加
        </button>
      </div>

      {/* テーマ一覧+結果確定 */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="mb-2 font-semibold">🗳 投票テーマ一覧</p>
        {data?.topics.map((t) => (
          <div key={t.id} className="mb-3 rounded-lg border border-zinc-800 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">{t.title}</p>
              <span className={`text-xs ${t.status === "open" ? "text-emerald-400" : "text-zinc-500"}`}>
                {t.status === "open" ? "受付中" : `確定: ${t.winner}`}
              </span>
            </div>
            {t.status === "open" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {t.options.map((o: string) => (
                  <button
                    key={o}
                    onClick={() => resolve(t.id, o)}
                    disabled={loading}
                    className="rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-1 text-xs hover:bg-emerald-800 disabled:opacity-50"
                  >
                    「{o}」で確定
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 登録ユーザー */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="mb-2 font-semibold">👤 登録ユーザー({Object.keys(data?.users || {}).length}人)</p>
        <div className="max-h-60 overflow-y-auto font-mono text-xs">
          {Object.entries(data?.users || {}).map(([name, u]) => (
            <p key={name} className="border-b border-zinc-800/50 py-1">
              {name} | {u.solanaAddress.slice(0, 6)}...{u.solanaAddress.slice(-4)} | エアドロ {u.airdropAmount} HMC
              {u.airdropReceived ? " ✅" : " ⏳"} | 残高 {data?.points?.[name]?.pending ?? 0} HMC
            </p>
          ))}
        </div>
      </div>

      {/* 最近の履歴 */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="mb-2 font-semibold">🎁 最近のログインボーナス</p>
          <div className="max-h-40 overflow-y-auto text-xs font-mono">
            {data?.lastBonuses.map((b, i) => (
              <p key={i} className="border-b border-zinc-800/50 py-1">{b.address.slice(0, 8)}... +{b.amount} HMC</p>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="mb-2 font-semibold">🎰 最近のくじ</p>
          <div className="max-h-40 overflow-y-auto text-xs font-mono">
            {data?.lastLotteries.map((l, i) => (
              <p key={i} className="border-b border-zinc-800/50 py-1">
                {l.address.slice(0, 8)}... {l.won ? `🎉 +${l.winAmount} HMC` : "はずれ"}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
