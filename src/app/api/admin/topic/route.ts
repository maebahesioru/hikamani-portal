// 投票テーマ追加(管理機能)
import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson, BetTopic } from "@/lib/store";
import { checkAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!checkAdmin(req.headers.get("x-admin-key"))) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const options = (body?.options || []).map((o: string) => String(o).trim()).filter(Boolean);
  if (!title) return NextResponse.json({ error: "テーマ名を入力してください" }, { status: 400 });
  if (options.length < 2) return NextResponse.json({ error: "選択肢を2つ以上入力してください" }, { status: 400 });

  const topics = readJson<BetTopic[]>("topics.json", []);
  const topic: BetTopic = {
    id: `t${Date.now()}`,
    title,
    options,
    status: "open",
    winner: null,
    createdAt: new Date().toISOString(),
  };
  topics.push(topic);
  writeJson("topics.json", topics);
  return NextResponse.json({ ok: true, topic });
}
