// ご紹介協力制度: クライアント/サーバー共用のラベル・選択肢定義
// （prisma に依存しないこと — クライアントコンポーネントから import されるため）

export const AFFILIATE_CHANNEL_LABELS: Record<string, string> = {
  NW: "人脈繋がり",
  KAWARA: "KAWARA版",
};

export const AFFILIATE_STATUS_LABELS: Record<string, string> = {
  PENDING: "承認待ち",
  ACTIVE: "有効",
  SUSPENDED: "停止",
};

export const LEAD_CALL_STATUS_LABELS: Record<string, string> = {
  UNCALLED: "未架電",
  CONNECTED: "繋がった",
  NO_ANSWER: "不通",
  RECALL: "再架電予定",
  INVALID: "無効",
};

export const AFFILIATE_REWARD_TYPE_LABELS: Record<string, string> = {
  LEAD: "第一報酬（リード獲得）",
  CONVERSION: "第二報酬（本登録）",
};

export const AFFILIATE_REWARD_STATUS_LABELS: Record<string, string> = {
  PENDING: "承認待ち",
  CONFIRMED: "承認済み",
  PAID: "支払済み",
  CANCELLED: "却下",
};

// リードフォームの年収プルダウン選択肢（一旦の初期案）
export const INCOME_OPTIONS = [
  "〜400万円",
  "400万〜600万円",
  "600万〜800万円",
  "800万〜1,000万円",
  "1,000万〜1,500万円",
  "1,500万〜2,000万円",
  "2,000万円以上",
];
