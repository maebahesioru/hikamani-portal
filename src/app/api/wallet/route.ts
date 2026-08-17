// ウォレット登録 + エアドロップ申請
import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { readJson, writeJson, WalletEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

const AIRDROP_PER_WALLET = 1000; // 1ウォレットあたりのエアドロ(HMC・仮設定)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const address = (body?.address || "").trim();
  // アドレス検証(Solana公開鍵として正当か)
  try {
    new PublicKey(address);
  } catch {
    return NextResponse.json({ error: "無効なウォレットアドレスです" }, { status: 400 });
  }
  const wallets = readJson<Record<string, WalletEntry>>("wallets.json", {});
  if (wallets[address]) {
    return NextResponse.json({ error: "このウォレットは既に登録済みです", registered: true }, { status: 409 });
  }
  wallets[address] = {
    address,
    registeredAt: new Date().toISOString(),
    airdropReceived: false,
    airdropAmount: AIRDROP_PER_WALLET,
  };
  writeJson("wallets.json", wallets);
  return NextResponse.json({ ok: true, address, airdropAmount: AIRDROP_PER_WALLET });
}

export async function GET() {
  const wallets = readJson<Record<string, WalletEntry>>("wallets.json", {});
  return NextResponse.json({ count: Object.keys(wallets).length });
}
