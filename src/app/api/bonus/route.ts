// ログインボーナス(1日1回・HMCポイント付与)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { readJson, writeJson, BonusEntry, PointEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

const BONUS_PER_DAY = 10;

export async function POST(req: NextRequest) {
  const user = userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  // 24時間ロール制: 最後に受け取ってから24時間経過で再受け取り可能(タイムゾーン非依存・グローバル対応)
  const bonuses = readJson<BonusEntry[]>("bonuses.json", []);
  const last = bonuses
    .filter((b) => b.address === user.accountNumber)
    .sort((a, b) => b.at.localeCompare(a.at))[0];
  if (last) {
    const elapsed = Date.now() - new Date(last.at).getTime();
    if (elapsed < 24 * 60 * 60 * 1000) {
      const remainH = Math.ceil((24 * 60 * 60 * 1000 - elapsed) / (60 * 60 * 1000));
      return NextResponse.json({ error: `次のボーナスまであと${remainH}時間です` }, { status: 400 });
    }
  }

  bonuses.push({ date: new Date().toISOString().slice(0, 10), address: user.accountNumber, amount: BONUS_PER_DAY, at: new Date().toISOString() });
  writeJson("bonuses.json", bonuses);

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const p = points[user.accountNumber] || { address: user.solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  p.pending += BONUS_PER_DAY;
  p.updatedAt = new Date().toISOString();
  points[user.accountNumber] = p;
  writeJson("points.json", points);

  return NextResponse.json({ ok: true, amount: BONUS_PER_DAY, pending: p.pending });
}
