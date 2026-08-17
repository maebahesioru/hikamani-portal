"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

function formatNum(n: string): string {
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function maskNum(n: string): string {
  return "•••• •••• •••• ••••";
}

export default function AuthPanel() {
  const { session, createAccount, login, logout, refresh } = useAuth();
  const [inputNum, setInputNum] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [newAccount, setNewAccount] = useState<string | null>(null);
  const [showNum, setShowNum] = useState(false);
  const [expInput, setExpInput] = useState("");
  const [exported, setExported] = useState<{ warning: string; privateKeyJson: string } | null>(null);
  const [expMsg, setExpMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  async function doCreate() {
    setLoading(true);
    setNewAccount(null);
    const res = await createAccount();
    if (res.error) { setMsg({ ok: false, text: res.error }); }
    else {
      setMsg({ ok: true, text: "アカウント発行完了! エアドロップ1,000 HMCの対象になりました" });
      setNewAccount(res.accountNumber);
      await refresh();
    }
    setLoading(false);
  }

  async function doLogin() {
    const num = inputNum.replace(/\s/g, "");
    if (!/^\d{16}$/.test(num)) { setMsg({ ok: false, text: "16桁の数字を入力してください" }); return; }
    setLoading(true);
    const err = await login(num);
    if (err) setMsg({ ok: false, text: err });
    else { setMsg({ ok: true, text: "ログインしました" }); setInputNum(""); await refresh(); }
    setLoading(false);
  }

  async function doExport() {
    const num = expInput.replace(/\s/g, "");
    if (!session) return;
    if (!/^\d{16}$/.test(num)) { setExpMsg({ ok: false, text: "16桁のアカウント番号を入力してください" }); return; }
    setExporting(true);
    setExported(null);
    try {
      const r = await fetch("/api/wallet/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ accountNumber: num }),
      });
      const j = await r.json();
      if (r.ok) {
        setExported({ warning: j.warning, privateKeyJson: j.privateKeyJson });
        setExpMsg({ ok: true, text: "復号成功" });
        setExpInput("");
      } else {
        setExpMsg({ ok: false, text: j.error || "エクスポートに失敗しました" });
      }
    } catch {
      setExpMsg({ ok: false, text: "通信エラー" });
    }
    setExporting(false);
  }

  if (session) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400">ログイン中: <b className="text-emerald-400 font-mono">{showNum ? formatNum(session.accountNumber) : maskNum(session.accountNumber)}</b></p>
            <button
              onClick={() => setShowNum(!showNum)}
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800"
            >
              {showNum ? "🙈 番号を隠す" : "👁 番号を表示"}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-zinc-600">アカウント番号はパスワードと同じです。画面共有やスクリーンショットに注意してください。</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
          <p className="text-zinc-400">あなたのHMC残高</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{session.pending.toLocaleString()} HMC</p>
          <p className="mt-1 text-xs text-zinc-500">(未送金: {session.pending.toLocaleString()} / 送金済み: {session.sent.toLocaleString()})</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
          <p className="text-zinc-400">あなたの受け取りアドレス(将来のチェーン送金先)</p>
          <p className="mt-1 font-mono text-xs text-sky-300 break-all">{session.solanaAddress}</p>
        </div>

        {/* 秘密鍵エクスポート */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="mb-2 text-sm font-semibold text-zinc-300">🔑 秘密鍵のエクスポート</p>
          <p className="mb-2 text-xs text-zinc-500">
            アカウント番号を入力すると、このウォレットの秘密鍵を取り出せます(Phantom等へのインポート用)。<b className="text-red-400">絶対に他人に見せないでください。</b>
          </p>
          <input
            value={expInput}
            onChange={(e) => setExpInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doExport()}
            placeholder="16桁のアカウント番号"
            className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-amber-500"
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
    <div className="space-y-4">
      {/* 新規発行 */}
      <div className="rounded-lg border border-sky-900 bg-sky-950/20 p-4">
        <p className="mb-2 text-sm font-semibold text-sky-300">🆕 アカウント番号を発行する</p>
        <p className="mb-3 text-xs text-zinc-500">
          メールもパスワードも不要。ボタン1つで16桁の番号が発行されます(登録でエアドロップ1,000 HMCの対象)
        </p>
        <button
          onClick={doCreate}
          disabled={loading}
          className="w-full rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold hover:bg-sky-600 disabled:opacity-50"
        >
          {loading ? "発行中..." : "アカウント番号を発行"}
        </button>
        {newAccount && (
          <div className="mt-3 rounded-lg border border-amber-700 bg-amber-950/30 p-3">
            <p className="text-xs text-red-300 font-bold">⚠️ この番号があなたのアカウントです。失くすと復旧できません。必ずメモしてください!</p>
            <p className="mt-2 text-center font-mono text-2xl font-bold tracking-wider text-amber-300">{formatNum(newAccount)}</p>
            <button
              onClick={() => navigator.clipboard.writeText(newAccount)}
              className="mt-2 w-full rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800"
            >
              番号をコピー
            </button>
          </div>
        )}
      </div>

      {/* ログイン */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <p className="mb-2 text-sm font-semibold">🔓 アカウント番号でログイン</p>
        <input
          value={inputNum}
          onChange={(e) => setInputNum(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doLogin()}
          placeholder="1234 5678 9012 3456"
          className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-sky-500"
        />
        <button
          onClick={doLogin}
          disabled={loading}
          className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
    </div>
  );
}
