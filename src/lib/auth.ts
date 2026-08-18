// 認証ヘルパー(Mullvad方式: 16桁のアカウント番号のみ・メール/パスワード不要)
import { createHash, randomBytes, scryptSync, timingSafeEqual, randomInt } from "crypto";
import { readJson, writeJson } from "./store";

export interface User {
  accountNumber: string; // 16桁の数字(ログインID・公開しない)
  receiveId: string; // 送受金用の公開ID(6文字・他人に教えてOK)
  salt: string;
  hash: string; // アカウント番号のscryptハッシュ
  passwordHash: string | null; // パスワードのscryptハッシュ(ハイブリッド認証・null=未設定の旧ユーザー)
  solanaAddress: string; // 自動生成されたHMC受け取りアドレス
  encryptedPrivateKey: string | null; // 秘密鍵(パスワードでAES-256-GCM暗号化)
  airdropReceived: boolean;
  airdropAmount: number;
  createdAt: string;
  sessionToken: string | null;
  failCount: number; // ログイン失敗回数(レート制限用)
  lockUntil: number | null; // ロック解除時刻(epoch ms)
}

// 受取ID生成(6文字・英数字小文字・送金先の指定に使う公開識別子)
export function generateReceiveId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[randomInt(0, chars.length)];
  return s;
}

export function hashAccountNumber(accountNumber: string, salt: string): string {
  return scryptSync(accountNumber, salt, 64).toString("hex");
}

export function verifyAccountNumber(accountNumber: string, salt: string, expected: string): boolean {
  const actual = Buffer.from(hashAccountNumber(accountNumber, salt), "hex");
  const exp = Buffer.from(expected, "hex");
  return actual.length === exp.length && timingSafeEqual(actual, exp);
}

// パスワードのハッシュ/検証(ハイブリッド認証用)
export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password: string, salt: string, expected: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const exp = Buffer.from(expected, "hex");
  return actual.length === exp.length && timingSafeEqual(actual, exp);
}

// Mullvad方式: 16桁の数字をランダム生成(1000 0000 0000 0000 〜 9999 9999 9999 9999)
export function generateAccountNumber(): string {
  let n = "";
  for (let i = 0; i < 16; i++) {
    n += String(randomInt(0, 10));
  }
  return n;
}

export function formatAccountNumber(n: string): string {
  // 4桁区切り表示用(1234 5678 9012 3456)
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function getUsers(): Record<string, User> {
  return readJson<Record<string, User>>("users.json", {});
}

export function saveUsers(users: Record<string, User>): void {
  writeJson("users.json", users);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Authorization: Bearer <token> からユーザーを解決
export function userFromToken(token: string | null): User | null {
  if (!token) return null;
  const users = getUsers();
  for (const u of Object.values(users)) {
    if (u.sessionToken === token) return u;
  }
  return null;
}

export function userFromRequest(authHeader: string | null): User | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return userFromToken(authHeader.slice(7).trim());
}

// レート制限: 5回失敗で10分ロック
export function checkLock(user: User): string | null {
  if (user.lockUntil && Date.now() < user.lockUntil) {
    const remain = Math.ceil((user.lockUntil - Date.now()) / 60000);
    return `試行回数が多すぎます。${remain}分後に再試行してください`;
  }
  return null;
}

export function recordFailure(user: User): void {
  user.failCount = (user.failCount || 0) + 1;
  if (user.failCount >= 5) {
    user.lockUntil = Date.now() + 10 * 60 * 1000; // 10分ロック
    user.failCount = 0;
  }
}
