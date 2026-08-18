// ログイン(16桁のアカウント番号+パスワードのハイブリッド認証)
import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, verifyAccountNumber, verifyPassword, createSessionToken, generateReceiveId, checkLock, recordFailure, User } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const accountNumber = String(body?.accountNumber || "").replace(/\s/g, "");
  const password = String(body?.password || "");

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

  // ハイブリッド: 番号(hash)とパスワード(hash)の両方を検証
  if (!verifyAccountNumber(accountNumber, user.salt, user.hash)) {
    recordFailure(user);
    saveUsers(users);
    return NextResponse.json({ error: "アカウント番号が違います" }, { status: 401 });
  }
  if (!user.passwordHash) {
    recordFailure(user);
    saveUsers(users);
    return NextResponse.json({ error: "このアカウントはパスワード未設定の旧タイプです。新しくアカウントを作り直してください" }, { status: 401 });
  }
  if (!verifyPassword(password, user.salt, user.passwordHash)) {
    recordFailure(user);
    saveUsers(users);
    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  }

  user.failCount = 0;
  user.lockUntil = null;
  // 既存ユーザーに受取IDが無ければ生成して付与
  if (!user.receiveId) {
    const existing = new Set(Object.values(users).map((u) => u.receiveId));
    let rid = "";
    do { rid = generateReceiveId(); } while (existing.has(rid));
    user.receiveId = rid;
  }
  const token = createSessionToken();
  user.sessionToken = token;
  saveUsers(users);

  return NextResponse.json({ ok: true, token, accountNumber, receiveId: user.receiveId, solanaAddress: user.solanaAddress });
}
