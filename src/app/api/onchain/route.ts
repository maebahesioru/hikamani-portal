// オンチェーン残高取得(報酬プール・運営・エアドロの実残高)
import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

export const dynamic = "force-dynamic";

const RPC = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";
const MINT = new PublicKey("DZS1tKGJsgwqYGNMpQw5KpjBqi8shox8SE28vJhNfxM9");

const WALLETS = {
  reward: "EUF7yrVKqBCmyzaZRWLiuC9iJ1hFSD1feWbe17txvqRr",
  ops: "5n46Saahxu1w7TnSSsH367bUSVbp3tZdxHyXpYGF9LMA",
  airdrop: "9DFBv6oZ461aFDhbUobZ1rvoSWkL5rd2HniGCMeUn8nX",
};

export async function GET() {
  const conn = new Connection(RPC, "confirmed");
  const out: Record<string, { address: string; balance: number | null; sol: number }> = {};
  for (const [name, addr] of Object.entries(WALLETS)) {
    const ata = getAssociatedTokenAddressSync(MINT, new PublicKey(addr), false, TOKEN_2022_PROGRAM_ID);
    try {
      const bal = await conn.getTokenAccountBalance(ata);
      out[name] = { address: addr, balance: bal.value.uiAmount, sol: 0 };
    } catch {
      out[name] = { address: addr, balance: null, sol: 0 };
    }
  }
  return NextResponse.json({ mint: MINT.toBase58(), wallets: out, updatedAt: new Date().toISOString() });
}
