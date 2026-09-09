// ヒカマニCAPTCHA — hikabooru(https://hikabooru.hikamers.app)の実在タグ付き画像を使った
// 「◯◯の画像を全部選んで」式の人間確認(画像選択CAPTCHA)。
//
// 設計メモ:
//  - 出題時、サーバー側だけで正解(どのタイルが対象タグを持つか)を保持する。
//    クライアントへは画像URLとタイルIDしか渡さない。
//  - 正解したらワンタイムの解決トークンを発行(消費されるまで5分・IP紐づけ)。
//    register API がそのトークンを消費してはじめて登録を受け付ける。
//  - hikabooruのAPIは公開なので、決定的なボット耐性は保証されない。
//    用途は「量産スクリプトの抑止 + コミュニティの遊び」。
//  - メモリ保持(単一コンテナ前提)。Coolifyではスケール1なので問題ない。
import { randomBytes } from "crypto";

const HIKABOORU_BASE =
  process.env.HIKABOORU_BASE || "https://hikabooru.hikamers.app";
const HIKABOORU_API = HIKABOORU_BASE + "/api";

export const GRID_SIZE = 9;
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 出題の有効期限
const MAX_ATTEMPTS = 3; // 1出題あたりの回答試行回数
const TOKEN_TTL_MS = 5 * 60 * 1000; // 解決トークンの有効期限
const IP_QUOTA = 15; // IPごとの出題+回答リクエスト上限(窓あたり)
const IP_WINDOW_MS = 10 * 60 * 1000;
const MAX_CHALLENGES = 2000;

export interface PublicTile {
  id: string; // タイル用の不透明ID(投稿IDそのものは隠す)
  url: string; // サムネイルの絶対URL
}

interface StoredTile extends PublicTile {
  postId: number;
  target: boolean; // 正解タイルか(サーバー側のみ保持)
}

interface Challenge {
  id: string;
  prompt: string;
  createdAt: number;
  tiles: StoredTile[];
  attempts: number;
  ip: string;
}

interface SolveToken {
  ip: string;
  exp: number;
}

interface IpCount {
  n: number;
  resetAt: number;
}

const challenges = new Map<string, Challenge>();
const tokens = new Map<string, SolveToken>();
const ipCounts = new Map<string, IpCount>();

// ---- hikabooru API ----

interface HkPost {
  id: number;
  thumbnailUrl?: string | null;
  tags?: { names?: string[] }[];
}

