// 予想投票の結果確定+配当(管理機能)
// 配当方式: ベット総額を的中者で山分け(ベット額に比例)
import { NextRequest, NextResponse } from "next/server";
import { readJson, writeJson, PointEntry, BetEntry, BetTopic } from "@/lib/store";
import { checkAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!checkAdmin(req.headers.get("x-admin-key"))) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const topicId = String(body?.topicId || "");
  const winner = String(body?.winner || "");

  const topics = readJson<BetTopic[]>("topics.json", []);
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) return NextResponse.json({ error: "テーマが見つかりません" }, { status: 404 });
  if (topic.status === "closed") return NextResponse.json({ error: "このテーマは既に確定済みです" }, { status: 400 });
  if (!topic.options.includes(winner)) return NextResponse.json({ error: "無効な選択肢です" }, { status: 400 });

  const bets = readJson<BetEntry[]>("bets.json", []);
  const tBets = bets.filter((b) => b.topicId === topicId);
  const pool = tBets.reduce((s, b) => s + b.amount, 0);
  const winners = tBets.filter((b) => b.option === winner);
  const winnerTotal = winners.reduce((s, b) => s + b.amount, 0);

  // 的中者にプールを山分け(比例配分・小数点切り捨て)
  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const payouts: Record<string, number> = {};
  for (const w of winners) {
    if (winnerTotal === 0) break;
    const share = Math.floor((w.amount / winnerTotal) * pool);
    payouts[w.address] = (payouts[w.address] || 0) + share;
  }
  for (const [addr, share] of Object.entries(payouts)) {
    const p = points[addr] || { address: addr, pending: 0, sent: 0, updatedAt: "" };
    p.pending += share;
    p.updatedAt = new Date().toISOString();
    points[addr] = p;
  }
  writeJson("points.json", points);

  topic.status = "closed";
  topic.winner = winner;
  writeJson("topics.json", topics);

  return NextResponse.json({
    ok: true,
    topic: topic.title,
    winner,
    pool,
    winners: winners.length,
    totalPayout: Object.values(payouts).reduce((s, v) => s + v, 0),
    payouts: Object.fromEntries(Object.entries(payouts).map(([a, v]) => [a.slice(0, 8), v])),
  });
}
