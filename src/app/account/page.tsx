import type { Metadata } from "next";
import AuthPanel from "../auth-panel";

export const metadata: Metadata = {
  title: "アカウント - Hikamani Coin (HMC)",
  description: "ヒカマニコインウォレット: アカウント番号の発行・ログイン・秘密鍵の管理",
};

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold">👤 ヒカマニコインウォレット(アカウント)</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-400">
        16桁のアカウント番号で完結。メールもパスワードも不要
      </p>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <AuthPanel />
      </div>
      <p className="mt-4 text-xs text-zinc-600">
        アカウント番号は「あなたのウォレットの鍵」です。失くすと復旧できません。他人に教えないでください。
      </p>
    </main>
  );
}
