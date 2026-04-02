/**
 * RSS媒体名 → ロゴ画像のマッピング
 *
 * 画像は /public/rss/ に配置
 * 媒体名は部分一致で検索（sourceNameに含まれていればマッチ）
 *
 * 新しい媒体を追加する場合：
 * 1. /public/rss/ にロゴ画像を配置
 * 2. 下記のSOURCE_LOGOSに { keyword: "媒体名の一部", logo: "/rss/ファイル名" } を追加
 */
const SOURCE_LOGOS: { keyword: string; logo: string }[] = [
  // 日経系
  { keyword: "日経", logo: "/rss/nikkei.png" },
  { keyword: "日本経済新聞", logo: "/rss/nikkei.png" },
  // Yahoo
  { keyword: "Yahoo", logo: "/rss/yahoo.png" },
  { keyword: "ヤフー", logo: "/rss/yahoo.png" },
  // ダイヤモンド・オンライン
  { keyword: "ダイヤモンド", logo: "/rss/diamondonline.svg" },
  // JBpress
  { keyword: "JBpress", logo: "/rss/jbpress.svg" },
  // 時事通信
  { keyword: "時事", logo: "/rss/jijicom.svg" },
  // ニコニコ
  { keyword: "ニコニコ", logo: "/rss/niconiconews.png" },
];

/**
 * 媒体名からロゴ画像パスを取得
 * マッチしない場合はnullを返す
 */
export function getSourceLogo(sourceName: string): string | null {
  if (!sourceName) return null;
  const match = SOURCE_LOGOS.find((s) => sourceName.includes(s.keyword));
  return match?.logo || null;
}
