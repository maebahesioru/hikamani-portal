import type { Metadata } from "next";
import AuthPanel from "../auth-panel";
import PageTitle from "../page-title";

export const metadata: Metadata = {
  title: "アカウント - Hikamani Coin (HMC)",
  description: "ヒカマニコインウォレット: アカウント番号の発行・ログイン・秘密鍵の管理",
};

export default function AccountPage() {
  return (
    <main className=" px-4 py-8">
      <PageTitle textKey="account" />
      <p className="mt-1 mb-6 text-sm text-zinc-400">
        16桁のアカウント番号で完結。メールもパスワードも不要
      </p>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 p-5">
        <AuthPanel />
      </div>
      <p className="mt-4 text-xs text-zinc-600">
        アカウント番号は「あなたのウォレットの鍵」です。失くすと復旧できません。他人に教えないでください。
      </p>
    </main>
  );
}
