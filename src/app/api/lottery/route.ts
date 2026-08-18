// ヒカマくじ(100 HMC消費・当選テーブルで抽選)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { readJson, writeJson, LotteryEntry, PointEntry } from "@/lib/store";
import { GAME, GAME_LOTTERIES } from "@/lib/hmc";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const p = points[user.accountNumber] || { address: user.solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  if (p.pending < GAME.lotteryCost) {
    return NextResponse.json({ error: `ポイントが不足しています(くじ: ${GAME.lotteryCost} HMC・現在 ${p.pending} HMC)` }, { status: 400 });
  }

  // 当選テーブルによる抽選(累積確率)
  const r = Math.random() * 100; // 0〜100%
  let cumulative = 0;
  let result = GAME_LOTTERIES[GAME_LOTTERIES.length - 1]; // デフォルト: 最後(5等)
  for (const t of GAME_LOTTERIES) {
    cumulative += t.rate * 100;
    if (r < cumulative) { result = t; break; }
  }

  const prize = result.prize;
  p.pending = p.pending - GAME.lotteryCost + prize;
  p.updatedAt = new Date().toISOString();
  points[user.accountNumber] = p;
  writeJson("points.json", points);

  const history = readJson<LotteryEntry[]>("lotteries.json", []);
  history.push({ address: user.accountNumber, result: result.name, amount: GAME.lotteryCost, prize, at: new Date().toISOString() });
  writeJson("lotteries.json", history);

  return NextResponse.json({ ok: true, won: prize > GAME.lotteryCost, name: result.name, prize, pending: p.pending });
}
