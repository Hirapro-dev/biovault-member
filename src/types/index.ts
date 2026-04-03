import type { IpsStatus, PaymentStatus, DocumentStatus, DocumentType, TreatmentType, Role } from "@prisma/client";

export type { IpsStatus, PaymentStatus, DocumentStatus, DocumentType, TreatmentType, Role };

// iPS ステータスの日本語ラベル
export const IPS_STATUS_LABELS: Record<IpsStatus, string> = {
  REGISTERED: "メンバー登録",
  TERMS_AGREED: "iPS細胞作製適合確認",
  SERVICE_APPLIED: "サービス申込",
  SCHEDULE_ARRANGED: "日程調整",
  BLOOD_COLLECTED: "問診・採血",
  IPS_CREATING: "iPS細胞 作製中",
  STORAGE_ACTIVE: "iPS細胞 保管中",
  STORAGE_EXPIRED: "保管期間満了",
  // 旧enum値（マイグレーション互換用）
  APPLICATION: "お申込み",
  CONTRACT_SIGNED: "ご契約締結",
  CLINIC_RESERVED: "クリニック予約済",
  IPS_COMPLETED: "iPS細胞 作製完了",
};

// ステータスの順序（タイムライン表示用 — 新7段階）
export const IPS_STATUS_ORDER: IpsStatus[] = [
  "REGISTERED",
  "TERMS_AGREED",
  "SERVICE_APPLIED",
  "SCHEDULE_ARRANGED",
  "BLOOD_COLLECTED",
  "IPS_CREATING",
  "STORAGE_ACTIVE",
];

// 購入前ステータス（成約ライン以前）
export const PRE_SERVICE_STATUSES: IpsStatus[] = [
  "REGISTERED",
  "TERMS_AGREED",
];

// 購入後ステータス（成約ライン以降）
export const POST_SERVICE_STATUSES: IpsStatus[] = [
  "SERVICE_APPLIED",
  "SCHEDULE_ARRANGED",
  "BLOOD_COLLECTED",
  "IPS_CREATING",
  "STORAGE_ACTIVE",
];

// ステータスアイコン
export const IPS_STATUS_ICONS: Record<IpsStatus, string> = {
  REGISTERED: "👤",
  TERMS_AGREED: "📋",
  SERVICE_APPLIED: "✍️",
  SCHEDULE_ARRANGED: "📅",
  BLOOD_COLLECTED: "💉",
  IPS_CREATING: "🧬",
  STORAGE_ACTIVE: "🏛️",
  STORAGE_EXPIRED: "⏰",
  // 旧enum値（互換用）
  APPLICATION: "📋",
  CONTRACT_SIGNED: "✍️",
  CLINIC_RESERVED: "🏥",
  IPS_COMPLETED: "✨",
};

// ステータス説明
export const IPS_STATUS_DESCRIPTIONS: Record<IpsStatus, string> = {
  REGISTERED: "メンバー登録が完了しました",
  TERMS_AGREED: "健康状態の確認が完了しました",
  SERVICE_APPLIED: "サービスのお申込みが完了しました",
  SCHEDULE_ARRANGED: "問診・採血の日程を調整中です",
  BLOOD_COLLECTED: "クリニックでの問診・採血が完了しました",
  IPS_CREATING: "お客様のiPS細胞を作製しております",
  STORAGE_ACTIVE: "厳重な管理施設にて安全に保管中です",
  STORAGE_EXPIRED: "保管期間が満了いたしました",
  // 旧enum値（互換用）
  APPLICATION: "会員権のお申込みを受付いたしました",
  CONTRACT_SIGNED: "契約書類への署名が完了しました",
  CLINIC_RESERVED: "採血クリニックの予約が確定しました",
  IPS_COMPLETED: "iPS細胞の作製が完了いたしました",
};

// 入金状況ラベル
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "未入金",
  PARTIAL: "一部入金",
  COMPLETED: "入金完了",
};

// 書類ステータスラベル
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: "未署名",
  SENT: "送付済",
  SIGNED: "署名済",
  ARCHIVED: "アーカイブ",
};

// 書類タイプラベル
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CONTRACT: "重要事項説明書兼確認書",
  PRIVACY_POLICY: "個人情報・個人遺伝情報等の取扱いに関する同意書",
  CONSENT_CELL_STORAGE: "細胞提供・保管同意書",
  INFORMED_CONSENT: "インフォームドコンセント（自家iPS細胞作製に関する説明書兼同意書）",
  SIMPLE_AGREEMENT: "簡易規約",
};

// 書類の表示順序
export const DOCUMENT_TYPE_ORDER: DocumentType[] = [
  "CONTRACT",
  "PRIVACY_POLICY",
  "CONSENT_CELL_STORAGE",
  "INFORMED_CONSENT",
];

// 投与方法ラベル
export const TREATMENT_TYPE_LABELS: Record<TreatmentType, string> = {
  IV_DRIP: "点滴（全身投与）",
  LOCAL_INJECTION: "局所注射",
};

// NextAuth セッション拡張型
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  hasAgreedTerms?: boolean;
}
