// サイト内送金(アカウント間でHMCポイントを送る)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { readJson, writeJson, PointEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

export interface TransferEntry {
  from: string;
  to: string;
  amount: number;
  at: string;
}

const MIN_TRANSFER = 1;

export async function POST(req: NextRequest) {
  const user = userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const to = String(body?.to || "").replace(/\s/g, "");
  const amount = Math.floor(Number(body?.amount || 0));

  if (!/^\d{16}$/.test(to)) {
    return NextResponse.json({ error: "送金先は16桁のアカウント番号で入力してください" }, { status: 400 });
  }
  if (to === user.accountNumber) {
    return NextResponse.json({ error: "自分自身への送金はできません" }, { status: 400 });
  }
  if (amount < MIN_TRANSFER) {
    return NextResponse.json({ error: `最低送金額は ${MIN_TRANSFER} HMCです` }, { status: 400 });
  }

  const users = readJson<Record<string, any>>("users.json", {});
  if (!users[to]) {
    return NextResponse.json({ error: "送金先のアカウントが見つかりません(16桁のアカウント番号を確認してください)" }, { status: 404 });
  }

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const from = points[user.accountNumber] || { address: user.solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  if (from.pending < amount) {
    return NextResponse.json({ error: `残高が不足しています(現在 ${from.pending} HMC)` }, { status: 400 });
  }

  from.pending -= amount;
  from.updatedAt = new Date().toISOString();
  points[user.accountNumber] = from;

  const toPoint = points[to] || { address: users[to].solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  toPoint.pending += amount;
  toPoint.updatedAt = new Date().toISOString();
  points[to] = toPoint;
  writeJson("points.json", points);

  const transfers = readJson<TransferEntry[]>("transfers.json", []);
  transfers.push({ from: user.accountNumber, to, amount, at: new Date().toISOString() });
  writeJson("transfers.json", transfers);

  return NextResponse.json({ ok: true, to, amount, pending: from.pending });
}
