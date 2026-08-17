"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LANGS, Lang, LANG_LABELS, DICTS } from "./i18n";

const KEY = "hmc_lang";

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}>({ lang: "ja", setLang: () => {}, t: (k) => k });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ja");

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as Lang | null;
    if (saved && LANGS.includes(saved)) setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(KEY, l);
    document.documentElement.lang = l === "zh-hant" ? "zh-Hant" : l;
  }

  function t(key: string): string {
    return DICTS[lang][key] ?? DICTS.ja[key] ?? key;
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export { LANG_LABELS };
