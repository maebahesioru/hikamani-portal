// ポイント付与(管理機能・デバッグ用HMCの配布など)
import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson, PointEntry } from "@/lib/store";
import { checkAdmin } from "@/lib/admin";
import { getUsers } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!checkAdmin(req.headers.get("x-admin-key"))) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const accountNumber = String(body?.accountNumber || "").replace(/\s/g, "");
  const amount = Math.floor(Number(body?.amount || 0));

  if (!/^\d{16}$/.test(accountNumber)) {
    return NextResponse.json({ error: "16桁のアカウント番号を入力してください" }, { status: 400 });
  }
  if (amount <= 0 || amount > 1000000000) {
    return NextResponse.json({ error: "付与量は1〜1,000,000,000 HMCで指定してください" }, { status: 400 });
  }

  const users = getUsers();
  const user = users[accountNumber];
  if (!user) {
    return NextResponse.json({ error: "このアカウント番号は存在しません" }, { status: 404 });
  }

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const p = points[accountNumber] || { address: user.solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  p.pending += amount;
  p.updatedAt = new Date().toISOString();
  points[accountNumber] = p;
  writeJson("points.json", points);

  return NextResponse.json({ ok: true, accountNumber, granted: amount, pending: p.pending });
}
