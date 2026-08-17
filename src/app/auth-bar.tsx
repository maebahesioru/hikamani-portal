"use client";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function AuthBar() {
  const { session, logout } = useAuth();
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {session ? (
        <>
          <span className="text-xs text-emerald-400">
            {session.username} <b className="text-amber-300">{session.pending.toLocaleString()} HMC</b>
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-xs hover:bg-zinc-800"
          >
            ログアウト
          </button>
        </>
      ) : (
        <Link href="/" className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold hover:bg-sky-600">
          ログイン/登録
        </Link>
      )}
    </div>
  );
}
