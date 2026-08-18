// サイト内送金(アカウント間でHMCポイントを送る)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest, getUsers, saveUsers, checkLock, recordFailure } from "@/lib/auth";
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

  // レート制限: 送金先の当たり判定に悪用されないよう、不正リクエストもカウントしてロック
  const users = getUsers();
  const lockMsg = checkLock(user);
  if (lockMsg) return NextResponse.json({ error: lockMsg }, { status: 429 });

  const body = await req.json().catch(() => null);
  const to = String(body?.to || "").replace(/\s/g, "").toLowerCase();
  const amount = Math.floor(Number(body?.amount || 0));

  // 送金先は「受取ID(6文字の公開ID)」で指定する(アカウント番号=パスワードは絶対に教え合わない)
  if (!/^[a-z0-9]{6}$/.test(to) || amount < MIN_TRANSFER) {
    recordFailure(user);
    saveUsers(users);
    return NextResponse.json({ error: "送金に失敗しました" }, { status: 400 });
  }

  // 受取IDから宛先ユーザーを解決(存在しないIDも同じ文言で拒否・有効性を推測させない)
  const target = Object.values(users).find((u) => u.receiveId === to);
  if (!target || target.accountNumber === user.accountNumber) {
    recordFailure(user);
    saveUsers(users);
    return NextResponse.json({ error: "送金に失敗しました" }, { status: 400 });
  }
  const toAccount = target.accountNumber;

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const from = points[user.accountNumber] || { address: user.solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  if (from.pending < amount) {
    return NextResponse.json({ error: `残高が不足しています(現在 ${from.pending} HMC)` }, { status: 400 });
  }

  from.pending -= amount;
  from.updatedAt = new Date().toISOString();
  points[user.accountNumber] = from;

  const toPoint = points[toAccount] || { address: target.solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  toPoint.pending += amount;
  toPoint.updatedAt = new Date().toISOString();
  points[toAccount] = toPoint;
  writeJson("points.json", points);

  const transfers = readJson<TransferEntry[]>("transfers.json", []);
  transfers.push({ from: user.accountNumber, to: toAccount, amount, at: new Date().toISOString() });
  writeJson("transfers.json", transfers);

  // 成功時は失敗カウントをリセット
  user.failCount = 0;
  user.lockUntil = null;
  saveUsers(users);

  return NextResponse.json({ ok: true, to: toAccount, receiveId: to, amount, pending: from.pending });
}
