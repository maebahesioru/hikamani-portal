// 管理認証ヘルパー
export function checkAdmin(key: string | null): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  return key === expected;
}
