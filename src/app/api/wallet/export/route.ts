// 秘密鍵エクスポート(パスワードで復号して返す)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest, verifyPassword } from "@/lib/auth";
import { decryptPrivateKey } from "@/lib/crypto-keys";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const password = String(body?.password || "");
  if (!verifyPassword(password, user.salt, user.hash)) {
    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  }

  if (!user.encryptedPrivateKey) {
    return NextResponse.json({ error: "このアカウントには秘密鍵が保存されていません(新しいアカウントでのみ利用可能)" }, { status: 400 });
  }

  const secretKey = decryptPrivateKey(user.encryptedPrivateKey, password);
  if (!secretKey) {
    return NextResponse.json({ error: "秘密鍵の復号に失敗しました" }, { status: 500 });
  }

  // JSON配列形式(Phantom等へのインポート互換)
  return NextResponse.json({
    ok: true,
    solanaAddress: user.solanaAddress,
    privateKeyJson: JSON.stringify(Array.from(secretKey)),
    warning: "秘密鍵はあなたのウォレットそのものです。第三者に知られるとHMCを奪われます。この画面を共有しないでください。",
  });
}
