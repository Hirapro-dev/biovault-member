/**
 * ステータス変更通知ライブラリ
 *
 * 顧客のステータスが変更された際に、以下の宛先にメール通知を送信する:
 * - 固定管理メール（app@biovault.jp）
 * - 管理者（ADMIN / SUPER_ADMIN）全員
 * - 担当従業員（referredByStaff → Staff.email）
 * - 担当代理店（referredByAgency → AgencyProfile → User.email）
 */

import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

// iPSステータスの日本語ラベル
const IPS_STATUS_LABELS: Record<string, string> = {
  REGISTERED: "iPS細胞作製適合確認の新規申込",
  ID_ISSUED: "メンバーシップ会員ID発行",
  TERMS_AGREED: "iPS細胞作製適合確認完了",
  DOC_PRIVACY: "重要事項確認／個人情報取扱同意確認",
  SERVICE_APPLIED: "iPSサービス申込済み",
  CONTRACT_SIGNING: "iPSサービス利用契約書署名",
  PAYMENT_CONFIRMED: "iPSサービス利用契約締結・入金確認",
  SCHEDULE_ARRANGED: "iPS細胞作製におけるクリニックの日程調整",
  DOC_CELL_CONSENT: "細胞提供・保管同意",
  CLINIC_CONFIRMED: "日程確定",
  DOC_INFORMED: "iPS細胞作製における事前説明・同意",
  BLOOD_COLLECTED: "問診・採血",
  IPS_CREATING: "iPS細胞作製中",
  STORAGE_ACTIVE: "iPS細胞保管中",
};

// 培養上清液ステータスの日本語ラベル
const CF_STATUS_LABELS: Record<string, string> = {
  APPLIED: "追加購入申込",
  PAYMENT_CONFIRMED: "入金確認済み",
  PRODUCING: "精製完了",
  CLINIC_BOOKING: "クリニック予約",
  INFORMED_AGREED: "事前説明・同意済み",
  RESERVATION_CONFIRMED: "予約確定",
  COMPLETED: "施術完了",
};

// 入金ステータスの日本語ラベル
const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "未入金",
  PARTIAL: "一部入金",
  COMPLETED: "入金済み",
};

const fmtDate = (d: Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }) : "---";

/**
 * 通知メールの宛先一覧を取得する
 */
async function getNotificationRecipients(userId: string): Promise<string[]> {
  const emails: string[] = [];

  const fixedNotifyEmails = (process.env.NOTIFY_ADMIN_EMAILS || "app@biovault.jp").split(",").map(e => e.trim()).filter(Boolean);
  emails.push(...fixedNotifyEmails);

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
    select: { email: true },
  });
  for (const admin of admins) {
    emails.push(admin.email);
  }

  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredByStaff: true, referredByAgency: true },
  });

  if (!member) return [...new Set(emails)];

  if (member.referredByStaff) {
    const staff = await prisma.staff.findUnique({
      where: { staffCode: member.referredByStaff },
      select: { email: true },
    });
    if (staff?.email) {
      emails.push(staff.email);
    }
  }

  if (member.referredByAgency) {
    const agency = await prisma.agencyProfile.findUnique({
      where: { agencyCode: member.referredByAgency },
      include: { user: { select: { email: true } } },
    });
    if (agency?.user?.email) {
      emails.push(agency.user.email);
    }
  }

  return [...new Set(emails)];
}

/**
 * 会員の詳細情報を取得する
 */
async function getMemberDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true, nameKana: true, email: true, phone: true,
      referredByStaff: true, referredByAgency: true,
      membership: {
        select: {
          memberNumber: true, ipsStatus: true, paymentStatus: true,
          totalAmount: true, paidAmount: true, contractDate: true,
          clinicDate: true, clinicName: true, clinicAddress: true, clinicPhone: true,
          storageStartAt: true, storageYears: true,
          serviceAppliedAt: true, contractSignedAt: true,
        },
      },
    },
  });

  if (!user) return null;

  let staffDisplay = "---";
  if (user.referredByStaff) {
    const staff = await prisma.staff.findUnique({
      where: { staffCode: user.referredByStaff },
      select: { name: true },
    });
    staffDisplay = staff ? `${staff.name}（${user.referredByStaff}）` : user.referredByStaff;
  }

  let agencyDisplay = "---";
  if (user.referredByAgency) {
    const agency = await prisma.agencyProfile.findUnique({
      where: { agencyCode: user.referredByAgency },
      select: { companyName: true, representativeName: true },
    });
    agencyDisplay = agency
      ? `${agency.companyName || agency.representativeName || ""}（${user.referredByAgency}）`
      : user.referredByAgency;
  }

  return { ...user, staffDisplay, agencyDisplay };
}

