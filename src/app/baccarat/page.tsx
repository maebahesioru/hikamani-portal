import type { Metadata } from "next";
import BaccaratPanel from "../baccarat-panel";

export const metadata: Metadata = {
  title: "バカラ - Hikamani Coin (HMC)",
  description: "HMCで遊ぶ簡易バカラ(換金なしのゲーム内ポイント)",
};

export default function BaccaratPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">🃏 バカラ</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-400">
        プレイヤー / バンカー / タイの3択。換金なしのゲーム内ポイント
      </p>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <BaccaratPanel />
      </div>
      <p className="mt-4 text-xs text-zinc-600">
        ※本ゲームは「ゲーム内ポイント」を使用する娯楽であり、賭博ではありません。実金への換金経路はありません。
      </p>
    </main>
  );
}
