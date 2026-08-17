import type { Metadata } from "next";
import BetPanel from "../bet-panel";

export const metadata: Metadata = {
  title: "予想投票 - Hikamani Coin (HMC)",
  description: "界隈で起こることを予想してHMCで投票",
};

export default function VotePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">🗳 予想投票</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-400">
        界隈で起こることを予想して <b className="text-sky-300">50 HMC</b> で投票(配当は結果確定時)
      </p>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <BetPanel />
      </div>
      <p className="mt-4 text-xs text-zinc-600">
        投票テーマはコミュニティの提案で追加されます。結果確定後、的中者に配当がポイント加算されます。
      </p>
    </main>
  );
}