// ── HTML行ヘルパー ──
function detailRow(label: string, value: string) {
  return `<tr><td style="font-size:12px;color:#A0A0B0;padding:8px 0;border-bottom:1px solid #2A2A38;width:130px;vertical-align:top;">${label}</td><td style="font-size:13px;color:#D5D5DE;padding:8px 0;border-bottom:1px solid #2A2A38;">${value}</td></tr>`;
}

/** ハイライト付き行（今回変更された項目用） */
function highlightRow(label: string, value: string) {
  return `<tr><td style="font-size:12px;color:#BFA04B;font-weight:bold;padding:10px 0;border-bottom:1px solid #3A3520;width:130px;vertical-align:top;">${label}</td><td style="font-size:15px;color:#BFA04B;font-weight:bold;padding:10px 0;border-bottom:1px solid #3A3520;">${value}</td></tr>`;
}

/** ステータスに応じた「今回の更新ポイント」カードHTMLを生成 */
function buildIpsHighlightCard(toStatus: string, details: Awaited<ReturnType<typeof getMemberDetails>>) {
  if (!details?.membership) return "";
  const m = details.membership;

  const rows: string[] = [];
  switch (toStatus) {
    case "ID_ISSUED":
      rows.push(highlightRow("ID発行", "メンバーシップ会員IDが発行されました"));
      rows.push(detailRow("会員番号", m.memberNumber));
      break;
    case "SERVICE_APPLIED":
      rows.push(highlightRow("申込完了", "iPSサービス利用申込が完了しました"));
      if (m.serviceAppliedAt) rows.push(highlightRow("申込日", fmtDate(m.serviceAppliedAt)));
      rows.push(detailRow("入金状況", PAYMENT_LABELS[m.paymentStatus] || "---"));
      rows.push(detailRow("契約金額", `¥${m.totalAmount.toLocaleString()}`));
      break;
    case "CONTRACT_SIGNING":
      rows.push(highlightRow("契約書署名", "iPSサービス利用契約書の署名が完了しました"));
      if (m.contractSignedAt) rows.push(highlightRow("署名日", fmtDate(m.contractSignedAt)));
      break;
    case "PAYMENT_CONFIRMED":
      rows.push(highlightRow("入金確認", "入金確認が完了しました"));
      rows.push(highlightRow("入金額", `¥${m.paidAmount.toLocaleString()} / ¥${m.totalAmount.toLocaleString()}`));
      break;
    case "DOC_CELL_CONSENT":
      rows.push(highlightRow("同意完了", "細胞提供・保管同意書への同意が完了しました"));
      break;
    case "CLINIC_CONFIRMED":
      rows.push(highlightRow("日程確定", "クリニックの日程が確定しました"));
      if (m.clinicDate) rows.push(highlightRow("確定日", fmtDate(m.clinicDate)));
      if (m.clinicName) rows.push(highlightRow("クリニック", m.clinicName));
      if (m.clinicAddress) rows.push(detailRow("住所", m.clinicAddress));
      if (m.clinicPhone) rows.push(detailRow("TEL", m.clinicPhone));
      break;
    case "DOC_INFORMED":
      rows.push(highlightRow("同意完了", "iPS細胞作製における事前説明・同意が完了しました"));
      break;
    case "SCHEDULE_ARRANGED":
      rows.push(highlightRow("日程調整", "クリニックの日程調整に進みます"));
      if (m.clinicDate) {
        rows.push(highlightRow("予約日", fmtDate(m.clinicDate)));
        if (m.clinicName) rows.push(highlightRow("クリニック", m.clinicName));
        if (m.clinicAddress) rows.push(detailRow("住所", m.clinicAddress));
        if (m.clinicPhone) rows.push(detailRow("TEL", m.clinicPhone));
      }
      break;
    case "BLOOD_COLLECTED":
    case "IPS_CREATING":
      rows.push(highlightRow("作製開始", "iPS細胞の作製を開始しました"));
      if (m.clinicDate) rows.push(detailRow("問診・採血日", fmtDate(m.clinicDate)));
      break;
    case "STORAGE_ACTIVE": {
      rows.push(highlightRow("保管開始", "iPS細胞の保管を開始しました"));
      if (m.storageStartAt) rows.push(highlightRow("保管開始日", fmtDate(m.storageStartAt)));
      const end = m.storageStartAt ? new Date(m.storageStartAt) : null;
      if (end) {
        end.setFullYear(end.getFullYear() + (m.storageYears || 10));
        rows.push(highlightRow("保管期限", fmtDate(end)));
      }
      rows.push(detailRow("保管年数", `${m.storageYears || 10}年間`));
      break;
    }
    default:
      return "";
  }

  if (rows.length === 0) return "";
  return `
    <div style="background:#1A1A10;border:1px solid #3A3520;border-radius:8px;padding:20px 24px;margin-bottom:16px;">
      <p style="font-size:11px;color:#BFA04B;letter-spacing:2px;margin:0 0 12px;">TODAY&apos;S UPDATE</p>
      <table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>
    </div>`;
}

