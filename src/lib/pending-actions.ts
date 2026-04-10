/**
 * 対応が必要な会員アクションの共通ヘルパー
 *
 * 管理者ダッシュボード（/admin）、従業員ダッシュボード（/staff）、
 * 代理店ダッシュボード（/agency）の3箇所で同じロジックを再利用する。
 *
 * 各呼び出し元でスコープ条件（referredByStaff, referredByAgency など）を
 * 追加できるよう、Prisma の where フィルタを受け取る形にしている。
 */

import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type IpsActionItem = {
  userId: string;
  memberNumber: string | null;
  name: string;
  action: string;
  icon: string;
  color: string;
  /** 「対応が必要になった日」（StatusHistory の最新レコード or membership.updatedAt） */
  since: Date;
};

export type CfActionItem = {
  userId: string;
  orderId: string;
  memberNumber: string | null;
  name: string;
  action: string;
  icon: string;
  color: string;
  /** 「対応が必要になった日」（CultureFluidOrder.updatedAt） */
  since: Date;
};

export type PendingActionsResult = {
  ipsActionItems: IpsActionItem[];
  cfActionItems: CfActionItem[];
  totalPendingCount: number;
};

/**
 * 対応が必要な会員を取得して iPS / CF の2リストに分けて返す
 *
 * @param extraWhere - ロール別スコープ追加（例：{ referredByStaff: "S001" }）
 */
export async function getPendingActions(
  extraWhere: Prisma.UserWhereInput = {}
): Promise<PendingActionsResult> {
  // ── iPS作製・保管側 ──
  const ipsPendingUsers = await prisma.user.findMany({
    where: {
      ...extraWhere,
      role: "MEMBER",
      OR: [
        // 適合確認待ち
        { membership: { ipsStatus: "REGISTERED" } },
        // ID発行待ち
        { membership: { ipsStatus: "TERMS_AGREED" }, isIdIssued: false },
        // 契約書署名待ち
        { membership: { ipsStatus: "SERVICE_APPLIED", contractSignedAt: null } },
        // 入金確認待ち
        {
          membership: {
            ipsStatus: "SERVICE_APPLIED",
            contractSignedAt: { not: null },
            paymentStatus: { not: "COMPLETED" },
          },
        },
        // 日程調整中
        { membership: { ipsStatus: "SCHEDULE_ARRANGED", clinicDate: null } },
      ],
    },
    include: {
      membership: true,
      // 「対応が必要になった日」算出用に最新の StatusHistory を取得
      statusHistory: {
        orderBy: { changedAt: "desc" },
        take: 1,
        select: { changedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // ── iPS培養上清液側 ──
  const cfPendingUsers = await prisma.user.findMany({
    where: {
      ...extraWhere,
      role: "MEMBER",
      cultureFluidOrders: {
        some: { status: { in: ["APPLIED", "PRODUCING", "CLINIC_BOOKING"] } },
      },
    },
    include: {
      membership: true,
      cultureFluidOrders: {
        where: { status: { in: ["APPLIED", "PRODUCING", "CLINIC_BOOKING"] } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // ── iPS アクションアイテム構築 ──
  const ipsActionItems: IpsActionItem[] = [];
  for (const u of ipsPendingUsers) {
    const s = u.membership?.ipsStatus;
    // 「対応が必要になった日」: 最新ステータス変更日 → なければ membership.updatedAt → なければ user.updatedAt
    const since =
      u.statusHistory[0]?.changedAt ??
      u.membership?.updatedAt ??
      u.updatedAt;

    const base = {
      userId: u.id,
      memberNumber: u.membership?.memberNumber ?? null,
      name: u.name,
      since,
    };

    if (s === "REGISTERED") {
      ipsActionItems.push({ ...base, action: "適合確認待ち", icon: "📋", color: "text-status-warning" });
    } else if (s === "TERMS_AGREED" && !u.isIdIssued) {
      ipsActionItems.push({ ...base, action: "ID発行待ち", icon: "🔑", color: "text-status-warning" });
    } else if (s === "SERVICE_APPLIED" && !u.membership?.contractSignedAt) {
      ipsActionItems.push({ ...base, action: "契約書署名待ち", icon: "📝", color: "text-status-danger" });
    } else if (s === "SERVICE_APPLIED") {
      ipsActionItems.push({ ...base, action: "入金確認待ち", icon: "💰", color: "text-status-danger" });
    } else if (s === "SCHEDULE_ARRANGED") {
      ipsActionItems.push({ ...base, action: "日程調整リクエスト", icon: "📅", color: "text-gold" });
    }
  }

  // 古い順（since が古い＝対応待ちが長い）でソート
  ipsActionItems.sort((a, b) => a.since.getTime() - b.since.getTime());

  // ── CF アクションアイテム構築 ──
  // 1ユーザーが複数の未完了注文を持つ場合、それぞれを個別アイテム化
  const cfActionItems: CfActionItem[] = [];
  for (const u of cfPendingUsers) {
    for (const cfOrder of u.cultureFluidOrders) {
      // 「対応が必要になった日」: 注文の updatedAt（= 最終ステータス遷移日）
      const base = {
        userId: u.id,
        orderId: cfOrder.id,
        memberNumber: u.membership?.memberNumber ?? null,
        name: u.name,
        since: cfOrder.updatedAt,
      };
      if (cfOrder.status === "APPLIED") {
        cfActionItems.push({ ...base, action: "入金確認待ち", icon: "💰", color: "text-status-warning" });
      } else if (cfOrder.status === "PRODUCING") {
        cfActionItems.push({ ...base, action: "精製・管理保管 手配中", icon: "⚗️", color: "text-gold" });
      } else if (cfOrder.status === "CLINIC_BOOKING") {
        cfActionItems.push({ ...base, action: "クリニック予約手配", icon: "📅", color: "text-gold" });
      }
    }
  }

  cfActionItems.sort((a, b) => a.since.getTime() - b.since.getTime());

  return {
    ipsActionItems,
    cfActionItems,
    totalPendingCount: ipsActionItems.length + cfActionItems.length,
  };
}

/**
 * 日付を「N日前」形式に整形し、経過日数に応じた色クラスを返す
 * 放置期間を一目で判別できるようにするためのヘルパー
 */
export function formatPendingSince(since: Date): {
  label: string;
  colorClass: string;
  days: number;
} {
  const now = Date.now();
  const diffMs = now - since.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let label: string;
  if (days === 0) {
    label = "本日";
  } else if (days === 1) {
    label = "1日前";
  } else {
    label = `${days}日前`;
  }

  // 経過日数に応じた色分け
  // 0-6 日: 通常（グレー）
  // 7-13 日: 警告（黄）
  // 14日以上: 危険（赤）
  let colorClass: string;
  if (days >= 14) {
    colorClass = "text-status-danger";
  } else if (days >= 7) {
    colorClass = "text-status-warning";
  } else {
    colorClass = "text-text-muted";
  }

  return { label, colorClass, days };
}
