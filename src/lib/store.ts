// JSONファイルストア(原子書き込み)
import { readFileSync, writeFileSync, mkdirSync, renameSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
mkdirSync(DATA_DIR, { recursive: true });

export function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson<T>(file: string, data: T): void {
  const p = path.join(DATA_DIR, file);
  const tmp = p + ".tmp";
  writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  renameSync(tmp, p);
}

export interface WalletEntry {
  address: string;
  registeredAt: string;
  airdropReceived: boolean; // エアドロ送金済みか
  airdropAmount: number; // 受け取る予定/受け取ったHMC
}

export interface BonusEntry {
  date: string; // YYYY-MM-DD
  address: string;
  amount: number;
  at: string;
}

export interface LotteryEntry {
  address: string;
  result: "win" | "lose";
  amount: number; // 消費額
  prize: number; // 当選時
  at: string;
}

export interface PointEntry {
  address: string;
  pending: number; // 未送金ポイント(HMC)
  sent: number; // 送金済み
  updatedAt: string;
}
