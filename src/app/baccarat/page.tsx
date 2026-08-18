import type { Metadata } from "next";
import BaccaratPanel from "../baccarat-panel";
import PageTitle from "../page-title";

export const metadata: Metadata = {
  title: "バカラ - Hikamani Coin (HMC)",
  description: "HMCで遊ぶ簡易バカラ(換金なしのゲーム内ポイント)",
};

export default function BaccaratPage() {
  return (
    <main className=" px-4 py-8">
      <PageTitle textKey="baccarat" />
      <p className="mt-1 mb-6 text-sm text-zinc-400">
        プレイヤー / バンカー / タイの3択。換金なしのゲーム内ポイント
      </p>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 p-5">
        <BaccaratPanel />
      </div>
      <p className="mt-4 text-xs text-zinc-600">
        ※本ゲームは「ゲーム内ポイント」を使用する娯楽であり、賭博ではありません。実金への換金経路はありません。
      </p>
    </main>
  );
}
