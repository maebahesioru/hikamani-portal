// ログインボーナス(1日1回・HMCポイント付与)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { readJson, writeJson, BonusEntry, PointEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

const BONUS_PER_DAY = 10;

export async function POST(req: NextRequest) {
  const user = userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const today = new Date().toISOString().slice(0, 10);
  const bonuses = readJson<BonusEntry[]>("bonuses.json", []);
  if (bonuses.some((b) => b.date === today && b.address === user.accountNumber)) {
    return NextResponse.json({ error: "今日のボーナスは受け取り済みです" }, { status: 400 });
  }

  bonuses.push({ date: today, address: user.accountNumber, amount: BONUS_PER_DAY, at: new Date().toISOString() });
  writeJson("bonuses.json", bonuses);

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const p = points[user.accountNumber] || { address: user.solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  p.pending += BONUS_PER_DAY;
  p.updatedAt = new Date().toISOString();
  points[user.accountNumber] = p;
  writeJson("points.json", points);

  return NextResponse.json({ ok: true, amount: BONUS_PER_DAY, pending: p.pending });
}