/** 培養上清液ステータスに応じた「今回の更新ポイント」カード */
function buildCfHighlightCard(
  toStatus: string,
  order: { planLabel?: string; totalAmount?: number; clinicDate?: Date | null; clinicName?: string | null; clinicAddress?: string | null; clinicPhone?: string | null; producedAt?: Date | null; expiresAt?: Date | null; requestedSessionCount?: number; completedSessions?: number } | null,
) {
  if (!order) return "";
  const rows: string[] = [];

  switch (toStatus) {
    case "APPLIED":
      rows.push(highlightRow("新規申込", `${order.planLabel || "---"}`));
      rows.push(highlightRow("金額", `¥${(order.totalAmount || 0).toLocaleString()}`));
      break;
    case "PAYMENT_CONFIRMED":
      rows.push(highlightRow("入金確認", "入金確認が完了しました"));
      rows.push(detailRow("プラン", order.planLabel || "---"));
      rows.push(detailRow("金額", `¥${(order.totalAmount || 0).toLocaleString()}`));
      break;
    case "PRODUCING":
      rows.push(highlightRow("精製完了", "培養上清液の精製が完了しました"));
      if (order.producedAt) rows.push(highlightRow("精製完了日", fmtDate(order.producedAt)));
      if (order.expiresAt) rows.push(highlightRow("管理期限", fmtDate(order.expiresAt)));
      break;
    case "CLINIC_BOOKING":
      rows.push(highlightRow("予約申込", "クリニック施術予約が申し込まれました"));
      if (order.requestedSessionCount) rows.push(highlightRow("施術希望回数", `${order.requestedSessionCount}回分`));
      break;
    case "RESERVATION_CONFIRMED":
      rows.push(highlightRow("予約確定", "クリニック施術予約が確定しました"));
      if (order.clinicDate) rows.push(highlightRow("施術予定日", fmtDate(order.clinicDate)));
      if (order.clinicName) rows.push(highlightRow("クリニック", order.clinicName));
      if (order.clinicAddress) rows.push(detailRow("住所", order.clinicAddress));
      if (order.clinicPhone) rows.push(detailRow("TEL", order.clinicPhone));
      break;
    case "COMPLETED":
      rows.push(highlightRow("施術完了", "施術が完了しました"));
      rows.push(highlightRow("完了済み", `${order.completedSessions || 0}回`));
      break;
    default:
      return "";
  }

  if (rows.length === 0) return "";
  return `
    <div style="background:#1A1A10;border:1px solid #3A3520;border-radius:8px;padding:20px 24px;margin-bottom:16px;">
      <p style="font-size:11px;color:#BFA04B;letter-spacing:2px;margin:0 0 12px;">TODAY&apos;S UPDATE</p>
      <table style="width:100%;border-collapse:collapse;">${rows.join("")}</table>
    </div>`;
}

/**
 * iPSステータス変更通知を送信する
 */
