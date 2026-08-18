// 状態取得(ダッシュボード・ログインユーザー向け)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest, getUsers, saveUsers, generateReceiveId } from "@/lib/auth";
import { readJson, PointEntry, WalletEntry } from "@/lib/store";
import { HMC } from "@/lib/hmc";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });

  // 既存ユーザーに受取IDが無ければ生成して付与(何らかの理由で未付与のケース)
  if (!user.receiveId) {
    const users = getUsers();
    const existing = new Set(Object.values(users).map((u) => u.receiveId));
    let rid = "";
    do { rid = generateReceiveId(); } while (existing.has(rid));
    user.receiveId = rid;
    saveUsers(users);
  }

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const wallets = readJson<Record<string, WalletEntry>>("wallets.json", {});
  const p = points[user.accountNumber] || { address: user.solanaAddress, pending: 0, sent: 0, updatedAt: "" };

  return NextResponse.json({
    user: {
      receiveId: user.receiveId,
      solanaAddress: user.solanaAddress,
      airdropAmount: user.airdropAmount,
      airdropReceived: user.airdropReceived,
    },
    wallet: p,
    registeredWallets: Object.keys(wallets).length,
    totalPending: Object.values(points).reduce((s, x) => s + x.pending, 0),
    hmc: HMC,
  });
}
