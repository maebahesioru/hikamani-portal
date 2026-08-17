// ヒカマくじ(100 HMC消費・当選で200 HMC)
import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { readJson, writeJson, LotteryEntry, PointEntry } from "@/lib/store";
import { GAME } from "@/lib/hmc";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const address = (body?.address || "").trim();
  try {
    new PublicKey(address);
  } catch {
    return NextResponse.json({ error: "無効なウォレットアドレスです" }, { status: 400 });
  }
  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const p = points[address] || { address, pending: 0, sent: 0, updatedAt: "" };
  if (p.pending < GAME.lotteryCost) {
    return NextResponse.json({ error: `ポイントが不足しています(くじ: ${GAME.lotteryCost} HMC・現在 ${p.pending} HMC)` }, { status: 400 });
  }
  // 抽選
  const win = Math.random() < GAME.lotteryWinRate;
  const prize = win ? GAME.lotteryWin : 0;
  p.pending = p.pending - GAME.lotteryCost + prize;
  p.updatedAt = new Date().toISOString();
  points[address] = p;
  writeJson("points.json", points);

  const history = readJson<LotteryEntry[]>("lottery.json", []);
  history.push({ address, result: win ? "win" : "lose", amount: GAME.lotteryCost, prize, at: new Date().toISOString() });
  writeJson("lottery.json", history);

  return NextResponse.json({ ok: true, win, prize, spent: GAME.lotteryCost, pending: p.pending });
}
