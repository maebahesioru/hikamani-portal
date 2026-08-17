import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/lang-context";
import { AuthProvider } from "@/lib/auth-context";
import NavBar from "./nav-bar";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <LangProvider>
          <AuthProvider>
            <NavBar />
            {children}
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
