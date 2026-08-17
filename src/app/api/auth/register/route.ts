// アカウント登録(サイト内ウォレット作成+エアドロ対象)
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Keypair } from "@solana/web3.js";
import { getUsers, saveUsers, hashPassword, createSessionToken, User } from "@/lib/auth";
import { readJson, writeJson, PointEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

const AIRDROP_AMOUNT = 1000; // 登録でエアドロ1,000 HMC対象

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");

  if (!username || username.length < 2 || username.length > 20) {
    return NextResponse.json({ error: "ユーザー名は2〜20文字で入力してください" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_\u3040-\u30ff\u4e00-\u9fff]+$/.test(username)) {
    return NextResponse.json({ error: "ユーザー名に使えるのは英数字・_・ひらがな・カタカナ・漢字です" }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "パスワードは4文字以上にしてください" }, { status: 400 });
  }

  const users = getUsers();
  if (users[username]) {
    return NextResponse.json({ error: "このユーザー名は既に使われています" }, { status: 409 });
  }

  // Solanaキーペアを自動生成(受け取りアドレスとして使用・秘密鍵はサーバーに保存しない)
  const kp = Keypair.generate();
  const salt = randomBytes(16).toString("hex");
  const token = createSessionToken();

  const user: User = {
    username,
    salt,
    hash: hashPassword(password, salt),
    solanaAddress: kp.publicKey.toBase58(),
    airdropReceived: false,
    airdropAmount: AIRDROP_AMOUNT,
    createdAt: new Date().toISOString(),
    sessionToken: token,
  };
  users[username] = user;
  saveUsers(users);

  // エアドロ対象ポイントを初期付与(登録ボーナスとしても機能)
  const points = readJson<Record<string, PointEntry>>("points.json", {});
  if (!points[username]) {
    points[username] = { address: kp.publicKey.toBase58(), pending: AIRDROP_AMOUNT, sent: 0, updatedAt: new Date().toISOString() };
    writeJson("points.json", points);
  }

  return NextResponse.json({
    ok: true,
    token,
    username,
    solanaAddress: kp.publicKey.toBase58(),
    airdropAmount: AIRDROP_AMOUNT,
  });
}
