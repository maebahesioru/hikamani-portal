// 秘密鍵の暗号化/復号(AES-256-GCM・パスワード導出鍵)
import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from "crypto";

export function encryptPrivateKey(privateKey: Uint8Array, password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from(privateKey)), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([salt, iv, tag, enc]).toString("base64");
}

export function decryptPrivateKey(payload: string, password: string): Uint8Array | null {
  try {
    const buf = Buffer.from(payload, "base64");
    if (buf.length < 44) return null;
    const salt = buf.subarray(0, 16);
    const iv = buf.subarray(16, 28);
    const tag = buf.subarray(28, 44);
    const enc = buf.subarray(44);
    const key = scryptSync(password, salt, 32);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Uint8Array.from(Buffer.concat([decipher.update(enc), decipher.final()]));
  } catch {
    return null; // パスワード違い・改ざん
  }
}
