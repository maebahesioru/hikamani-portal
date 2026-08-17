// ログインボーナス(1日1回・HMCポイント付与)
import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { readJson, writeJson, BonusEntry, PointEntry } from "@/lib/store";
import { GAME } from "@/lib/hmc";

export const dynamic = "force-dynamic";

function todayJp(): string {
  // JST(UTC+9)の日付
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const address = (body?.address || "").trim();
  try {
    new PublicKey(address);
  } catch {
    return NextResponse.json({ error: "無効なウォレットアドレスです" }, { status: 400 });
  }
  const today = todayJp();
  const bonuses = readJson<BonusEntry[]>("bonus.json", []);
  const already = bonuses.find((b) => b.address === address && b.date === today);
  if (already) {
    return NextResponse.json({ error: "今日のログインボーナスは受け取り済みです", received: true, date: today }, { status: 409 });
  }
  bonuses.push({ date: today, address, amount: GAME.bonusPerDay, at: new Date().toISOString() });
  writeJson("bonus.json", bonuses);
  // ポイント加算
  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const p = points[address] || { address, pending: 0, sent: 0, updatedAt: "" };
  p.pending += GAME.bonusPerDay;
  p.updatedAt = new Date().toISOString();
  points[address] = p;
  writeJson("points.json", points);
  return NextResponse.json({ ok: true, amount: GAME.bonusPerDay, pending: p.pending, date: today });
}
