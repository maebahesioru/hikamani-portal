// POST /api/captcha/verify — 回答を検証し、正解ならワンタイム解決トークンを返す
import { NextRequest, NextResponse } from "next/server";
import { verifyChallenge, checkQuota, clientIp } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!checkQuota(ip)) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再試行してください" },
      { status: 429 }
    );
  }
  const body = await req.json().catch(() => null);
  const id = String(body?.id || "");
  const selected: string[] = Array.isArray(body?.selected)
    ? body.selected.map((x: unknown) => String(x))
    : [];
  if (!id) {
    return NextResponse.json({ error: "出題IDがありません" }, { status: 400 });
  }
  const r = verifyChallenge(id, selected, ip);
  if (r.ok && r.token) return NextResponse.json({ ok: true, token: r.token });
  return NextResponse.json(
    { ok: false, error: r.error, remaining: r.remaining, expired: r.expired },
    { status: r.expired ? 410 : 400 }
  );
}
