// 予想投票(PolyMarket風・HMCベット)
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";
import { readJson, writeJson, PointEntry, BetTopic, BetEntry } from "@/lib/store";

export const dynamic = "force-dynamic";

const BET_COST = 50; // 1票50 HMC(価格表準拠)

export async function GET() {
  let topics = readJson<BetTopic[]>("topics.json", []);
  // テーマが無ければデフォルトを自動生成(コミュニティテーマの例)
  if (topics.length === 0) {
    topics = [
      { id: "t1", title: "ヒカマニコイン(HMC)は界隈に定着する?", options: ["定着する", "定着しない", "わからない"], status: "open", winner: null, createdAt: new Date().toISOString() },
      { id: "t2", title: "今年中にヒカマニくじで大当たり(200 HMC)を引く?", options: ["引く", "引かない"], status: "open", winner: null, createdAt: new Date().toISOString() },
    ];
    writeJson("topics.json", topics);
  }
  const bets = readJson<BetEntry[]>("bets.json", []);
  return NextResponse.json({
    topics: topics.map((t) => {
      const tBets = bets.filter((b) => b.topicId === t.id);
      const counts: Record<string, number> = {};
      for (const o of t.options) counts[o] = 0;
      for (const b of tBets) if (counts[b.option] !== undefined) counts[b.option] += b.amount;
      return { ...t, counts, totalBets: tBets.reduce((s, b) => s + b.amount, 0) };
    }),
  });
}

export async function POST(req: NextRequest) {
  const user = userFromRequest(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const topicId = String(body?.topicId || "");
  const option = String(body?.option || "");

  const topics = readJson<BetTopic[]>("topics.json", []);
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) return NextResponse.json({ error: "投票テーマが見つかりません" }, { status: 404 });
  if (topic.status !== "open") return NextResponse.json({ error: "このテーマは締め切られています" }, { status: 400 });
  if (!topic.options.includes(option)) return NextResponse.json({ error: "無効な選択肢です" }, { status: 400 });

  const points = readJson<Record<string, PointEntry>>("points.json", {});
  const p = points[user.username] || { address: user.solanaAddress, pending: 0, sent: 0, updatedAt: "" };
  if (p.pending < BET_COST) {
    return NextResponse.json({ error: `ポイントが不足しています(投票: ${BET_COST} HMC・現在 ${p.pending} HMC)` }, { status: 400 });
  }
  p.pending -= BET_COST;
  p.updatedAt = new Date().toISOString();
  points[user.username] = p;
  writeJson("points.json", points);

  const bets = readJson<BetEntry[]>("bets.json", []);
  bets.push({ topicId, address: user.username, option, amount: BET_COST, at: new Date().toISOString() });
  writeJson("bets.json", bets);

  return NextResponse.json({ ok: true, topic: topic.title, option, spent: BET_COST, pending: p.pending });
}
