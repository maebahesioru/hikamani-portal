"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

function formatNum(n: string): string {
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function maskNum(n: string): string {
  return "•••• •••• •••• ••••";
}

export default function AuthBar() {
  const { session, logout } = useAuth();
  const [showNum, setShowNum] = useState(false);
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {session ? (
        <>
          <span className="font-mono text-xs text-emerald-400">
            {showNum ? formatNum(session.accountNumber) : maskNum(session.accountNumber)}
          </span>
          <button
            onClick={() => setShowNum(!showNum)}
            title={showNum ? "番号を隠す" : "番号を表示"}
            className="rounded-lg border border-zinc-700 px-1.5 py-0.5 text-xs hover:bg-zinc-800"
          >
            {showNum ? "🙈" : "👁"}
          </button>
          <span className="text-xs text-amber-300"><b>{session.pending.toLocaleString()} HMC</b></span>
          <button
            onClick={logout}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800"
          >
            ログアウト
          </button>
        </>
      ) : (
        <Link href="/account" className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold hover:bg-sky-600">
          番号を発行/ログイン
        </Link>
      )}
    </div>
  );
}
