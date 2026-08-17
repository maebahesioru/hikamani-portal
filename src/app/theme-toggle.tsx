"use client";
import { useState, useEffect } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("hmc_theme");
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("hmc_theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      className="rounded-lg border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-200 dark:bg-zinc-800"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
