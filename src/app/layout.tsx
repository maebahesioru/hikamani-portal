import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import AuthBar from "./auth-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hikamani Coin (HMC)",
  description: "ヒカマニ・ヒカマー界隈のコミュニティトークンHMCの公式ポータル",
};

const NAV = [
  { href: "/", label: "🏠 ホーム" },
  { href: "/account", label: "👤 アカウント" },
  { href: "/kuji", label: "🎰 くじ" },
  { href: "/vote", label: "🗳 予想投票" },
  { href: "/baccarat", label: "🃏 バカラ" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <AuthProvider>
          <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
            <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 py-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm hover:bg-zinc-800"
                >
                  {n.label}
                </Link>
              ))}
              <div className="ml-auto">
                <AuthBar />
              </div>
            </div>
          </nav>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
