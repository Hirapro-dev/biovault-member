/**
 * ダッシュボード用タイムラインデータ取得ヘルパー
 *
 * 管理者・従業員・代理店の3ロールで共通利用。
 * extraWhere でスコープを制御する。
 */

import prisma from "@/lib/prisma";

// ── iPS 13ステップ定義 ──
// actor: "admin" = 管理者対応, "member" = 会員操作待ち
const IPS_STEPS = [
  { key: "TERMS_AGREED", label: "iPS細胞作製適合確認", icon: "📋", actor: "admin" as const },
  { key: "REGISTERED", label: "メンバーシップ会員ID発行", icon: "🔑", actor: "admin" as const },
  { key: "DOC_PRIVACY", label: "重要事項確認／個人情報取扱同意確認", icon: "📜", actor: "member" as const },
  { key: "SERVICE_APPLIED", label: "iPSサービス利用申込", icon: "✍️", actor: "member" as const },
  { key: "CONTRACT_SIGNING", label: "iPSサービス利用契約書署名", icon: "📝", actor: "admin" as const },
  { key: "PAYMENT_CONFIRMED", label: "iPSサービス利用契約締結・入金確認", icon: "💰", actor: "admin" as const },
  { key: "SCHEDULE_ARRANGED", label: "iPS細胞作製におけるクリニックの日程調整", icon: "📅", actor: "member" as const },
  { key: "DOC_CELL_CONSENT", label: "細胞提供・保管同意", icon: "🧫", actor: "member" as const },
  { key: "CLINIC_CONFIRMED", label: "日程確定", icon: "🏥", actor: "admin" as const },
  { key: "DOC_INFORMED", label: "iPS細胞作製における事前説明・同意", icon: "📄", actor: "member" as const },
  { key: "BLOOD_COLLECTED", label: "問診・採血", icon: "💉", actor: "admin" as const },
  { key: "IPS_CREATING", label: "iPS細胞作製中", icon: "🧬", actor: "admin" as const },
  { key: "STORAGE_ACTIVE", label: "iPS細胞保管", icon: "🏛️", actor: "admin" as const },
] as const;

// 培養上清液ステップ定義
const CF_STEPS = [
  { key: "APPLIED", label: "追加購入申込", icon: "🧪", actor: "member" as const },
  { key: "PAYMENT_CONFIRMED", label: "入金確認", icon: "💰", actor: "admin" as const },
  { key: "PRODUCING", label: "iPS培養上清液の精製", icon: "⚗️", actor: "admin" as const },
  { key: "CLINIC_BOOKING", label: "クリニック予約", icon: "📅", actor: "member" as const },
  { key: "INFORMED_AGREED", label: "事前説明・同意", icon: "📄", actor: "member" as const },
  { key: "RESERVATION_CONFIRMED", label: "予約確定", icon: "🏥", actor: "admin" as const },
  { key: "COMPLETED", label: "施術完了", icon: "✓", actor: "admin" as const },
] as const;

const DB_ORDER = ["REGISTERED", "TERMS_AGREED", "SERVICE_APPLIED", "SCHEDULE_ARRANGED", "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE"];

// ── 型定義 ──
export type TimelineMember = {
  userId: string;
  name: string;
  memberNumber: string;
  contractDate: string | null;
  statusChangedAt: string | null;
  clinicDate: string | null;
  clinicName: string | null;
};

export type TimelineStep = {
  key: string;
  label: string;
  icon: string;
  actor: "admin" | "member";
  members: TimelineMember[];
};

export type CfTimelineMember = {
  userId: string;
  name: string;
  memberNumber: string;
  orderId: string;
  planLabel: string;
  totalAmount: number;
  clinicDate: string | null;
  clinicName: string | null;
  statusChangedAt: string | null;
};

export type CfTimelineStep = {
  key: string;
  label: string;
  icon: string;
  actor: "admin" | "member";
  members: CfTimelineMember[];
};

