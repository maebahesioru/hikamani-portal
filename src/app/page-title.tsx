"use client";
import { useLang } from "@/lib/lang-context";

export default function PageTitle({ textKey }: { textKey: string }) {
  const { t } = useLang();
  return <h1 className="text-2xl font-bold">{t(textKey)}</h1>;
}
