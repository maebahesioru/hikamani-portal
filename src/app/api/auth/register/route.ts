// アカウント番号発行(Mullvad方式: 16桁の数字・メール/パスワード不要)
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Keypair } from "@solana/web3.js";
import { getUsers, saveUsers, hashAccountNumber, createSessionToken, generateAccountNumber, generateReceiveId, formatAccountNumber, User } from "@/lib/auth";
import { readJson, writeJson, PointEntry } from "@/lib/store";
import { encryptPrivateKey } from "@/lib/crypto-keys";

export const dynamic = "force-dynamic";

const AIRDROP_AMOUNT = 1000; // 発行でエアドロ1,000 HMC対象

export async function POST(req: NextRequest) {
  // 既存の番号と衝突しない16桁を生成(ほぼ起きないが念のため)
  const users = getUsers();
  let accountNumber = "";
  do {
    accountNumber = generateAccountNumber();
  } while (users[accountNumber]);

  // 受取IDも既存と衝突しないものに
  let receiveId = "";
  const existing = new Set(Object.values(users).map((u) => u.receiveId));
  do {
    receiveId = generateReceiveId();
  } while (existing.has(receiveId));

  const kp = Keypair.generate();
  const salt = randomBytes(16).toString("hex");
  const token = createSessionToken();

  const user: User = {
    accountNumber,
    receiveId,
    salt,
    hash: hashAccountNumber(accountNumber, salt),
    solanaAddress: kp.publicKey.toBase58(),
    encryptedPrivateKey: encryptPrivateKey(kp.secretKey, accountNumber),
    airdropReceived: false,
    airdropAmount: AIRDROP_AMOUNT,
    createdAt: new Date().toISOString(),
    sessionToken: token,
    failCount: 0,
    lockUntil: null,
  };
  users[accountNumber] = user;
  saveUsers(users);

  // エアドロ対象ポイントを初期付与
  const points = readJson<Record<string, PointEntry>>("points.json", {});
  if (!points[accountNumber]) {
    points[accountNumber] = { address: kp.publicKey.toBase58(), pending: AIRDROP_AMOUNT, sent: 0, updatedAt: new Date().toISOString() };
    writeJson("points.json", points);
  }

  return NextResponse.json({
    ok: true,
    token,
    accountNumber,
    receiveId,
    accountNumberDisplay: formatAccountNumber(accountNumber),
    solanaAddress: kp.publicKey.toBase58(),
    airdropAmount: AIRDROP_AMOUNT,
    warning: "この番号があなたのアカウントです。失くすと復旧できません。必ずメモしてください。",
  });
}