async function hkFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(HIKABOORU_API + path, {
      headers: { "user-agent": "hikamani-portal-captcha/1.0" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// タグで遊べる「タグそのものがお題」なので、人間が画像を見て判断できるように
// 視覚的な内容タグを優先する。数値・ユーザー名・URL等のメタタグは除外。
const HAS_JP = /[\u3040-\u30ff\u3400-\u9fff]/; // ひらがな/カタカナ/漢字
const JUNK_TAG: RegExp[] = [
  /^[\d０-９]+$/, // 数字のみ
  /^[0-9a-z]{1,3}$/i, // 短い英数
  /[()（）]/,
  /user/i,
  /https?:|www\.|\.com|\.net|youtube|pixiv/i,
  /@/,
  /^[\s\-_/\\]+$/,
];

function usableTag(t: string): boolean {
  if (!t || t.length < 2) return false;
  if (!HAS_JP.test(t)) return false; // 記述タグは日本語主体のbooruのため
  return !JUNK_TAG.some((re) => re.test(t));
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function absUrl(u: string): string {
  return /^https?:\/\//.test(u) ? u : HIKABOORU_BASE + (u.startsWith("/") ? u : "/" + u);
}

// ---- 出題 ----

// お題に使うには広すぎる/抽象的すぎるタグ(ほぼ全画像につく等)は除外。
const EXCLUDE_TAGS = new Set([
  "男性",
  "女性",
  "実写",
  "現実の生活",
  "現実的で",
  "写真背景",
  "複数の視点",
  "字幕",
  "ミーム",
  "おじいちゃん向けコンテンツ",
  "なんだって",
  "食べ物",
  "1人の少年",
  "2人の男児",
  "立ち姿",
]);

// 使い物になる「お題」タグかどうか:
// 視覚的に画像から判断できる名詞系(カタカナ/漢字含む)を優先。
// 文章の断片・翻訳依頼系メタタグ・かなのみ等は人間が解けないので除外。
const HAS_KATAKANA_OR_KANJI = /[\u30a1-\u30f6\u3400-\u9fff]/;
const STOP_TAG = /ください|チェック|翻訳|依頼|解説|説明|聞いてみ|なので|じゃない|です|ます|ました|じゃん|ってしま|どうぞ|の巻|つけよう/;

function questionableTag(t: string): boolean {
  if (!usableTag(t)) return false;
  if (/\s/.test(t)) return false;
  if (EXCLUDE_TAGS.has(t)) return false;
  if (!HAS_KATAKANA_OR_KANJI.test(t)) return false; // ひらがなのみは除外
  if (STOP_TAG.test(t)) return false;
  return true;
}

// safe画像投稿(約30,500件)をランダムなoffset位置から1バッチ引く。
// sort:randomは同じ辺りの画像ばかり返すことがあるので、offsetをランダムにして分散させる。
interface PostLite {
  id: number;
  url: string;
  tags: Set<string>;
}

async function fetchRandomImageBatch(limit: number): Promise<PostLite[]> {
  const offset = Math.floor(Math.random() * 29500); // 総件数の手前まで
  const qq = encodeURIComponent("safety:safe type:image");
  const d = await hkFetch<{ results?: HkPost[] }>(
    `/posts?query=${qq}&limit=${limit}&offset=${offset}&fields=id,thumbnailUrl,tags`
  );
  return (d?.results || [])
    .filter((p) => p && p.id && p.thumbnailUrl)
    .map((p) => ({
      id: p.id,
      url: absUrl(p.thumbnailUrl as string),
      tags: new Set(
        (p.tags || []).map((t) => (t.names && t.names[0]) || "").filter(Boolean)
      ),
    }));
}

// 1) ランダムな画像バッチから、2〜4枚に付いている日本語タグを1つお題に選ぶ
// 2) そのタグの画像=正解タイル、それ以外=ダミータイルで9枚グリッドを作る
async function makeChallenge(ip: string): Promise<Challenge | null> {
  for (let i = 0; i < 12; i++) {
    const batch = await fetchRandomImageBatch(16);
    if (batch.length < GRID_SIZE) continue;

    // タグ登場回数(使い物になるタグのみカウント)
    const counts = new Map<string, number>();
    for (const p of batch) {
      for (const t of p.tags) {
        if (!questionableTag(t)) continue;
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }

    // 2〜4枚登場するタグの候補から重み付きランダム選択(出現数が多い方をやや優先)
    const candidates: { tag: string; n: number }[] = [];
    for (const [tag, n] of counts) {
      if (n >= 2 && n <= 4) candidates.push({ tag, n });
    }
    if (!candidates.length) continue;
    const roulette: string[] = [];
    for (const c of candidates) for (let k = 0; k < c.n; k++) roulette.push(c.tag);
    const tag = roulette[Math.floor(Math.random() * roulette.length)];
    const tagCount = counts.get(tag) || 2;

    const targets = batch.filter((p) => p.tags.has(tag)).slice(0, tagCount);
    const rest = batch.filter((p) => !p.tags.has(tag));
    if (rest.length < GRID_SIZE - targets.length) continue;
    const distractors = shuffle(rest).slice(0, GRID_SIZE - targets.length);

    const tiles: StoredTile[] = shuffle([
      ...targets.map((p) => ({
        id: randomBytes(6).toString("hex"),
        postId: p.id,
        url: p.url,
        target: true,
      })),
      ...distractors.map((p) => ({
        id: randomBytes(6).toString("hex"),
        postId: p.id,
        url: p.url,
        target: false,
      })),
    ]);

    return {
      id: randomBytes(8).toString("hex"),
      prompt: tag,
      createdAt: Date.now(),
      tiles,
      attempts: 0,
      ip,
    };
  }
  return null;
}

// ---- IPクォータ ----

export function checkQuota(ip: string): boolean {
  const now = Date.now();
  const c = ipCounts.get(ip);
  if (!c || now >= c.resetAt) {
    ipCounts.set(ip, { n: 1, resetAt: now + IP_WINDOW_MS });
    return true;
  }
  if (c.n >= IP_QUOTA) return false;
  c.n += 1;
  return true;
}

// ---- 公開API向けヘルパー ----

export interface IssuedChallenge {
  id: string;
  prompt: string;
  tiles: PublicTile[];
}

export async function issueChallenge(ip: string): Promise<IssuedChallenge | null> {
  sweep();
  // 同一IPの古い未使用出題は捨てる(溜め込み防止)
  for (const [id, c] of challenges) {
    if (c.ip === ip) challenges.delete(id);
  }
  const c = await makeChallenge(ip);
  if (!c) return null;
  challenges.set(c.id, c);
  return {
    id: c.id,
    prompt: c.prompt,
    tiles: c.tiles.map((t) => ({ id: t.id, url: t.url })),
  };
}

export interface VerifyResult {
  ok: boolean;
  token?: string;
  remaining?: number;
  expired?: boolean;
  error?: string;
}

export function verifyChallenge(
  id: string,
  selected: string[],
  ip: string
): VerifyResult {
  sweep();
  const c = challenges.get(id);
  if (!c) {
    return { ok: false, expired: true, error: "出題が見つかりません。もう一度やり直してください" };
  }
  if (Date.now() - c.createdAt > CHALLENGE_TTL_MS) {
    challenges.delete(id);
    return { ok: false, expired: true, error: "出題の期限が切れました。もう一度やり直してください" };
  }
  if (c.ip !== ip) {
    challenges.delete(id);
    return { ok: false, expired: true, error: "不正なリクエストです" };
  }
  if (c.attempts >= MAX_ATTEMPTS) {
    challenges.delete(id);
    return { ok: false, expired: true, error: "試行回数を超えました。新しい問題に挑戦してください" };
  }

  const expected = new Set(c.tiles.filter((t) => t.target).map((t) => t.id));
  const got = new Set(selected || []);
  const correct =
    expected.size === got.size && [...expected].every((x) => got.has(x));

  if (correct) {
    challenges.delete(id);
    const token = randomBytes(24).toString("hex");
    tokens.set(token, { ip, exp: Date.now() + TOKEN_TTL_MS });
    return { ok: true, token };
  }

  c.attempts += 1;
  const remaining = MAX_ATTEMPTS - c.attempts;
  if (remaining <= 0) {
    challenges.delete(id);
    return { ok: false, expired: true, error: "不正解です。新しい問題に挑戦してください" };
  }
  return {
    ok: false,
    remaining,
    error: `違う画像が混ざっています(あと${remaining}回)。選び直してください`,
  };
}

// 解決トークンを消費(register APIから呼ぶ)。成功時のみ true(ワンタイム)。
export function consumeSolveToken(token: string | undefined | null, ip: string): boolean {
  if (!token) return false;
  sweep();
  const t = tokens.get(token);
  if (!t) return false;
  tokens.delete(token); // 一度使ったら即無効(失敗でも再使用不可)
  if (Date.now() > t.exp) return false;
  if (t.ip !== ip) return false;
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}

// 期限切れチャレンジ/トークンの掃除(各リクエストで遅延実行)
function sweep(): void {
  const now = Date.now();
  for (const [id, c] of challenges) {
    if (now - c.createdAt > CHALLENGE_TTL_MS) challenges.delete(id);
  }
  for (const [tk, t] of tokens) {
    if (now > t.exp) tokens.delete(tk);
  }
  if (challenges.size > MAX_CHALLENGES) {
    const sorted = [...challenges.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    for (const [id] of sorted.slice(0, sorted.length - MAX_CHALLENGES)) {
      challenges.delete(id);
    }
  }
}
