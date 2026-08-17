"use client";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

function formatNum(n: string): string {
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export default function AuthBar() {
  const { session, logout } = useAuth();
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {session ? (
        <>
          <span className="font-mono text-xs text-emerald-400">{formatNum(session.accountNumber)}</span>
          <span className="text-xs text-amber-300"><b>{session.pending.toLocaleString()} HMC</b></span>
          <button
            onClick={logout}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800"
          >
            ログアウト
          </button>
        </>
      ) : (
        <Link href="/" className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold hover:bg-sky-600">
          番号を発行/ログイン
        </Link>
      )}
    </div>
  );
}
