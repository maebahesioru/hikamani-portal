// HMC共通定数
export const HMC = {
  mint: "DZS1tKGJsgwqYGNMpQw5KpjBqi8shox8SE28vJhNfxM9",
  decimals: 9,
  supply: "1,000,000,000",
  name: "Hikamani Coin",
  symbol: "HMC",
  solscan: "https://solscan.io/token/DZS1tKGJsgwqYGNMpQw5KpjBqi8shox8SE28vJhNfxM9",
  wallets: {
    treasury: "E89qnpMgQXX7gz8Rp1d5BRRnbw285Xhdpa4nvvEuLdxi",
    reward: "EUF7yrVKqBCmyzaZRWLiuC9iJ1hFSD1feWbe17txvqRr",
    ops: "5n46Saahxu1w7TnSSsH367bUSVbp3tZdxHyXpYGF9LMA",
    airdrop: "9DFBv6oZ461aFDhbUobZ1rvoSWkL5rd2HniGCMeUn8nX",
  },
} as const;

// サービスの価格表(ホワイトペーパーv1.0準拠・available=falseは未実装)
export const PRICES = [
  { item: "ヒカマニくじ 1回", price: "100 HMC", available: true },
  { item: "予想投票 1回", price: "50 HMC", available: true },
  { item: "バカラ 最低ベット", price: "50 HMC", available: true },
  { item: "有料note記事 1本", price: "500 HMC〜", available: false },
  { item: "代行投稿 1回", price: "200 HMC", available: false },
  { item: "広告掲載 1枠/週", price: "5,000 HMC", available: false },
  { item: "レンタルサーバー最小", price: "10,000 HMC/月", available: false },
] as const;

// ヒカマくじ 当選構成(累積確率で抽選・合計100%)
export const GAME_LOTTERIES = [
  { name: "福島賞", prize: 7095110, rate: 0.000003 }, // 0.0003%
  { name: "1等", prize: 10000, rate: 0.000997 },      // 0.0997%
  { name: "2等", prize: 1000, rate: 0.009 },           // 0.9%
  { name: "3等", prize: 500, rate: 0.01 },             // 1%
  { name: "4等", prize: 200, rate: 0.18 },             // 18%
  { name: "5等", prize: 10, rate: 0.8 },               // 80%
] as const;

// ログインボーナス・くじ設定
export const GAME = {
  bonusPerDay: 10, // ログインボーナス(HMC/日)
  lotteryCost: 100, // くじ1回(HMC)
  lotteryWin: 200, // 旧: 当選(互換用)
  lotteryWinRate: 0.1, // 旧: 当選率(互換用)
  lotteries: GAME_LOTTERIES,
};
