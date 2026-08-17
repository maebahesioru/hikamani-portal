"use client";
import { useAuth } from "@/lib/auth-context";

export default function PointsPanel() {
  const { session } = useAuth();
  if (!session) return null;

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{session.accountNumber} のHMC残高</span>
        <span className="text-2xl font-bold text-amber-300">{session.pending.toLocaleString()} HMC</span>
      </div>
      <p className="mt-1 text-xs text-zinc-600">
        未送金: {session.pending.toLocaleString()} HMC / 送金済み: {session.sent.toLocaleString()} HMC(送金は運営が定期的に実施)
      </p>
    </div>
  );
}