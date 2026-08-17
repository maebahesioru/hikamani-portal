// バカラ(簡易版・HMCベット・換金なしゲーム内ポイント)
import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { readJson, writeJson, PointEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

const MIN_BET = 50; // 最低ベット(価格表準拠)
const PAYOUT: Record<string, number> = { player: 2, banker: 1.95, tie: 9 }; // ベット額に対する倍率(タイは9倍)

export interface BaccaratEntry {
  address: string;
  bet: string; // player | banker | tie
  amount: number;
  result: string;
  payout: number;
  at: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const address = (body?.address || "").trim();
  const bet = String(body?.bet || "");
  const amount = Math.floor(Number(body?.amount || 0));
  try { new PublicKey(address); } catch { return NextResponse.json({ error: "無効なウォレットアドレスです" }, { status: 400 }); }
  if (!["player", "banker", "tie"].includes(bet)) return NextResponse.json({ error: "player / banker / tie のいずれかを指定してください" }, { status: 400 });
  if (amount < MIN_BET) return NextResponse.json({ error: `最低ベットは ${MIN_BET} HMCです` }, { status: 400 });

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const p = points[address] || { address, pending: 0, sent: 0, updatedAt: "" };
  if (p.pending < amount) {
    return NextResponse.json({ error: `ポイントが不足しています(現在 ${p.pending} HMC)` }, { status: 400 });
  }

  // 抽選: player 45% / banker 45% / tie 10%
  const r = Math.random();
  const result = r < 0.45 ? "player" : r < 0.9 ? "banker" : "tie";
  const win = bet === result;
  const payout = win ? Math.floor(amount * PAYOUT[bet]) : 0;
  p.pending = p.pending - amount + payout;
  p.updatedAt = new Date().toISOString();
  points[address] = p;
  writeJson("points.json", points);

  const history = readJson<BaccaratEntry[]>("baccarat.json", []);
  history.push({ address, bet, amount, result, payout, at: new Date().toISOString() });
  writeJson("baccarat.json", history);

  return NextResponse.json({ ok: true, win, result, bet, amount, payout, pending: p.pending });
}
