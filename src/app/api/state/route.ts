// 状態取得(ダッシュボード)
import { NextRequest, NextResponse } from "next/server";
import { readJson, WalletEntry, PointEntry, BonusEntry, LotteryEntry } from "@/lib/store";
import { HMC } from "@/lib/hmc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = (req.nextUrl.searchParams.get("address") || "").trim();
  const wallets = readJson<Record<string, WalletEntry>>("wallets.json", {});
  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const bonuses = readJson<BonusEntry[]>("bonus.json", []);
  const lottery = readJson<LotteryEntry[]>("lottery.json", []);

  const p = address ? points[address] : undefined;
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const bonusToday = address ? bonuses.some((b) => b.address === address && b.date === today) : false;
  const registered = address ? !!wallets[address] : false;

  const winCount = lottery.filter((l) => l.result === "win").length;
  const totalSpent = lottery.reduce((s, l) => s + l.amount, 0);
  const totalPrizes = lottery.reduce((s, l) => s + l.prize, 0);

  return NextResponse.json({
    registeredWallets: Object.keys(wallets).length,
    bonusClaimedToday: bonuses.length,
    lotteryPlays: lottery.length,
    lotteryWins: winCount,
    lotterySpent: totalSpent,
    lotteryPrizes: totalPrizes,
    wallet: p ? { pending: p.pending, sent: p.sent } : null,
    bonusToday,
    registered,
    wallets: HMC.wallets,
    airdropRegistered: address ? !!wallets[address] : false,
  });
}
