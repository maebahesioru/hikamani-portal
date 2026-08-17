import type { Metadata } from "next";
import AdminPanel from "../admin-panel";

export const metadata: Metadata = {
  title: "管理パネル - Hikamani Coin (HMC)",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">🔐 管理パネル</h1>
      <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">運営専用: テーマ追加・結果確定・登録状況の確認</p>
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40 p-5">
        <AdminPanel />
      </div>
    </main>
  );
}
