"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AuthPanel() {
  const { session, login, register, logout, refresh } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expPassword, setExpPassword] = useState("");
  const [exported, setExported] = useState<{ warning: string; privateKeyJson: string } | null>(null);
  const [expMsg, setExpMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  async function doExport() {
    if (!expPassword) { setExpMsg({ ok: false, text: "パスワードを入力してください" }); return; }
    setExporting(true);
    setExported(null);
    try {
      const r = await fetch("/api/wallet/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${session?.token}` },
        body: JSON.stringify({ password: expPassword }),
      });
      const j = await r.json();
      if (r.ok) {
        setExported({ warning: j.warning, privateKeyJson: j.privateKeyJson });
        setExpMsg({ ok: true, text: "復号成功" });
        setExpPassword("");
      } else {
        setExpMsg({ ok: false, text: j.error || "エクスポートに失敗しました" });
      }
    } catch {
      setExpMsg({ ok: false, text: "通信エラー" });
    }
    setExporting(false);
  }

  async function submit() {
    const name = username.trim();
    if (!name || !password) { setMsg({ ok: false, text: "ユーザー名とパスワードを入力してください" }); return; }
    if (mode === "register" && password !== password2) { setMsg({ ok: false, text: "パスワードが一致しません" }); return; }
    setLoading(true);
    const err = mode === "register" ? await register(name, password) : await login(name, password);
    if (err) { setMsg({ ok: false, text: err }); }
    else {
      setMsg({ ok: true, text: mode === "register" ? "🎉 アカウント作成完了! エアドロップ1,000 HMCの対象になりました" : "ログインしました" });
      setUsername(""); setPassword(""); setPassword2("");
      await refresh();
    }
    setLoading(false);
  }

  if (session) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-zinc-400">
          ログイン中: <b className="text-emerald-400">{session.username}</b>
        </p>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
          <p className="text-zinc-400">あなたのHMC残高</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{session.pending.toLocaleString()} HMC</p>
          <p className="mt-1 text-xs text-zinc-500">(未送金ポイント: {session.pending.toLocaleString()} / 送金済み: {session.sent.toLocaleString()})</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
          <p className="text-zinc-400">あなたの受け取りアドレス(将来のチェーン送金先)</p>
          <p className="mt-1 font-mono text-xs text-sky-300 break-all">{session.solanaAddress}</p>
        </div>

        {/* 秘密鍵エクスポート */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="mb-2 text-sm font-semibold text-zinc-300">🔑 秘密鍵のエクスポート</p>
          <p className="mb-2 text-xs text-zinc-500">
            パスワードを入力すると、このウォレットの秘密鍵を取り出せます(Phantom等へのインポート用)。<b className="text-red-400">絶対に他人に見せないでください。</b>
          </p>
          <input
            type="password"
            value={expPassword}
            onChange={(e) => setExpPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doExport()}
            placeholder="パスワード"
            className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <button
            onClick={doExport}
            disabled={exporting}
            className="rounded-lg bg-amber-700 px-4 py-1.5 text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
          >
            {exporting ? "復号中..." : "秘密鍵を取り出す"}
          </button>
          {exported && (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-red-400">{exported.warning}</p>
              <textarea
                readOnly
                value={exported.privateKeyJson}
                rows={3}
                className="w-full rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 font-mono text-[10px] text-red-200 outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(exported.privateKeyJson)}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-xs hover:bg-zinc-800"
              >
                コピーする
              </button>
            </div>
          )}
          {expMsg && <p className={`mt-2 text-xs ${expMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{expMsg.text}</p>}
        </div>

        <button onClick={logout} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        {mode === "register"
          ? "ユーザー名とパスワードを決めるだけでOK。Phantom等のウォレットは不要です(登録でエアドロップ1,000 HMCの対象)"
          : "ユーザー名とパスワードでログイン"}
      </p>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="ユーザー名(2〜20文字)"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="パスワード(4文字以上)"
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
      />
      {mode === "register" && (
        <input
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="パスワード(確認)"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading}
          className="flex-1 rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold hover:bg-sky-600 disabled:opacity-50"
        >
          {loading ? "処理中..." : mode === "register" ? "アカウント作成" : "ログイン"}
        </button>
        <button
          onClick={() => setMode(mode === "register" ? "login" : "register")}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800"
        >
          {mode === "register" ? "ログインへ" : "新規登録へ"}
        </button>
      </div>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
