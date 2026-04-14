/**
 * ダッシュボード用タイムラインデータ取得ヘルパー
 *
 * 管理者・従業員・代理店の3ロールで共通利用。
 * extraWhere でスコープを制御する。
 */

import prisma from "@/lib/prisma";

// ── iPS ステップ定義（状況別） ──
// actor: "admin" = 管理者対応, "member" = 会員待ち
// note: ダッシュボードに表示する備考（やること）
const IPS_STEPS = [
  { key: "TERMS_AGREED", label: "iPS細胞作製適合確認／IDパス発行", icon: "📋", actor: "admin" as const, note: "健康状態確認し、問題なければIDパス発行" },
  { key: "DOC_IMPORTANT", label: "重要事項説明書兼確認書／個人情報・個人遺伝情報等の取扱いに関する同意", icon: "📜", actor: "member" as const, note: "会員待ち" },
  { key: "DOC_PRIVACY", label: "iPSサービス利用お申込待ち", icon: "✍️", actor: "member" as const, note: "会員待ち" },
  { key: "CONTRACT_SIGNING", label: "iPSサービス利用契約書署名", icon: "📝", actor: "member" as const, note: "会員待ち（契約書署名完了後、PDFをアップ）" },
  { key: "PAYMENT_CONFIRMED", label: "iPSサービス利用契約締結・入金確認", icon: "💰", actor: "member" as const, note: "会員待ち（入金確認後チェック）" },
  { key: "SCHEDULE_ARRANGED", label: "クリニック日程調整／細胞提供・保管同意待ち", icon: "📅", actor: "member" as const, note: "会員待ち（日程調整希望が入ったら、日程調整へ入る）" },
  { key: "CLINIC_CONFIRMED", label: "日程確定待ち", icon: "🏥", actor: "admin" as const, note: "確定した日程を入力" },
  { key: "DOC_INFORMED", label: "iPS細胞作製における事前説明・同意待ち", icon: "📄", actor: "member" as const, note: "会員待ち（問診・採血当日までに実施をさせる）" },
  { key: "BLOOD_COLLECTED", label: "問診・採血", icon: "💉", actor: "admin" as const, note: "問診・採血完了の確認が取れたら完了日を入力" },
  { key: "IPS_CREATING", label: "iPS細胞作製中", icon: "🧬", actor: "admin" as const, note: "iPS細胞作製が開始された日を入力" },
  { key: "STORAGE_ACTIVE", label: "iPS細胞保管", icon: "🏛️", actor: "admin" as const, note: "iPS細胞作製完了日・保管開始日を入力" },
] as const;

// 培養上清液ステップ定義
const CF_STEPS = [
  { key: "APPLIED", label: "追加購入申込", icon: "🧪", actor: "member" as const, note: "会員待ち" },
  { key: "PAYMENT_CONFIRMED", label: "入金確認", icon: "💰", actor: "member" as const, note: "会員待ち（入金確認後チェック）" },
  { key: "PRODUCING", label: "iPS培養上清液の精製", icon: "⚗️", actor: "admin" as const, note: "精製開始されたら開始日を入力" },
  { key: "CLINIC_BOOKING", label: "クリニック予約", icon: "📅", actor: "member" as const, note: "会員待ち（予約希望が入ったら、日程調整に入る）" },
  { key: "INFORMED_AGREED", label: "事前説明・同意", icon: "📄", actor: "member" as const, note: "会員待ち" },
  { key: "RESERVATION_CONFIRMED", label: "予約確定", icon: "🏥", actor: "admin" as const, note: "予約が確定したら、日程とクリニックを入力" },
  { key: "COMPLETED", label: "施術完了", icon: "✓", actor: "admin" as const, note: "施術の完了確認が入ったら日付を入力" },
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
  note: string;
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
  note: string;
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

  // 各ステップの完了判定
  // TERMS_AGREED: 適合確認＋ID発行を統合（両方完了で次へ）
  // DOC_PRIVACY: 重要事項確認＋iPSサービス利用申込を統合
  const isDone = (key: string): boolean => {
    if (key === "TERMS_AGREED") return statusIdx >= DB_ORDER.indexOf("TERMS_AGREED") && isIdIssued;
    if (key === "DOC_IMPORTANT") return (signedDocTypes.includes("CONTRACT") || hasAgreedTerms) && (signedDocTypes.includes("PRIVACY_POLICY") || hasAgreedTerms);
    if (key === "DOC_PRIVACY") return statusIdx >= DB_ORDER.indexOf("SERVICE_APPLIED");
    if (key === "CONTRACT_SIGNING") return !!contractSignedAt;
    if (key === "PAYMENT_CONFIRMED") return paymentStatus === "COMPLETED";
    if (key === "SCHEDULE_ARRANGED") return statusIdx >= DB_ORDER.indexOf("SCHEDULE_ARRANGED");
    if (key === "CLINIC_CONFIRMED") return !!clinicDate;
    if (key === "DOC_INFORMED") return signedDocTypes.includes("INFORMED_CONSENT");
    if (key === "BLOOD_COLLECTED") return statusIdx >= DB_ORDER.indexOf("BLOOD_COLLECTED");
    if (key === "IPS_CREATING") return statusIdx >= DB_ORDER.indexOf("IPS_CREATING");
    if (key === "STORAGE_ACTIVE") return ipsStatus === "STORAGE_ACTIVE";
    return false;
  };

  // 最初の未完了ステップを探す → そのステップに会員がいる（＝次にやるべきこと）
  for (const step of IPS_STEPS) {
    if (!isDone(step.key)) {
      return step.key;
    }
  }

  // 全ステップ完了の場合は最後のステップ
  return IPS_STEPS[IPS_STEPS.length - 1].key;
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
    note: step.note,
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
    note: step.note,
    members: stepMap[step.key],
  }));
}
