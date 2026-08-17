// 認証ヘルパー(ユーザー名+パスワード・サイト内ウォレット)
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { readJson, writeJson } from "./store";

export interface User {
  username: string;
  salt: string;
  hash: string;
  solanaAddress: string; // 自動生成されたHMC受け取りアドレス
  airdropReceived: boolean;
  airdropAmount: number;
  createdAt: string;
  sessionToken: string | null;
}

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

export function verifyPassword(password: string, salt: string, expected: string): boolean {
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  const exp = Buffer.from(expected, "hex");
  return actual.length === exp.length && timingSafeEqual(actual, exp);
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
