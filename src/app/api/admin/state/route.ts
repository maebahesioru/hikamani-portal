// 管理パネル用状態取得
import { NextRequest, NextResponse } from "next/server";
import { readJson, WalletEntry, PointEntry, BonusEntry, LotteryEntry, BetEntry, BaccaratEntry } from "@/lib/store";
import { checkAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!checkAdmin(req.headers.get("x-admin-key"))) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const wallets = readJson<Record<string, WalletEntry>>("wallets.json", {});
  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const bonuses = readJson<BonusEntry[]>("bonuses.json", []);
  const lotteries = readJson<LotteryEntry[]>("lotteries.json", []);
  const bets = readJson<BetEntry[]>("bets.json", []);
  const baccarats = readJson<BaccaratEntry[]>("baccarat.json", []);
  const topics = readJson<any[]>("topics.json", []);

  const totalPending = Object.values(points).reduce((s, p) => s + p.pending, 0);
  const totalSent = Object.values(points).reduce((s, p) => s + p.sent, 0);

  return NextResponse.json({
    stats: {
      wallets: Object.keys(wallets).length,
      airdropTotal: Object.values(wallets).reduce((s, w) => s + (w.airdropAmount || 0), 0),
      bonuses: bonuses.length,
      lotteries: lotteries.length,
      bets: bets.length,
      baccarats: baccarats.length,
      totalPending,
      totalSent,
    },
    wallets,
    points,
    topics,
    lastBonuses: bonuses.slice(-10).reverse(),
    lastLotteries: lotteries.slice(-10).reverse(),
    lastBets: bets.slice(-10).reverse(),
  });
}
