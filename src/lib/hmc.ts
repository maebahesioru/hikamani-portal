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

// サービスの価格表(ホワイトペーパーv1.0準拠)
export const PRICES = [
  { item: "ヒカマニくじ 1回", price: "100 HMC" },
  { item: "予想投票 1回", price: "50 HMC" },
  { item: "バカラ 最低ベット", price: "50 HMC" },
  { item: "有料note記事 1本", price: "500 HMC〜" },
  { item: "代行投稿 1回", price: "200 HMC" },
  { item: "広告掲載 1枠/週", price: "5,000 HMC" },
  { item: "レンタルサーバー最小", price: "10,000 HMC/月" },
] as const;

// ログインボーナス・くじ設定
export const GAME = {
  bonusPerDay: 10, // ログインボーナス(HMC/日)
  lotteryCost: 100, // くじ1回(HMC)
  lotteryWin: 200, // 当選時(HMC)
  lotteryWinRate: 0.1, // 当選確率10%
} as const;