export async function notifyIpsStatusChange({
  userId, memberName, memberNumber, fromStatus, toStatus, changedBy, note,
}: {
  userId: string; memberName: string; memberNumber?: string;
  fromStatus: string; toStatus: string; changedBy: string; note?: string;
}) {
  try {
    const recipients = await getNotificationRecipients(userId);
    if (recipients.length === 0) return;

    const details = await getMemberDetails(userId);
    const fromLabel = IPS_STATUS_LABELS[fromStatus] || fromStatus;
    const toLabel = IPS_STATUS_LABELS[toStatus] || toStatus;
    const memberDisplay = memberNumber ? `${memberName}（${memberNumber}）` : memberName;
    const nowStr = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

    let storageExpiry = "---";
    if (details?.membership?.storageStartAt) {
      const end = new Date(details.membership.storageStartAt);
      end.setFullYear(end.getFullYear() + (details.membership.storageYears || 10));
      storageExpiry = fmtDate(end);
    }

    const highlightCard = buildIpsHighlightCard(toStatus, details);

    const subject = `【BioVault】${memberName}様のステータスが更新されました（${toLabel}）`;

    const bodyText = `BioVault ステータス変更通知

━━━━━ ステータス変更 ━━━━━
${fromLabel} → ${toLabel}
変更者: ${changedBy}
${note ? `備考: ${note}` : ""}
日時: ${nowStr}

━━━━━ 会員情報 ━━━━━
会員番号: ${details?.membership?.memberNumber || "---"}
氏名: ${details?.name || memberName}
フリガナ: ${details?.nameKana || "---"}
メール: ${details?.email || "---"}
電話: ${details?.phone || "---"}
契約日: ${fmtDate(details?.membership?.contractDate)}
入金状況: ${PAYMENT_LABELS[details?.membership?.paymentStatus || ""] || "---"}
入金額: ¥${(details?.membership?.paidAmount || 0).toLocaleString()} / ¥${(details?.membership?.totalAmount || 0).toLocaleString()}
担当従業員: ${details?.staffDisplay || "---"}
担当代理店: ${details?.agencyDisplay || "---"}

━━━━━ 現在のステータス詳細 ━━━━━
iPSステータス: ${IPS_STATUS_LABELS[details?.membership?.ipsStatus || ""] || "---"}
サービス申込日: ${fmtDate(details?.membership?.serviceAppliedAt)}
契約書署名日: ${fmtDate(details?.membership?.contractSignedAt)}
クリニック予約日: ${fmtDate(details?.membership?.clinicDate)}
クリニック名: ${details?.membership?.clinicName || "---"}
保管開始日: ${fmtDate(details?.membership?.storageStartAt)}
保管期限: ${storageExpiry}

──────────────────
BioVault 管理通知（自動送信）`;

    const bodyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#070709;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://biovault-member.vercel.app/logo.png" alt="BioVault" style="height:40px;width:auto;" />
      <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#BFA04B,transparent);margin:12px auto;"></div>
    </div>

    <!-- ステータス変更ヘッダー -->
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:24px;margin-bottom:16px;">
      <p style="font-size:11px;color:#BFA04B;letter-spacing:2px;margin:0 0 12px;">STATUS UPDATE</p>
      <p style="font-size:16px;color:#ffffff;margin:0 0 20px;font-weight:500;">${memberDisplay}</p>
      <div style="background:#1A1A22;border:1px solid #2A2A38;border-radius:6px;padding:16px;margin-bottom:16px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:13px;color:#A0A0B0;text-align:center;padding:4px;">${fromLabel}</td>
            <td style="font-size:16px;color:#BFA04B;text-align:center;padding:4px;width:40px;">→</td>
            <td style="font-size:14px;color:#BFA04B;font-weight:bold;text-align:center;padding:4px;">${toLabel}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:12px;color:#A0A0B0;margin:0;">
        変更者: ${changedBy}${note ? `<br>備考: ${note}` : ""}<br>日時: ${nowStr}
      </p>
    </div>

    <!-- 今回の更新ポイント -->
    ${highlightCard}

    <!-- 会員情報 -->
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:24px;margin-bottom:16px;">
      <p style="font-size:11px;color:#BFA04B;letter-spacing:2px;margin:0 0 16px;">MEMBER INFO</p>
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow("会員番号", details?.membership?.memberNumber || "---")}
        ${detailRow("氏名", details?.name || memberName)}
        ${detailRow("フリガナ", details?.nameKana || "---")}
        ${detailRow("メール", details?.email || "---")}
        ${detailRow("電話番号", details?.phone || "---")}
        ${detailRow("契約日", fmtDate(details?.membership?.contractDate))}
        ${detailRow("入金状況", `${PAYMENT_LABELS[details?.membership?.paymentStatus || ""] || "---"}（¥${(details?.membership?.paidAmount || 0).toLocaleString()} / ¥${(details?.membership?.totalAmount || 0).toLocaleString()}）`)}
        ${detailRow("担当従業員", details?.staffDisplay || "---")}
        ${detailRow("担当代理店", details?.agencyDisplay || "---")}
      </table>
    </div>

    <!-- ステータス詳細 -->
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:24px;">
      <p style="font-size:11px;color:#BFA04B;letter-spacing:2px;margin:0 0 16px;">STATUS DETAIL</p>
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow("現在のステータス", `<span style="color:#BFA04B;font-weight:bold;">${IPS_STATUS_LABELS[details?.membership?.ipsStatus || ""] || "---"}</span>`)}
        ${detailRow("サービス申込日", fmtDate(details?.membership?.serviceAppliedAt))}
        ${detailRow("契約書署名日", fmtDate(details?.membership?.contractSignedAt))}
        ${detailRow("クリニック予約日", fmtDate(details?.membership?.clinicDate))}
        ${detailRow("クリニック名", details?.membership?.clinicName || "---")}
        ${detailRow("保管開始日", fmtDate(details?.membership?.storageStartAt))}
        ${detailRow("保管期限", storageExpiry)}
      </table>
    </div>

    <div style="margin-top:24px;text-align:center;">
      <p style="font-size:10px;color:#727288;">BioVault 管理通知（自動送信）</p>
    </div>
  </div>
