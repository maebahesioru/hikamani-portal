"use client";
import Link from "next/link";
import { useLang, LANG_LABELS } from "@/lib/lang-context";
import { LANGS, Lang } from "@/lib/i18n";
import ThemeToggle from "./theme-toggle";
import AuthBar from "./auth-bar";

const NAV = [
  { href: "/", key: "nav_home", emoji: "🏠" },
  { href: "/account", key: "nav_account", emoji: "👤" },
  { href: "/kuji", key: "nav_kuji", emoji: "🎰" },
  { href: "/vote", key: "nav_vote", emoji: "🗳" },
  { href: "/baccarat", key: "nav_baccarat", emoji: "🃏" },
];

export default function NavBar() {
  const { t, lang, setLang } = useLang();
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-zinc-100/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            {n.emoji} {t(n.key)}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="rounded-lg border border-zinc-300 bg-white px-1.5 py-1 text-xs outline-none dark:border-zinc-700 dark:bg-zinc-900"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>{LANG_LABELS[l]}</option>
            ))}
          </select>
          <ThemeToggle />
          <AuthBar />
        </div>
      </div>
    </nav>
  );
}
