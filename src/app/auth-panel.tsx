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
  const [inputPw, setInputPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [newAccount, setNewAccount] = useState<string | null>(null);
  const [showNum, setShowNum] = useState(false);
  const [expPw, setExpPw] = useState("");
  const [exported, setExported] = useState<{ warning: string; privateKeyJson: string } | null>(null);
  const [expMsg, setExpMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toInput, setToInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [txMsg, setTxMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [transferring, setTransferring] = useState(false);

  async function doTransfer() {
    const to = toInput.replace(/\s/g, "").toLowerCase();
    const amount = Math.floor(Number(amountInput) || 0);
    if (!session) return;
    if (!/^[a-z0-9]{6}$/.test(to)) { setTxMsg({ ok: false, text: "送金先は受取ID(6文字の英数字)です" }); return; }
    if (amount < 1) { setTxMsg({ ok: false, text: "送金額を入力してください(1 HMC以上)" }); return; }
    if (!confirm(`${amount} HMC を 受取ID「${to}」に送金しますか?`)) return;
    setTransferring(true);
    try {
      const r = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ to, amount }),
      });
      const j = await r.json();
      if (r.ok) {
        setTxMsg({ ok: true, text: `${amount} HMC 送金完了! 残り ${j.pending} HMC` });
        setToInput(""); setAmountInput("");
        await refresh();
      } else {
        setTxMsg({ ok: false, text: j.error || "送金に失敗しました" });
      }
    } catch {
      setTxMsg({ ok: false, text: "通信エラー" });
    }
    setTransferring(false);
  }

  async function doCreate() {
    if (newPw.length < 8) { setMsg({ ok: false, text: "パスワードは8文字以上にしてください" }); return; }
    setLoading(true);
    setNewAccount(null);
    const res = await createAccount(newPw);
    if (res.error) { setMsg({ ok: false, text: res.error }); }
    else {
      setMsg({ ok: true, text: "アカウント発行完了! エアドロップ1,000 HMCの対象になりました" });
      setNewAccount(res.accountNumber);
      setNewPw("");
      await refresh();
    }
    setLoading(false);
  }

  async function doLogin() {
    const num = inputNum.replace(/\s/g, "");
    if (!/^\d{16}$/.test(num)) { setMsg({ ok: false, text: "16桁の数字を入力してください" }); return; }
    if (inputPw.length < 1) { setMsg({ ok: false, text: "パスワードを入力してください" }); return; }
    setLoading(true);
    const err = await login(num, inputPw);
    if (err) setMsg({ ok: false, text: err });
    else { setMsg({ ok: true, text: "ログインしました" }); setInputNum(""); setInputPw(""); await refresh(); }
    setLoading(false);
  }

  async function doExport() {
    if (!session) return;
    if (expPw.length < 1) { setExpMsg({ ok: false, text: "パスワードを入力してください" }); return; }
    setExporting(true);
    setExported(null);
    try {
      const r = await fetch("/api/wallet/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ password: expPw }),
      });
      const j = await r.json();
      if (r.ok) {
        setExported({ warning: j.warning, privateKeyJson: j.privateKeyJson });
        setExpMsg({ ok: true, text: "復号成功" });
        setExpPw("");
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
            <p className="text-zinc-600 dark:text-zinc-400">ログイン中: <b className="text-emerald-400 font-mono">{showNum ? formatNum(session.accountNumber) : maskNum(session.accountNumber)}</b></p>
            <button
              onClick={() => setShowNum(!showNum)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              {showNum ? "🙈 番号を隠す" : "👁 番号を表示"}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-zinc-600 dark:text-zinc-600">アカウント番号はIDです。パスワードとセットでログインします。画面共有やスクリーンショットに注意してください。</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-950/50 p-3 text-sm">
          <p className="text-zinc-600 dark:text-zinc-400">あなたのHMC残高</p>
          <p className="mt-1 text-2xl font-bold text-amber-300">{session.pending.toLocaleString()} HMC</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-500">(未送金: {session.pending.toLocaleString()} / 送金済み: {session.sent.toLocaleString()})</p>
        </div>
        <div className="rounded-lg border border-sky-900 bg-sky-950/20 p-3 text-sm">
          <p className="text-zinc-400">📨 あなたの受取ID(送金してもらう用・他人に教えてOK)</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-sky-300">{session.receiveId}</p>
          <p className="mt-1 text-[10px] text-zinc-500">送金相手にはこの受取IDを伝えてください。アカウント番号(16桁)は絶対に教えないでください。</p>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-950/50 p-3 text-sm">
          <p className="text-zinc-600 dark:text-zinc-400">あなたの受け取りアドレス(将来のチェーン送金先)</p>
          <p className="mt-1 font-mono text-xs text-sky-300 break-all">{session.solanaAddress}</p>
        </div>

        {/* 秘密鍵エクスポート */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-950/50 p-3">
          <p className="mb-2 text-sm font-semibold text-zinc-300">🔑 秘密鍵のエクスポート</p>
          <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-500">
            パスワードを入力すると、このウォレットの秘密鍵を取り出せます(Phantom等へのインポート用)。<b className="text-red-400">絶対に他人に見せないでください。</b>
          </p>
          <input
            type="password"
            value={expPw}
            onChange={(e) => setExpPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doExport()}
            placeholder="パスワード"
            className="mb-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-amber-500"
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
                className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                コピーする
              </button>
            </div>
          )}
          {expMsg && <p className={`mt-2 text-xs ${expMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{expMsg.text}</p>}
        </div>

        {/* 送金 */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-950/50 p-3">
          <p className="mb-2 text-sm font-semibold text-zinc-300">💸 HMCを送金</p>
          <p className="mb-2 text-xs text-zinc-600 dark:text-zinc-500">相手の<b className="text-sky-300">受取ID(6文字)</b>を入力して送金。アカウント番号(16桁)は使わないでください(番号はあなたのIDです)。</p>
          <input
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            placeholder="送信先の受取ID(例: ab12cd)"
            className="mb-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-sky-500"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="数量(HMC)"
              className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-sky-500"
            />
            <button
              onClick={doTransfer}
              disabled={transferring}
              className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold hover:bg-sky-600 disabled:opacity-50"
            >
              {transferring ? "送金中..." : "送金"}
            </button>
          </div>
          {txMsg && <p className={`mt-2 text-xs ${txMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{txMsg.text}</p>}
        </div>

        <button onClick={() => { if (confirm("ログアウトしますか?")) logout(); }} className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800">
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
          16桁のアカウント番号(ログインID)+パスワードを設定。登録でエアドロップ1,000 HMCの対象
        </p>
        <input
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="パスワード(8文字以上)"
          className="mb-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-sky-500"
        />
        <button
          onClick={doCreate}
          disabled={loading}
          className="w-full rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold hover:bg-sky-600 disabled:opacity-50"
        >
          {loading ? "発行中..." : "アカウント番号を発行"}
        </button>
        {newAccount && (
          <div className="mt-3 rounded-lg border border-amber-700 bg-amber-950/30 p-3">
            <p className="text-xs text-red-300 font-bold">⚠️ この番号があなたのアカウントIDです。失くすと復旧できません。必ずメモしてください!</p>
            <p className="mt-2 text-center font-mono text-2xl font-bold tracking-wider text-amber-300">{formatNum(newAccount)}</p>
            <button
              onClick={() => navigator.clipboard.writeText(newAccount)}
              className="mt-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-800"
            >
              番号をコピー
            </button>
          </div>
        )}
      </div>

      {/* ログイン */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 p-4">
        <p className="mb-2 text-sm font-semibold">🔓 アカウント番号+パスワードでログイン</p>
        <input
          value={inputNum}
          onChange={(e) => setInputNum(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doLogin()}
          placeholder="1234 5678 9012 3456"
          className="mb-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-sky-500"
        />
        <input
          type="password"
          value={inputPw}
          onChange={(e) => setInputPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doLogin()}
          placeholder="パスワード"
          className="mb-2 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-sky-500"
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
