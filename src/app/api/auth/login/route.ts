// ログイン(16桁のアカウント番号のみ)
import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, verifyAccountNumber, createSessionToken, checkLock, recordFailure, User } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const accountNumber = String(body?.accountNumber || "").replace(/\s/g, "");

  if (!/^\d{16}$/.test(accountNumber)) {
    return NextResponse.json({ error: "アカウント番号は16桁の数字で入力してください" }, { status: 400 });
  }

  const users = getUsers();
  const user = users[accountNumber];
  if (!user) {
    return NextResponse.json({ error: "このアカウント番号は存在しません" }, { status: 401 });
  }

  const lockMsg = checkLock(user);
  if (lockMsg) {
    saveUsers(users);
    return NextResponse.json({ error: lockMsg }, { status: 429 });
  }

  if (!verifyAccountNumber(accountNumber, user.salt, user.hash)) {
    recordFailure(user);
    saveUsers(users);
    return NextResponse.json({ error: "アカウント番号が違います" }, { status: 401 });
  }

  user.failCount = 0;
  user.lockUntil = null;
  const token = createSessionToken();
  user.sessionToken = token;
  saveUsers(users);

  return NextResponse.json({ ok: true, token, accountNumber, solanaAddress: user.solanaAddress });
}
