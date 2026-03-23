import type { IpsStatus, PaymentStatus, DocumentStatus, DocumentType, TreatmentType, Role } from "@prisma/client";

export type { IpsStatus, PaymentStatus, DocumentStatus, DocumentType, TreatmentType, Role };

// iPS ステータスの日本語ラベル
export const IPS_STATUS_LABELS: Record<IpsStatus, string> = {
  APPLICATION: "お申込み",
  CONTRACT_SIGNED: "ご契約締結",
  CLINIC_RESERVED: "クリニック予約済",
  BLOOD_COLLECTED: "採血完了",
  IPS_CREATING: "iPS細胞 作製中",
  IPS_COMPLETED: "iPS細胞 作製完了",
  STORAGE_ACTIVE: "保管中",
  STORAGE_EXPIRED: "保管期間満了",
};

// ステータスの順序（タイムライン表示用）
export const IPS_STATUS_ORDER: IpsStatus[] = [
  "APPLICATION",
  "CONTRACT_SIGNED",
  "CLINIC_RESERVED",
  "BLOOD_COLLECTED",
  "IPS_CREATING",
  "IPS_COMPLETED",
  "STORAGE_ACTIVE",
];

// ステータスアイコン
export const IPS_STATUS_ICONS: Record<IpsStatus, string> = {
  APPLICATION: "📋",
  CONTRACT_SIGNED: "✍️",
  CLINIC_RESERVED: "🏥",
  BLOOD_COLLECTED: "💉",
  IPS_CREATING: "🧬",
  IPS_COMPLETED: "✨",
  STORAGE_ACTIVE: "🏛️",
  STORAGE_EXPIRED: "⏰",
};

// ステータス説明
export const IPS_STATUS_DESCRIPTIONS: Record<IpsStatus, string> = {
  APPLICATION: "会員権のお申込みを受付いたしました",
  CONTRACT_SIGNED: "契約書類への署名が完了しました",
  CLINIC_RESERVED: "採血クリニックの予約が確定しました",
  BLOOD_COLLECTED: "クリニックでの採血が完了しました",
  IPS_CREATING: "お客様の iPS 細胞を作製しております",
  IPS_COMPLETED: "iPS 細胞の作製が完了いたしました",
  STORAGE_ACTIVE: "厳重な管理施設にて安全に保管中です",
  STORAGE_EXPIRED: "保管期間が満了いたしました",
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
  CONTRACT: "会員契約書（細胞保管委託契約書）",
  CONSENT_CELL_STORAGE: "細胞保管同意書",
  INFORMED_CONSENT: "インフォームドコンセント",
  PRIVACY_POLICY: "個人情報取扱同意書",
  SIMPLE_AGREEMENT: "簡易規約",
};

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
}