</body>
</html>`;

    await Promise.allSettled(
      recipients.map((to) => sendEmail({ to, subject, bodyText, bodyHtml }))
    );
  } catch (e) {
    console.error("Status notification failed:", e);
  }
}

/**
 * 培養上清液ステータス変更通知を送信する
 */
export async function notifyCultureFluidStatusChange({
  userId, memberName, memberNumber, planLabel, fromStatus, toStatus, changedBy,
}: {
  userId: string; memberName: string; memberNumber?: string;
  planLabel: string; fromStatus: string; toStatus: string; changedBy: string;
}) {
  try {
    const recipients = await getNotificationRecipients(userId);
    if (recipients.length === 0) return;

    const details = await getMemberDetails(userId);
    const fromLabel = CF_STATUS_LABELS[fromStatus] || fromStatus;
    const toLabel = CF_STATUS_LABELS[toStatus] || toStatus;
    const memberDisplay = memberNumber ? `${memberName}（${memberNumber}）` : memberName;
    const nowStr = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

    const orders = await prisma.cultureFluidOrder.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        planLabel: true, totalAmount: true, status: true, paymentStatus: true,
        producedAt: true, expiresAt: true,
        clinicDate: true, clinicName: true, clinicAddress: true, clinicPhone: true,
        completedSessions: true, requestedSessionCount: true,
      },
    });

    const activeOrder = orders[0];
    const highlightCard = buildCfHighlightCard(toStatus, activeOrder);

    const subject = `【BioVault】${memberName}様の培養上清液ステータスが更新されました（${toLabel}）`;

    const bodyText = `BioVault 培養上清液ステータス変更通知

━━━━━ ステータス変更 ━━━━━
プラン: ${planLabel}
${fromLabel} → ${toLabel}
変更者: ${changedBy}
日時: ${nowStr}

━━━━━ 会員情報 ━━━━━
会員番号: ${details?.membership?.memberNumber || "---"}
氏名: ${details?.name || memberName}
メール: ${details?.email || "---"}
電話: ${details?.phone || "---"}
担当従業員: ${details?.staffDisplay || "---"}
担当代理店: ${details?.agencyDisplay || "---"}

