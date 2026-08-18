import type { Metadata } from "next";
import LotteryPanel from "../lottery-panel";
import PageTitle from "../page-title";
import { GAME } from "@/lib/hmc";

export const metadata: Metadata = {
  title: "ヒカマくじ - Hikamani Coin (HMC)",
  description: `ヒカマくじ: ${GAME.lotteryCost} HMCで抽選・当選で${GAME.lotteryWin} HMC`,
};

export default function KujiPage() {
  return (
    <main className="px-4 py-8">
      <PageTitle textKey="kuji" />
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        1回 {GAME.lotteryCost} HMC。当選テーブルは以下(福島賞に当たるのは伝説級)
      </p>
      <div className="rounded-xl border border-zinc-200 bg-zinc-100/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <LotteryPanel />
      </div>
      <p className="mt-4 text-xs text-zinc-600">
        くじで獲得したHMCはポイントとして記録され、運営が定期的にブロックチェーン上で送金します。
      </p>
    </main>
  );
}
