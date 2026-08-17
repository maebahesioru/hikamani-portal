// ログイン
import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, verifyPassword, createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");

  const users = getUsers();
  const user = users[username];
  if (!user || !verifyPassword(password, user.salt, user.hash)) {
    return NextResponse.json({ error: "ユーザー名またはパスワードが違います" }, { status: 401 });
  }

  const token = createSessionToken();
  user.sessionToken = token;
  saveUsers(users);

  return NextResponse.json({ ok: true, token, username, solanaAddress: user.solanaAddress });
}
