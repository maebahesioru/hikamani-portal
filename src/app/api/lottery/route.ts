// ヒカマくじ(100 HMC消費・当選で200 HMC)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { readJson, writeJson, LotteryEntry, PointEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

const LOTTERY_COST = 100;
const LOTTERY_WIN = 200;
const WIN_RATE = 0.1;

export async function POST(req: NextRequest) {
  const user = userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const p = points[user.username] || { address: user.solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  if (p.pending < LOTTERY_COST) {
    return NextResponse.json({ error: `ポイントが不足しています(くじ: ${LOTTERY_COST} HMC・現在 ${p.pending} HMC)` }, { status: 400 });
  }

  const won = Math.random() < WIN_RATE;
  const prize = won ? LOTTERY_WIN : 0;
  p.pending = p.pending - LOTTERY_COST + prize;
  p.updatedAt = new Date().toISOString();
  points[user.username] = p;
  writeJson("points.json", points);

  const history = readJson<LotteryEntry[]>("lotteries.json", []);
  history.push({ address: user.username, result: won ? "win" : "lose", amount: LOTTERY_COST, prize, at: new Date().toISOString() });
  writeJson("lotteries.json", history);

  return NextResponse.json({ ok: true, won, prize, pending: p.pending });
}