━━━━━ 培養上清液注文情報 ━━━━━
プラン: ${activeOrder?.planLabel || planLabel}
金額: ¥${(activeOrder?.totalAmount || 0).toLocaleString()}
入金状況: ${PAYMENT_LABELS[activeOrder?.paymentStatus || ""] || activeOrder?.paymentStatus || "---"}
精製完了日: ${fmtDate(activeOrder?.producedAt)}
管理期限: ${fmtDate(activeOrder?.expiresAt)}
クリニック予約日: ${fmtDate(activeOrder?.clinicDate)}
クリニック名: ${activeOrder?.clinicName || "---"}
施術回数: ${activeOrder?.requestedSessionCount || 1}回分
完了回数: ${activeOrder?.completedSessions || 0}回

──────────────────
BioVault 管理通知（自動送信）`;

    const bodyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#070709;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://biovault-member.vercel.app/logo.png" alt="BioVault" style="height:40px;width:auto;" />
      <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#BFA04B,transparent);margin:12px auto;"></div>
    </div>

    <!-- ステータス変更ヘッダー -->
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:24px;margin-bottom:16px;">
      <p style="font-size:11px;color:#BFA04B;letter-spacing:2px;margin:0 0 12px;">CULTURE FLUID UPDATE</p>
      <p style="font-size:16px;color:#ffffff;margin:0 0 8px;font-weight:500;">${memberDisplay}</p>
      <p style="font-size:13px;color:#A0A0B0;margin:0 0 20px;">${planLabel}</p>
      <div style="background:#1A1A22;border:1px solid #2A2A38;border-radius:6px;padding:16px;margin-bottom:16px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:13px;color:#A0A0B0;text-align:center;padding:4px;">${fromLabel}</td>
            <td style="font-size:16px;color:#BFA04B;text-align:center;padding:4px;width:40px;">→</td>
            <td style="font-size:14px;color:#BFA04B;font-weight:bold;text-align:center;padding:4px;">${toLabel}</td>
          </tr>
        </table>
      </div>
      <p style="font-size:12px;color:#A0A0B0;margin:0;">変更者: ${changedBy}<br>日時: ${nowStr}</p>
    </div>

    <!-- 今回の更新ポイント -->
    ${highlightCard}

    <!-- 会員情報 -->
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:24px;margin-bottom:16px;">
      <p style="font-size:11px;color:#BFA04B;letter-spacing:2px;margin:0 0 16px;">MEMBER INFO</p>
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow("会員番号", details?.membership?.memberNumber || "---")}
        ${detailRow("氏名", details?.name || memberName)}
        ${detailRow("メール", details?.email || "---")}
        ${detailRow("電話番号", details?.phone || "---")}
        ${detailRow("担当従業員", details?.staffDisplay || "---")}
        ${detailRow("担当代理店", details?.agencyDisplay || "---")}
      </table>
    </div>

    <!-- 注文詳細 -->
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:24px;">
      <p style="font-size:11px;color:#BFA04B;letter-spacing:2px;margin:0 0 16px;">ORDER DETAIL</p>
      <table style="width:100%;border-collapse:collapse;">
        ${detailRow("プラン", activeOrder?.planLabel || planLabel)}
        ${detailRow("金額", `¥${(activeOrder?.totalAmount || 0).toLocaleString()}`)}
        ${detailRow("入金状況", PAYMENT_LABELS[activeOrder?.paymentStatus || ""] || activeOrder?.paymentStatus || "---")}
        ${detailRow("精製完了日", fmtDate(activeOrder?.producedAt))}
        ${detailRow("管理期限", fmtDate(activeOrder?.expiresAt))}
        ${detailRow("クリニック予約日", fmtDate(activeOrder?.clinicDate))}
        ${detailRow("クリニック名", activeOrder?.clinicName || "---")}
        ${detailRow("施術希望回数", `${activeOrder?.requestedSessionCount || 1}回分`)}
        ${detailRow("完了済み回数", `${activeOrder?.completedSessions || 0}回`)}
      </table>
    </div>

    <div style="margin-top:24px;text-align:center;">
      <p style="font-size:10px;color:#727288;">BioVault 管理通知（自動送信）</p>
    </div>
  </div>
</body>
</html>`;

    await Promise.allSettled(
      recipients.map((to) => sendEmail({ to, subject, bodyText, bodyHtml }))
    );
  } catch (e) {
    console.error("Culture fluid notification failed:", e);
  }
}
