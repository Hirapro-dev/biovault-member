import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { IpsStatus } from "@prisma/client";

const TESTER_EMAILS = (process.env.TESTER_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

async function checkIsTester(userId: string): Promise<boolean> {
  if (TESTER_EMAILS.length === 0) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  return user ? TESTER_EMAILS.includes(user.email.toLowerCase()) : false;
}

const IPS_STATUS_ORDER: IpsStatus[] = [
  "REGISTERED", "TERMS_AGREED", "SERVICE_APPLIED", "SCHEDULE_ARRANGED",
  "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE",
];

// ── POST: アクション実行 ──
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  if (!(await checkIsTester(userId))) return NextResponse.json({ error: "テスト機能は利用できません" }, { status: 403 });

  const body = await req.json();
  const { action, flow, stepKey } = body;

  const membership = await prisma.membership.findUnique({ where: { userId } });
  if (!membership) return NextResponse.json({ error: "会員権が見つかりません" }, { status: 404 });

  // ── リセット ──
  if (action === "reset") {
    await prisma.$transaction([
      prisma.membership.update({
        where: { userId },
        data: {
          ipsStatus: "REGISTERED", serviceAppliedAt: null, consentSignedAt: null,
          contractSignedAt: null, contractFormat: null, clinicDate: null,
          clinicName: null, clinicAddress: null, clinicPhone: null,
          ipsCompletedAt: null, storageStartAt: null, paymentStatus: "PENDING",
          paidAmount: 0, deathWish: null,
        },
      }),
      prisma.user.update({ where: { id: userId }, data: { hasAgreedTerms: false, agreedTermsAt: null } }),
      prisma.document.updateMany({ where: { userId }, data: { status: "PENDING", signedAt: null } }),
      prisma.cultureFluidOrder.deleteMany({ where: { userId } }),
      prisma.statusHistory.create({
        data: { userId, fromStatus: membership.ipsStatus, toStatus: "REGISTERED", note: "テストモード: 全リセット", changedBy: "テストモード" },
      }),
    ]);
    return NextResponse.json({ success: true, message: "リセット完了" });
  }

  // ── フォームからやり直す（アカウント完全削除） ──
  if (action === "reset_full") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const email = user?.email || "";

    await prisma.$transaction([
      prisma.accessLog.deleteMany({ where: { userId } }),
      prisma.adminNote.deleteMany({ where: { userId } }),
      prisma.statusHistory.deleteMany({ where: { userId } }),
      prisma.document.deleteMany({ where: { userId } }),
      prisma.favorite.deleteMany({ where: { userId } }),
      prisma.consentLog.deleteMany({ where: { userId } }),
      prisma.contentUpdateRead.deleteMany({ where: { userId } }),
      prisma.pushSubscription.deleteMany({ where: { userId } }),
      prisma.cultureFluidOrder.deleteMany({ where: { userId } }),
      prisma.treatment.deleteMany({ where: { membershipId: membership.id } }),
      prisma.membership.delete({ where: { userId } }),
      prisma.application.deleteMany({ where: { email } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ success: true, message: "アカウント削除完了" });
  }

  // ── iPS admin_skip ──
  if (action === "admin_skip" && flow === "ips") {
    const now = new Date();
    switch (stepKey) {
      case "TERMS_AGREED":
        if (membership.ipsStatus === "REGISTERED") {
          await prisma.$transaction([
            prisma.membership.update({ where: { userId }, data: { ipsStatus: "TERMS_AGREED" } }),
            prisma.statusHistory.create({ data: { userId, fromStatus: "REGISTERED", toStatus: "TERMS_AGREED", note: "テスト: 適合確認スキップ", changedBy: "テストモード" } }),
          ]);
        }
        return NextResponse.json({ success: true, message: "適合確認 → 完了" });
      case "CONTRACT_SIGNING":
        await prisma.membership.update({ where: { userId }, data: { contractSignedAt: now } });
        await prisma.document.updateMany({ where: { userId, type: "CONSENT_CELL_STORAGE", status: { not: "SIGNED" } }, data: { status: "SIGNED", signedAt: now } });
        return NextResponse.json({ success: true, message: "契約書署名 → 完了" });
      case "PAYMENT_CONFIRMED":
        await prisma.membership.update({ where: { userId }, data: { paymentStatus: "COMPLETED", paidAmount: membership.totalAmount } });
        const existing = await prisma.cultureFluidOrder.findFirst({ where: { userId, planType: "iv_drip_1_included" } });
        if (!existing) {
          await prisma.cultureFluidOrder.create({
            data: { userId, planType: "iv_drip_1_included", planLabel: "点滴1回分（10ml）※iPSサービス付属", totalAmount: 0, paymentStatus: "COMPLETED", paidAt: now, status: "APPLIED" },
          });
        }
        return NextResponse.json({ success: true, message: "入金確認 → 完了" });
      case "CLINIC_CONFIRMED": {
        const cd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        await prisma.membership.update({ where: { userId }, data: { clinicDate: cd, clinicName: "テストクリニック", clinicAddress: "東京都港区テスト1-2-3", clinicPhone: "03-0000-0000" } });
        return NextResponse.json({ success: true, message: "日程確定 → 完了" });
      }
      case "BLOOD_COLLECTED": {
        const start = new Date(now); start.setDate(start.getDate() + 7);
        await prisma.$transaction([
          prisma.membership.update({ where: { userId }, data: { ipsStatus: "IPS_CREATING", ipsCompletedAt: start, clinicDate: membership.clinicDate || now } }),
          prisma.statusHistory.create({ data: { userId, fromStatus: membership.ipsStatus, toStatus: "BLOOD_COLLECTED", note: "テスト: 問診・採血スキップ", changedBy: "テストモード" } }),
          prisma.statusHistory.create({ data: { userId, fromStatus: "BLOOD_COLLECTED", toStatus: "IPS_CREATING", note: "テスト: iPS作製開始", changedBy: "テストモード" } }),
        ]);
        return NextResponse.json({ success: true, message: "問診・採血 → iPS作製中" });
      }
      case "IPS_CREATING":
        await prisma.$transaction([
          prisma.membership.update({ where: { userId }, data: { ipsStatus: "IPS_CREATING", ipsCompletedAt: now } }),
          prisma.statusHistory.create({ data: { userId, fromStatus: membership.ipsStatus, toStatus: "IPS_CREATING", note: "テスト: iPS作製中スキップ", changedBy: "テストモード" } }),
        ]);
        return NextResponse.json({ success: true, message: "iPS作製中 → 完了" });
      case "STORAGE_ACTIVE":
        await prisma.$transaction([
          prisma.membership.update({ where: { userId }, data: { ipsStatus: "STORAGE_ACTIVE", storageStartAt: now, ipsCompletedAt: membership.ipsCompletedAt || now } }),
          prisma.statusHistory.create({ data: { userId, fromStatus: membership.ipsStatus, toStatus: "STORAGE_ACTIVE", note: "テスト: 保管開始", changedBy: "テストモード" } }),
        ]);
        const incl = await prisma.cultureFluidOrder.findFirst({ where: { userId, planType: "iv_drip_1_included" } });
        if (incl && !incl.producedAt) {
          const pa = new Date(now); pa.setMonth(pa.getMonth() + 1);
          const ea = new Date(pa); ea.setMonth(ea.getMonth() + 8);
          await prisma.cultureFluidOrder.update({ where: { id: incl.id }, data: { status: "PAYMENT_CONFIRMED", producedAt: pa, expiresAt: ea } });
        }
        return NextResponse.json({ success: true, message: "iPS細胞保管 → 完了" });
    }
  }

  // ── 培養上清液 admin_skip ──
  if (action === "admin_skip" && flow === "cf") {
    const order = await prisma.cultureFluidOrder.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    if (!order) return NextResponse.json({ error: "培養上清液の注文がありません" }, { status: 400 });
    const now = new Date();

    switch (stepKey) {
      case "CF_PAYMENT":
        await prisma.cultureFluidOrder.update({ where: { id: order.id }, data: { paymentStatus: "COMPLETED", paidAt: now, status: "PAYMENT_CONFIRMED" } });
        return NextResponse.json({ success: true, message: "入金確認 → 完了" });
      case "CF_PRODUCING": {
        const pa = new Date(now); const ea = new Date(pa); ea.setMonth(ea.getMonth() + 8);
        await prisma.cultureFluidOrder.update({ where: { id: order.id }, data: { producedAt: pa, expiresAt: ea, status: "PRODUCING" } });
        return NextResponse.json({ success: true, message: "精製完了" });
      }
      case "CF_CLINIC":
        await prisma.cultureFluidOrder.update({ where: { id: order.id }, data: { status: "CLINIC_BOOKING" } });
        return NextResponse.json({ success: true, message: "クリニック予約 → 完了" });
      case "CF_INFORMED":
        await prisma.cultureFluidOrder.update({ where: { id: order.id }, data: { informedAgreedAt: now, status: "INFORMED_AGREED" } });
        return NextResponse.json({ success: true, message: "事前説明同意 → 完了" });
      case "CF_RESERVATION": {
        const cd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        await prisma.cultureFluidOrder.update({
          where: { id: order.id },
          data: { clinicDate: cd, clinicName: "テストクリニック", clinicAddress: "東京都港区テスト1-2-3", clinicPhone: "03-0000-0000", status: "RESERVATION_CONFIRMED" },
        });
        return NextResponse.json({ success: true, message: "予約確定 → 完了" });
      }
      case "CF_COMPLETED": {
        const total = order.planType.includes("5") ? 6 : 1;
        const dates: string[] = order.sessionDates ? JSON.parse(order.sessionDates) : [];
        dates.push(now.toISOString().split("T")[0]);
        const newSessions = order.completedSessions + 1;
        await prisma.cultureFluidOrder.update({
          where: { id: order.id },
          data: {
            completedAt: now, completedSessions: newSessions,
            sessionDates: JSON.stringify(dates),
            status: newSessions >= total ? "COMPLETED" : "CLINIC_BOOKING",
            ...(newSessions < total ? { clinicDate: null, clinicName: null, clinicAddress: null, clinicPhone: null, informedAgreedAt: null } : {}),
          },
        });
        return NextResponse.json({ success: true, message: `施術完了（${newSessions}/${total}回）` });
      }
    }
  }

  // ── 1つ戻る ──
  if (action === "back") {
    const now = new Date();

    if (flow === "ips") {
      // iPSステップを1つ戻す
      const { ipsSteps } = await buildSteps(userId);
      const lastDoneIdx = ipsSteps.map((s, i) => s.done ? i : -1).filter(i => i >= 0).pop();
      if (lastDoneIdx === undefined || lastDoneIdx < 0) return NextResponse.json({ error: "これ以上戻れません" }, { status: 400 });
      const lastDone = ipsSteps[lastDoneIdx];

      switch (lastDone.key) {
        case "TERMS_AGREED":
          await prisma.membership.update({ where: { userId }, data: { ipsStatus: "REGISTERED" } });
          break;
        case "REGISTERED":
          // ID発行は戻さない（ログインできなくなるため）
          return NextResponse.json({ error: "ID発行は戻せません" }, { status: 400 });
        case "DOC_IMPORTANT_NOTICE":
        case "DOC_PRIVACY_CONSENT":
          await prisma.user.update({ where: { id: userId }, data: { hasAgreedTerms: false, agreedTermsAt: null } });
          await prisma.document.updateMany({ where: { userId, type: { in: ["CONTRACT", "PRIVACY_POLICY"] } }, data: { status: "PENDING", signedAt: null } });
          break;
        case "SERVICE_APPLIED":
          await prisma.membership.update({ where: { userId }, data: { ipsStatus: "TERMS_AGREED", serviceAppliedAt: null, consentSignedAt: null } });
          await prisma.document.updateMany({ where: { userId, type: "SERVICE_TERMS" }, data: { status: "PENDING", signedAt: null } });
          await prisma.cultureFluidOrder.deleteMany({ where: { userId, planType: "iv_drip_1_included" } });
          break;
        case "CONTRACT_SIGNING":
          await prisma.membership.update({ where: { userId }, data: { contractSignedAt: null } });
          await prisma.document.updateMany({ where: { userId, type: "CONSENT_CELL_STORAGE" }, data: { status: "PENDING", signedAt: null } });
          break;
        case "PAYMENT_CONFIRMED":
          await prisma.membership.update({ where: { userId }, data: { paymentStatus: "PENDING", paidAmount: 0 } });
          break;
        case "SCHEDULE_ARRANGED":
          await prisma.membership.update({ where: { userId }, data: { ipsStatus: "SERVICE_APPLIED" } });
          break;
        case "DOC_CELL_CONSENT":
          await prisma.document.updateMany({ where: { userId, type: "CELL_STORAGE_CONSENT" }, data: { status: "PENDING", signedAt: null } });
          break;
        case "CLINIC_CONFIRMED":
          await prisma.membership.update({ where: { userId }, data: { clinicDate: null, clinicName: null, clinicAddress: null, clinicPhone: null } });
          break;
        case "DOC_INFORMED":
          await prisma.document.updateMany({ where: { userId, type: "INFORMED_CONSENT" }, data: { status: "PENDING", signedAt: null } });
          break;
        case "BLOOD_COLLECTED":
        case "IPS_CREATING":
          await prisma.membership.update({ where: { userId }, data: { ipsStatus: "SCHEDULE_ARRANGED", ipsCompletedAt: null } });
          break;
        case "STORAGE_ACTIVE":
          await prisma.membership.update({ where: { userId }, data: { ipsStatus: "IPS_CREATING", storageStartAt: null } });
          const inclOrder = await prisma.cultureFluidOrder.findFirst({ where: { userId, planType: "iv_drip_1_included" } });
          if (inclOrder) await prisma.cultureFluidOrder.update({ where: { id: inclOrder.id }, data: { status: "APPLIED", producedAt: null, expiresAt: null } });
          break;
      }
      await prisma.statusHistory.create({ data: { userId, fromStatus: membership.ipsStatus, toStatus: membership.ipsStatus, note: `テスト: 「${lastDone.label}」を取消`, changedBy: "テストモード" } });
      return NextResponse.json({ success: true, message: `「${lastDone.label}」を取消` });
    }

    if (flow === "cf") {
      const order = await prisma.cultureFluidOrder.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
      if (!order) return NextResponse.json({ error: "注文がありません" }, { status: 400 });

      // ステータスを1つ前に戻す
      const cfStatusOrder = ["APPLIED", "PAYMENT_CONFIRMED", "PRODUCING", "CLINIC_BOOKING", "INFORMED_AGREED", "RESERVATION_CONFIRMED", "COMPLETED"];
      const idx = cfStatusOrder.indexOf(order.status);
      if (idx <= 0) return NextResponse.json({ error: "これ以上戻れません" }, { status: 400 });
      const prevStatus = cfStatusOrder[idx - 1];
      const rollback: Record<string, unknown> = { status: prevStatus };

      if (prevStatus === "APPLIED") { rollback.paymentStatus = "PENDING"; rollback.paidAt = null; }
      if (prevStatus === "PAYMENT_CONFIRMED") { rollback.producedAt = null; rollback.expiresAt = null; }
      if (prevStatus === "PRODUCING") { /* CLINIC_BOOKING → PRODUCING */ }
      if (prevStatus === "CLINIC_BOOKING") { rollback.informedAgreedAt = null; }
      if (prevStatus === "INFORMED_AGREED") { rollback.clinicDate = null; rollback.clinicName = null; rollback.clinicAddress = null; rollback.clinicPhone = null; }

      await prisma.cultureFluidOrder.update({ where: { id: order.id }, data: rollback });
      return NextResponse.json({ success: true, message: `ステータスを ${prevStatus} に戻しました` });
    }
  }

  return NextResponse.json({ error: "不正なアクション" }, { status: 400 });
}

// ── ステップ状態を構築するヘルパー ──
async function buildSteps(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      hasAgreedTerms: true, isIdIssued: true,
      membership: { select: { ipsStatus: true, paymentStatus: true, contractSignedAt: true, clinicDate: true } },
      documents: { select: { type: true, status: true } },
      cultureFluidOrders: { orderBy: { createdAt: "desc" as const }, take: 1, select: { status: true, paymentStatus: true, producedAt: true, expiresAt: true, clinicDate: true, informedAgreedAt: true, completedSessions: true, planType: true } },
    },
  });

  const m = user?.membership;
  const signedDocs = user?.documents?.filter(d => d.status === "SIGNED").map(d => d.type) || [];
  const statusIdx = m ? IPS_STATUS_ORDER.indexOf(m.ipsStatus) : -1;

  const ipsSteps = [
    { key: "TERMS_AGREED", label: "iPS細胞作製適合確認", actor: "admin" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("TERMS_AGREED") },
    { key: "REGISTERED", label: "メンバーシップ会員ID発行", actor: "admin" as const, done: !!user?.isIdIssued },
    { key: "DOC_IMPORTANT_NOTICE", label: "重要事項説明書兼確認書", actor: "member" as const, done: signedDocs.includes("CONTRACT") || !!user?.hasAgreedTerms },
    { key: "DOC_PRIVACY_CONSENT", label: "個人情報同意", actor: "member" as const, done: signedDocs.includes("PRIVACY_POLICY") || !!user?.hasAgreedTerms },
    { key: "SERVICE_APPLIED", label: "iPSサービス利用申込", actor: "member" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("SERVICE_APPLIED") },
    { key: "CONTRACT_SIGNING", label: "契約書署名", actor: "admin" as const, done: !!m?.contractSignedAt },
    { key: "PAYMENT_CONFIRMED", label: "入金確認", actor: "admin" as const, done: m?.paymentStatus === "COMPLETED" },
    { key: "SCHEDULE_ARRANGED", label: "日程調整リクエスト", actor: "member" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("SCHEDULE_ARRANGED") },
    { key: "DOC_CELL_CONSENT", label: "細胞提供・保管同意", actor: "member" as const, done: signedDocs.includes("CELL_STORAGE_CONSENT") },
    { key: "CLINIC_CONFIRMED", label: "日程確定", actor: "admin" as const, done: !!m?.clinicDate },
    { key: "DOC_INFORMED", label: "事前説明・同意", actor: "member" as const, done: signedDocs.includes("INFORMED_CONSENT") },
    { key: "BLOOD_COLLECTED", label: "問診・採血", actor: "admin" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("BLOOD_COLLECTED") },
    { key: "IPS_CREATING", label: "iPS細胞作製中", actor: "admin" as const, done: statusIdx >= IPS_STATUS_ORDER.indexOf("IPS_CREATING") },
    { key: "STORAGE_ACTIVE", label: "iPS細胞保管", actor: "admin" as const, done: m?.ipsStatus === "STORAGE_ACTIVE" },
  ];

  const order = user?.cultureFluidOrders?.[0];
  const cfSteps = order ? [
    { key: "CF_APPLIED", label: "追加購入申込", actor: "member" as const, done: true },
    { key: "CF_PAYMENT", label: "入金確認", actor: "admin" as const, done: order.paymentStatus === "COMPLETED" },
    { key: "CF_PRODUCING", label: "精製完了", actor: "admin" as const, done: !!order.producedAt },
    { key: "CF_CLINIC", label: "クリニック予約", actor: "member" as const, done: ["CLINIC_BOOKING", "INFORMED_AGREED", "RESERVATION_CONFIRMED", "COMPLETED"].includes(order.status) },
    { key: "CF_INFORMED", label: "事前説明・同意", actor: "member" as const, done: !!order.informedAgreedAt },
    { key: "CF_RESERVATION", label: "予約確定", actor: "admin" as const, done: ["RESERVATION_CONFIRMED", "COMPLETED"].includes(order.status) },
    { key: "CF_COMPLETED", label: "施術完了", actor: "admin" as const, done: order.status === "COMPLETED" },
  ] : [];

  return { ipsSteps, cfSteps };
}

// ── GET: ステータス取得 ──
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ isTester: false });
  const userId = (session.user as { id: string }).id;
  if (!(await checkIsTester(userId))) return NextResponse.json({ isTester: false });

  const { ipsSteps, cfSteps } = await buildSteps(userId);

  return NextResponse.json({ isTester: true, ipsSteps, cfSteps });
}
