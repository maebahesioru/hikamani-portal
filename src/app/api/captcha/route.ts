// GET /api/captcha — ヒカマニCAPTCHAの出題を1つ発行する
import { NextRequest, NextResponse } from "next/server";
import { issueChallenge, checkQuota, clientIp } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  if (!checkQuota(ip)) {
    return NextResponse.json(
      { error: "リクエストが多すぎます。しばらく待ってから再試行してください" },
      { status: 429 }
    );
  }
  const c = await issueChallenge(ip);
  if (!c) {
    return NextResponse.json(
      { error: "問題を準備できませんでした。少し待ってからもう一度お試しください" },
      { status: 502 }
    );
  }
  return NextResponse.json(c);
}