// ── 各会員が「どのステップにいるか」を判定する ──
function getCurrentStep(
  ipsStatus: string,
  isIdIssued: boolean,
  hasAgreedTerms: boolean,
  signedDocTypes: string[],
  contractSignedAt: Date | null,
  paymentStatus: string,
  clinicDate: Date | null,
): string {
  const statusIdx = DB_ORDER.indexOf(ipsStatus);

  // 各ステップの完了判定（AdminStatusTimelineのisOriginallyDoneと同じロジック）
  const isDone = (key: string): boolean => {
    if (key === "TERMS_AGREED") return statusIdx >= DB_ORDER.indexOf("TERMS_AGREED");
    if (key === "REGISTERED") return isIdIssued;
    if (key === "DOC_PRIVACY") return signedDocTypes.includes("PRIVACY_POLICY") || hasAgreedTerms;
    if (key === "SERVICE_APPLIED") return statusIdx >= DB_ORDER.indexOf("SERVICE_APPLIED");
    if (key === "CONTRACT_SIGNING") return !!contractSignedAt;
    if (key === "PAYMENT_CONFIRMED") return paymentStatus === "COMPLETED";
    if (key === "SCHEDULE_ARRANGED") return statusIdx >= DB_ORDER.indexOf("SCHEDULE_ARRANGED");
    if (key === "DOC_CELL_CONSENT") return signedDocTypes.includes("CELL_STORAGE_CONSENT");
    if (key === "CLINIC_CONFIRMED") return !!clinicDate;
    if (key === "DOC_INFORMED") return signedDocTypes.includes("INFORMED_CONSENT");
    if (key === "BLOOD_COLLECTED") return statusIdx >= DB_ORDER.indexOf("BLOOD_COLLECTED");
    if (key === "IPS_CREATING") return statusIdx >= DB_ORDER.indexOf("IPS_CREATING");
    if (key === "STORAGE_ACTIVE") return ipsStatus === "STORAGE_ACTIVE";
    return false;
  };

  // 最後に完了したステップを探す → そのステップに会員がいる
  let lastDoneStep = "";
  for (const step of IPS_STEPS) {
    if (isDone(step.key)) {
      lastDoneStep = step.key;
    } else {
      break;
    }
  }

  // 全ステップ未完了の場合は最初のステップ
  // 全ステップ完了の場合は最後のステップ
  return lastDoneStep || IPS_STEPS[0].key;
}

const fmtDate = (d: Date | null | undefined) =>
  d ? d.toISOString() : null;

// ── iPS タイムラインデータ取得 ──
export async function getIpsTimeline(
  extraWhere?: Record<string, unknown>
): Promise<TimelineStep[]> {
  const users = await prisma.user.findMany({
    where: { role: "MEMBER", ...extraWhere },
    include: {
      membership: {
        select: {
          ipsStatus: true, paymentStatus: true, contractDate: true,
          contractSignedAt: true, clinicDate: true, clinicName: true,
          memberNumber: true,
        },
      },
      documents: { select: { type: true, status: true } },
      statusHistory: {
        orderBy: { changedAt: "desc" },
        take: 1,
        select: { changedAt: true },
      },
    },
  });

  // ステップごとの会員マップ
  const stepMap: Record<string, TimelineMember[]> = {};
  for (const step of IPS_STEPS) {
    stepMap[step.key] = [];
  }

  for (const user of users) {
    if (!user.membership) continue;
    const m = user.membership;
    const signedDocs = user.documents.filter(d => d.status === "SIGNED").map(d => d.type);

    const currentStep = getCurrentStep(
      m.ipsStatus,
      user.isIdIssued,
      user.hasAgreedTerms,
      signedDocs,
      m.contractSignedAt,
      m.paymentStatus,
      m.clinicDate,
    );

    if (stepMap[currentStep]) {
      stepMap[currentStep].push({
        userId: user.id,
        name: user.name,
        memberNumber: m.memberNumber,
        contractDate: fmtDate(m.contractDate),
        statusChangedAt: fmtDate(user.statusHistory[0]?.changedAt),
        clinicDate: fmtDate(m.clinicDate),
        clinicName: m.clinicName,
      });
    }
  }

  return IPS_STEPS.map(step => ({
    key: step.key,
    label: step.label,
    icon: step.icon,
    actor: step.actor,
    members: stepMap[step.key],
  }));
}

// ── 培養上清液タイムラインデータ取得 ──
export async function getCfTimeline(
  extraWhere?: Record<string, unknown>
): Promise<CfTimelineStep[]> {
  const users = await prisma.user.findMany({
    where: { role: "MEMBER", ...extraWhere },
    include: {
      membership: { select: { memberNumber: true } },
      cultureFluidOrders: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, status: true, planLabel: true, totalAmount: true,
          clinicDate: true, clinicName: true, updatedAt: true,
        },
      },
    },
  });

  const stepMap: Record<string, CfTimelineMember[]> = {};
  for (const step of CF_STEPS) {
    stepMap[step.key] = [];
  }

  for (const user of users) {
    for (const order of user.cultureFluidOrders) {
      if (stepMap[order.status]) {
        stepMap[order.status].push({
          userId: user.id,
          name: user.name,
          memberNumber: user.membership?.memberNumber || "---",
          orderId: order.id,
          planLabel: order.planLabel,
          totalAmount: order.totalAmount,
          clinicDate: fmtDate(order.clinicDate),
          clinicName: order.clinicName,
          statusChangedAt: fmtDate(order.updatedAt),
        });
      }
    }
  }

  return CF_STEPS.map(step => ({
    key: step.key,
    label: step.label,
    icon: step.icon,
    actor: step.actor,
    members: stepMap[step.key],
  }));
}
