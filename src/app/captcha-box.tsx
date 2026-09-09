"use client";
// ヒカマニCAPTCHA(画像選択式)ウィジェット
// hikabooruの画像9枚から「◯◯の画像を全部選んで」で人間確認。
// 正解するとワンタイム解決トークンを onSolved で親へ渡す。
import { useCallback, useEffect, useRef, useState } from "react";

interface Tile {
  id: string;
  url: string;
}

interface Challenge {
  id: string;
  prompt: string;
  tiles: Tile[];
}

type Status = "loading" | "ready" | "checking" | "wrong" | "solved" | "error";

export default function HikabooruCaptcha({
  onSolved,
}: {
  onSolved: (token: string) => void;
}) {
  const [ch, setCh] = useState<Challenge | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<Status>("loading");
  const [msg, setMsg] = useState("");
  const alive = useRef(true);

  const load = useCallback(async () => {
    setStatus("loading");
    setMsg("");
    setSel(new Set());
    setCh(null);
    try {
      const r = await fetch("/api/captcha", { cache: "no-store" });
      const j = await r.json();
      if (!alive.current) return;
      if (!r.ok || !j?.tiles?.length) {
        setStatus("error");
        setMsg(j?.error || "問題を取得できませんでした");
        return;
      }
      setCh(j);
      setStatus("ready");
    } catch {
      if (!alive.current) return;
      setStatus("error");
      setMsg("通信エラーが起きました。再試行してください");
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  function toggle(id: string) {
    setSel((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function submit() {
    if (!ch || sel.size === 0 || status === "checking") return;
    setStatus("checking");
    setMsg("");
    try {
      const r = await fetch("/api/captcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ch.id, selected: [...sel] }),
      });
      const j = await r.json();
      if (!alive.current) return;
      if (j?.ok && j?.token) {
        setStatus("solved");
        setMsg("ロボット確認OK!");
        onSolved(j.token);
        return;
      }
      if (j?.expired) {
        setMsg(j?.error || "期限切れです。新しい問題を出します");
        load();
        return;
      }
      setSel(new Set());
      setStatus("wrong");
      setMsg(j?.error || "不正解です。選び直してください");
    } catch {
      if (!alive.current) return;
      setStatus("wrong");
      setMsg("通信エラーが起きました。もう一度お試しください");
    }
  }

  return (
    <div className="mb-3 rounded-lg border border-zinc-700 bg-zinc-900/60 p-3">
      <p className="mb-1 text-xs font-semibold text-zinc-300">
        🤖 ロボットでないことを確認(ヒカマニCAPTCHA)
      </p>
      {status === "solved" ? (
        <p className="text-sm text-emerald-400">✅ {msg}</p>
      ) : (
        <>
          <p className="mb-2 text-xs text-zinc-400">
            下の画像の中から
            <b className="mx-1 text-sky-300">「{ch?.prompt || "…"}」</b>
            の画像を<b className="text-amber-300">全部</b>選んでください
          </p>

          {status === "loading" && (
            <p className="py-6 text-center text-xs text-zinc-500">
              問題を準備中...
            </p>
          )}
          {status === "error" && (
            <p className="py-6 text-center text-xs text-red-400">{msg}</p>
          )}

          {ch && status !== "loading" && status !== "error" && (
            <div className="grid grid-cols-3 gap-2">
              {ch.tiles.map((t) => {
                const on = sel.has(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => status === "ready" && toggle(t.id)}
                    aria-pressed={on}
                    className={`relative aspect-square overflow-hidden rounded-lg border bg-black transition ${
                      on
                        ? "border-sky-300 ring-2 ring-sky-300/70"
                        : "border-zinc-700 hover:border-zinc-500"
                    } ${status !== "ready" ? "opacity-60" : ""}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.url}
                      alt=""
                      loading="lazy"
                      className={`h-full w-full object-cover ${on ? "brightness-90" : ""}`}
                      draggable={false}
                    />
                    {on && (
                      <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={status !== "ready" || sel.size === 0}
              className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "checking" ? "確認中..." : "確認する"}
            </button>
            <button
              type="button"
              onClick={load}
              disabled={status === "loading" || status === "checking"}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-800 disabled:opacity-40"
            >
              別の問題にする
            </button>
            {status === "wrong" && (
              <span className="text-xs text-red-400">{msg}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
