import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { IpsStatus } from "@prisma/client";

/**
 * テスト操作API
 *
 * テスターアカウント（TESTER_EMAILS環境変数で指定）のみ利用可能。
 * ステータスを次に進める / 全リセットする操作を提供する。
 */

const TESTER_EMAILS = (process.env.TESTER_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

function isTesterEmail(email: string): boolean {
  return TESTER_EMAILS.includes(email.toLowerCase());
}

/** ユーザーIDからDBのメールを取得してテスターか判定 */
async function checkIsTester(userId: string): Promise<boolean> {
  if (TESTER_EMAILS.length === 0) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user ? isTesterEmail(user.email) : false;
}

// iPSステータスの順序
const IPS_STATUS_ORDER: IpsStatus[] = [
  "REGISTERED",
  "TERMS_AGREED",
  "SERVICE_APPLIED",
  "SCHEDULE_ARRANGED",
  "BLOOD_COLLECTED",
  "IPS_CREATING",
  "STORAGE_ACTIVE",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  if (!(await checkIsTester(userId))) {
    return NextResponse.json({ error: "テスト機能は利用できません" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body; // "next" | "reset"

  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership) {
    return NextResponse.json({ error: "会員権が見つかりません" }, { status: 404 });
  }

  if (action === "next") {
    // 次のステータスに進める
    const currentIdx = IPS_STATUS_ORDER.indexOf(membership.ipsStatus);
    if (currentIdx === -1 || currentIdx >= IPS_STATUS_ORDER.length - 1) {
      return NextResponse.json({ error: "これ以上進められません" }, { status: 400 });
    }

    const nextStatus = IPS_STATUS_ORDER[currentIdx + 1];
    const now = new Date();
    const updateData: Record<string, unknown> = { ipsStatus: nextStatus };

    // ステータスに応じた追加データ
    if (nextStatus === "SERVICE_APPLIED" && !membership.serviceAppliedAt) {
      updateData.serviceAppliedAt = now;
      updateData.consentSignedAt = now;
      updateData.contractSignedAt = now;
      updateData.contractFormat = "electronic";
    }
    if (nextStatus === "SCHEDULE_ARRANGED") {
      updateData.clinicDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2週間後
      updateData.clinicName = "テストクリニック";
    }
    if (nextStatus === "BLOOD_COLLECTED" || nextStatus === "IPS_CREATING") {
      updateData.ipsCompletedAt = now;
    }
    if (nextStatus === "STORAGE_ACTIVE") {
      updateData.storageStartAt = now;
      if (!membership.ipsCompletedAt) updateData.ipsCompletedAt = now;
    }

    await prisma.$transaction([
      prisma.membership.update({
        where: { userId },
        data: updateData,
      }),
      prisma.statusHistory.create({
        data: {
          userId,
          fromStatus: membership.ipsStatus,
          toStatus: nextStatus,
          note: "テストモード: ステータスを次に進める",
          changedBy: "テストモード",
        },
      }),
    ]);

    // SERVICE_APPLIED の場合、必要な書類と同意も自動設定
    if (nextStatus === "SERVICE_APPLIED") {
      await prisma.user.update({
        where: { id: userId },
        data: { hasAgreedTerms: true, agreedTermsAt: now },
      });
      await prisma.document.updateMany({
        where: { userId, status: "PENDING" },
        data: { status: "SIGNED", signedAt: now },
      });
      // 培養上清液付属分の作成
      const existing = await prisma.cultureFluidOrder.findFirst({
        where: { userId, planType: "iv_drip_1_included" },
      });
      if (!existing) {
        await prisma.cultureFluidOrder.create({
          data: {
            userId,
            planType: "iv_drip_1_included",
            planLabel: "点滴1回分（10ml）※iPSサービス付属",
            totalAmount: 0,
            paymentStatus: "COMPLETED",
            paidAt: now,
            status: "APPLIED",
          },
        });
      }
    }

    // STORAGE_ACTIVE の場合、培養上清液の精製も開始
    if (nextStatus === "STORAGE_ACTIVE") {
      const includedOrder = await prisma.cultureFluidOrder.findFirst({
        where: { userId, planType: "iv_drip_1_included" },
      });
      if (includedOrder && !includedOrder.producedAt) {
        const producedAt = new Date(now);
        producedAt.setMonth(producedAt.getMonth() + 1);
        const expiresAt = new Date(producedAt);
        expiresAt.setMonth(expiresAt.getMonth() + 8);
        await prisma.cultureFluidOrder.update({
          where: { id: includedOrder.id },
          data: { status: "PAYMENT_CONFIRMED", producedAt, expiresAt },
        });
      }
    }

    return NextResponse.json({
      success: true,
      from: membership.ipsStatus,
      to: nextStatus,
    });
  }

  if (action === "reset") {
    // 全リセット
    const now = new Date();

    await prisma.$transaction([
      // ステータスをREGISTEREDに戻す
      prisma.membership.update({
        where: { userId },
        data: {
          ipsStatus: "REGISTERED",
          serviceAppliedAt: null,
          consentSignedAt: null,
          contractSignedAt: null,
          contractFormat: null,
          clinicDate: null,
          clinicName: null,
          clinicAddress: null,
          clinicPhone: null,
          ipsCompletedAt: null,
          storageStartAt: null,
          paymentStatus: "PENDING",
          paidAmount: 0,
          deathWish: null,
        },
      }),
      // 重要事項同意をリセット
      prisma.user.update({
        where: { id: userId },
        data: {
          hasAgreedTerms: false,
          agreedTermsAt: null,
        },
      }),
      // 書類をPENDINGに戻す
      prisma.document.updateMany({
        where: { userId },
        data: { status: "PENDING", signedAt: null },
      }),
      // 培養上清液注文を全削除
      prisma.cultureFluidOrder.deleteMany({
        where: { userId },
      }),
      // ステータス履歴にリセットを記録
      prisma.statusHistory.create({
        data: {
          userId,
          fromStatus: membership.ipsStatus,
          toStatus: "REGISTERED",
          note: "テストモード: 全ステータスをリセット",
          changedBy: "テストモード",
        },
      }),
    ]);

    return NextResponse.json({ success: true, action: "reset" });
  }

  if (action === "admin_skip") {
    // 管理者工程をスキップ（ステップに応じた処理）
    const { stepKey } = body;
    const now = new Date();

    switch (stepKey) {
      case "TERMS_AGREED": {
        // iPS細胞作製適合確認 → TERMS_AGREED
        if (membership.ipsStatus === "REGISTERED") {
          await prisma.$transaction([
            prisma.membership.update({ where: { userId }, data: { ipsStatus: "TERMS_AGREED" } }),
            prisma.statusHistory.create({ data: { userId, fromStatus: "REGISTERED", toStatus: "TERMS_AGREED", note: "テストモード: 適合確認スキップ", changedBy: "テストモード" } }),
          ]);
        }
        return NextResponse.json({ success: true });
      }
      case "CONTRACT_SIGNING": {
        // 契約書署名
        await prisma.membership.update({ where: { userId }, data: { contractSignedAt: now } });
        await prisma.document.updateMany({
          where: { userId, type: "CONSENT_CELL_STORAGE", status: { not: "SIGNED" } },
          data: { status: "SIGNED", signedAt: now },
        });
        return NextResponse.json({ success: true });
      }
      case "PAYMENT_CONFIRMED": {
        // 入金確認
        await prisma.membership.update({
          where: { userId },
          data: { paymentStatus: "COMPLETED", paidAmount: membership.totalAmount },
        });
        // 培養上清液付属分の作成
        const existingIncluded = await prisma.cultureFluidOrder.findFirst({ where: { userId, planType: "iv_drip_1_included" } });
        if (!existingIncluded) {
          await prisma.cultureFluidOrder.create({
            data: {
              userId, planType: "iv_drip_1_included",
              planLabel: "点滴1回分（10ml）※iPSサービス付属",
              totalAmount: 0, paymentStatus: "COMPLETED", paidAt: now, status: "APPLIED",
            },
          });
        }
        return NextResponse.json({ success: true });
      }
      case "CLINIC_CONFIRMED": {
        // 日程確定（2週間後の日付を自動設定）
        const clinicDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        await prisma.membership.update({
          where: { userId },
          data: { clinicDate, clinicName: "テストクリニック", clinicAddress: "東京都港区テスト1-2-3", clinicPhone: "03-0000-0000" },
        });
        return NextResponse.json({ success: true });
      }
      case "BLOOD_COLLECTED": {
        // 問診・採血 → iPS作製中まで自動進行
        const ipsStartDate = new Date(now);
        ipsStartDate.setDate(ipsStartDate.getDate() + 7);
        await prisma.$transaction([
          prisma.membership.update({
            where: { userId },
            data: { ipsStatus: "IPS_CREATING", ipsCompletedAt: ipsStartDate, clinicDate: membership.clinicDate || now },
          }),
          prisma.statusHistory.create({ data: { userId, fromStatus: membership.ipsStatus, toStatus: "BLOOD_COLLECTED", note: "テストモード: 問診・採血スキップ", changedBy: "テストモード" } }),
          prisma.statusHistory.create({ data: { userId, fromStatus: "BLOOD_COLLECTED", toStatus: "IPS_CREATING", note: "テストモード: iPS作製開始", changedBy: "テストモード" } }),
        ]);
        return NextResponse.json({ success: true });
      }
      case "IPS_CREATING": {
        // iPS細胞作製中
        await prisma.$transaction([
          prisma.membership.update({ where: { userId }, data: { ipsStatus: "IPS_CREATING", ipsCompletedAt: now } }),
          prisma.statusHistory.create({ data: { userId, fromStatus: membership.ipsStatus, toStatus: "IPS_CREATING", note: "テストモード: iPS作製中スキップ", changedBy: "テストモード" } }),
        ]);
        return NextResponse.json({ success: true });
      }
      case "STORAGE_ACTIVE": {
        // iPS細胞保管
        await prisma.$transaction([
          prisma.membership.update({
            where: { userId },
            data: { ipsStatus: "STORAGE_ACTIVE", storageStartAt: now, ipsCompletedAt: membership.ipsCompletedAt || now },
          }),
          prisma.statusHistory.create({ data: { userId, fromStatus: membership.ipsStatus, toStatus: "STORAGE_ACTIVE", note: "テストモード: 保管開始", changedBy: "テストモード" } }),
        ]);
        // 培養上清液の精製も開始
        const includedOrder = await prisma.cultureFluidOrder.findFirst({ where: { userId, planType: "iv_drip_1_included" } });
        if (includedOrder && !includedOrder.producedAt) {
          const producedAt = new Date(now); producedAt.setMonth(producedAt.getMonth() + 1);
          const expiresAt = new Date(producedAt); expiresAt.setMonth(expiresAt.getMonth() + 8);
          await prisma.cultureFluidOrder.update({
            where: { id: includedOrder.id },
            data: { status: "PAYMENT_CONFIRMED", producedAt, expiresAt },
          });
        }
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "不明なステップ" }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "不正なアクション" }, { status: 400 });
}

// テスターかどうかの判定 + 現在ステータス情報
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ isTester: false });
  }

  const userId = (session.user as { id: string }).id;
  const result = await checkIsTester(userId);
  if (!result) {
    return NextResponse.json({ isTester: false });
  }

  // 現在のステータス情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      hasAgreedTerms: true,
      isIdIssued: true,
      membership: {
        select: {
          ipsStatus: true,
          paymentStatus: true,
          contractSignedAt: true,
          clinicDate: true,
          clinicName: true,
        },
      },
      documents: {
        select: { type: true, status: true },
      },
    },
  });

  const m = user?.membership;
  const signedDocs = user?.documents?.filter(d => d.status === "SIGNED").map(d => d.type) || [];
  const statusIdx = m ? IPS_STATUS_ORDER.indexOf(m.ipsStatus) : -1;

  // マイページのタイムラインと完全一致する14ステップ
  const steps = [
    { key: "TERMS_AGREED", label: "iPS細胞作製適合確認", actor: "admin" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("TERMS_AGREED") },
    { key: "REGISTERED", label: "メンバーシップ会員ID発行", actor: "admin" as const, done: !!user?.isIdIssued },
    { key: "DOC_IMPORTANT_NOTICE", label: "重要事項説明書兼確認書", actor: "member" as const, done: signedDocs.includes("CONTRACT") || !!user?.hasAgreedTerms },
    { key: "DOC_PRIVACY_CONSENT", label: "個人情報・個人遺伝情報等の取扱いに関する同意", actor: "member" as const, done: signedDocs.includes("PRIVACY_POLICY") || !!user?.hasAgreedTerms },
    { key: "SERVICE_APPLIED", label: "iPSサービス利用申込", actor: "member" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("SERVICE_APPLIED") },
    { key: "CONTRACT_SIGNING", label: "iPSサービス利用契約書署名", actor: "admin" as const, done: !!m?.contractSignedAt },
    { key: "PAYMENT_CONFIRMED", label: "iPSサービス利用契約締結・入金確認", actor: "admin" as const, done: m?.paymentStatus === "COMPLETED" },
    { key: "SCHEDULE_ARRANGED", label: "iPS細胞作製におけるクリニックの日程調整", actor: "member" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("SCHEDULE_ARRANGED") },
    { key: "DOC_CELL_CONSENT", label: "細胞提供・保管同意", actor: "member" as const, done: signedDocs.includes("CELL_STORAGE_CONSENT") },
    { key: "CLINIC_CONFIRMED", label: "日程確定", actor: "admin" as const, done: !!m?.clinicDate },
    { key: "DOC_INFORMED", label: "iPS細胞作製における事前説明・同意", actor: "member" as const, done: signedDocs.includes("INFORMED_CONSENT") },
    { key: "BLOOD_COLLECTED", label: "問診・採血", actor: "admin" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("BLOOD_COLLECTED") },
    { key: "IPS_CREATING", label: "iPS細胞作製中", actor: "admin" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("IPS_CREATING") },
    { key: "STORAGE_ACTIVE", label: "iPS細胞保管", actor: "admin" as const, done: m?.ipsStatus === "STORAGE_ACTIVE" },
  ];

  return NextResponse.json({
    isTester: true,
    ipsStatus: m?.ipsStatus || "REGISTERED",
    steps,
  });
}
