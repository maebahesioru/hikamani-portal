// ログアウト
import { NextRequest, NextResponse } from "next/server";
import { getUsers, saveUsers, userFromToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  const users = getUsers();
  for (const u of Object.values(users)) {
    if (u.sessionToken === token) {
      u.sessionToken = null;
      saveUsers(users);
      break;
    }
  }
  return NextResponse.json({ ok: true });
}
