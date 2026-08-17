import type { Metadata } from "next";
import { HMC, PRICES, GAME } from "@/lib/hmc";

export const metadata: Metadata = {
  title: `Hikamani Coin (HMC) - ${HMC.supply} HMC コミュニティトークン`,
  description: "ヒカマニ・ヒカマー界隈のコミュニティトークンHikamani Coin(HMC)の公式ポータル。ウォレット登録・ログインボーナス・ヒカマくじ・エアドロップ情報。",
  openGraph: {
    title: "Hikamani Coin (HMC)",
    description: "ヒカマニ・ヒカマー界隈のコミュニティトークン",
    type: "website",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ヘッダー */}
      <header className="border-b border-zinc-800 bg-zinc-900/60">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-2xl font-bold">
            🥚 Hikamani Coin <span className="text-zinc-400">(HMC)</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            ヒカマニ・ヒカマー界隈のコミュニティトークン / Solana(SPL Token-2022)
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-zinc-800 px-2 py-1">総供給: {HMC.supply} HMC(固定)</span>
            <span className="rounded bg-zinc-800 px-2 py-1">フェアローンチ</span>
            <span className="rounded bg-emerald-900/60 px-2 py-1 text-emerald-300">renounce済み(増刷不可)</span>
            <a href={HMC.solscan} target="_blank" rel="noopener noreferrer" className="rounded bg-zinc-800 px-2 py-1 hover:bg-zinc-700">
              Solscanで見る ↗
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-10">
        {/* ウォレット登録 + 操作パネル */}
        <Panel title="💳 ウォレット登録 / エアドロップ申請">
          <WalletPanel />
        </Panel>

        {/* ログインボーナス + くじ */}
        <div className="grid gap-6 md:grid-cols-2">
          <Panel title={`🎁 ログインボーナス(毎日 ${GAME.bonusPerDay} HMC)`}>
            <BonusPanel />
          </Panel>
          <Panel title={`🎰 ヒカマくじ(1回 ${GAME.lotteryCost} HMC・当選で ${GAME.lotteryWin} HMC)`}>
            <LotteryPanel />
          </Panel>
        </div>

        {/* 予想投票 + バカラ */}
        <div className="grid gap-6 md:grid-cols-2">
          <Panel title="🗳 予想投票(1票 50 HMC)">
            <BetPanel />
          </Panel>
          <Panel title="🃏 バカラ(最低 50 HMC)">
            <BaccaratPanel />
          </Panel>
        </div>

        {/* ポイント残高 */}
        <Panel title="💰 ポイント残高(未送金HMC)">
          <PointsPanel />
        </Panel>

        {/* 配分ダッシュボード */}
        <Panel title="📊 トークン配分(全アドレス公開)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-zinc-400">
                  <th className="py-2 pr-4">ロール</th>
                  <th className="py-2 pr-4">数量</th>
                  <th className="py-2">アドレス</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr>
                  <td className="py-2 pr-4">報酬プール</td>
                  <td className="py-2 pr-4 text-emerald-300">500,000,000 HMC (50%)</td>
                  <td className="py-2 font-mono text-xs text-zinc-400">{HMC.wallets.reward}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">運営リザーブ</td>
                  <td className="py-2 pr-4 text-sky-300">200,000,000 HMC (20%)</td>
                  <td className="py-2 font-mono text-xs text-zinc-400">{HMC.wallets.ops}</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">エアドロップ</td>
                  <td className="py-2 pr-4 text-amber-300">300,000,000 HMC (30%)</td>
                  <td className="py-2 font-mono text-xs text-zinc-400">{HMC.wallets.airdrop}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            ※ エアドロップ・ログインボーナス・くじで獲得したHMCはポイントとして記録され、運営が定期的にブロックチェーン上で送金します(送金完了まで「未送金」表示)。
          </p>
        </Panel>

        {/* 価格表 */}
        <Panel title="📋 サービス価格表">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-400">
                <th className="py-2 pr-4">サービス</th>
                <th className="py-2">価格</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {PRICES.map((p) => (
                <tr key={p.item}>
                  <td className="py-2 pr-4">{p.item}</td>
                  <td className="py-2">{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-zinc-500">
            価格はコミュニティの合意で変更可能。HMCはゲーム内ポイントであり換金経路はありません。
          </p>
        </Panel>

        <footer className="border-t border-zinc-800 pt-6 pb-10 text-center text-xs text-zinc-600">
          <p>Hikamani Coin (HMC) - ヒカマニ・ヒカマー界隈のコミュニティトークン</p>
          <p className="mt-1">
            投資勧誘ではありません / 公式リポジトリ:{" "}
            <a href="https://github.com/maebahesioru/hikamani-token" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:underline">
              github.com/maebahesioru/hikamani-token
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

// ---- クライアントコンポーネント ----
import WalletPanel from "./wallet-panel";
import BonusPanel from "./bonus-panel";
import LotteryPanel from "./lottery-panel";
import PointsPanel from "./points-panel";
import BetPanel from "./bet-panel";
import BaccaratPanel from "./baccarat-panel";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}
