/**
 * ステータス変更通知ライブラリ
 *
 * 顧客のステータスが変更された際に、以下の宛先にメール通知を送信する:
 * - 管理者（ADMIN / SUPER_ADMIN）全員
 * - 担当従業員（referredByStaff → Staff.email）
 * - 担当代理店（referredByAgency → AgencyProfile → User.email）
 */

import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

// iPSステータスの日本語ラベル
const IPS_STATUS_LABELS: Record<string, string> = {
  REGISTERED: "メンバー登録済み",
  TERMS_AGREED: "重要事項確認済み",
  SERVICE_APPLIED: "iPSサービス申込済み",
  SCHEDULE_ARRANGED: "iPS作製日程調整",
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

/**
 * 通知メールの宛先一覧を取得する
 *
 * @param userId - 対象の会員ユーザーID
 * @returns メールアドレスの配列（重複排除済み）
 */
async function getNotificationRecipients(userId: string): Promise<string[]> {
  const emails: string[] = [];

  // 0. 固定の管理通知先（環境変数またはデフォルト）
  const fixedNotifyEmails = (process.env.NOTIFY_ADMIN_EMAILS || "app@biovault.jp").split(",").map(e => e.trim()).filter(Boolean);
  emails.push(...fixedNotifyEmails);

  // 1. 管理者全員のメールアドレスを取得
  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
    select: { email: true },
  });
  for (const admin of admins) {
    emails.push(admin.email);
  }

  // 2. 対象会員の担当情報を取得
  const member = await prisma.user.findUnique({
    where: { id: userId },
    select: { referredByStaff: true, referredByAgency: true },
  });

  if (!member) return [...new Set(emails)];

  // 3. 担当従業員のメールアドレス
  if (member.referredByStaff) {
    const staff = await prisma.staff.findUnique({
      where: { staffCode: member.referredByStaff },
      select: { email: true },
    });
    if (staff?.email) {
      emails.push(staff.email);
    }
  }

  // 4. 担当代理店のメールアドレス
  if (member.referredByAgency) {
    const agency = await prisma.agencyProfile.findUnique({
      where: { agencyCode: member.referredByAgency },
      include: { user: { select: { email: true } } },
    });
    if (agency?.user?.email) {
      emails.push(agency.user.email);
    }
  }

  // 重複排除
  return [...new Set(emails)];
}

/**
 * iPSステータス変更通知を送信する
 */
export async function notifyIpsStatusChange({
  userId,
  memberName,
  memberNumber,
  fromStatus,
  toStatus,
  changedBy,
  note,
}: {
  userId: string;
  memberName: string;
  memberNumber?: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  note?: string;
}) {
  try {
    const recipients = await getNotificationRecipients(userId);
    if (recipients.length === 0) return;

    const fromLabel = IPS_STATUS_LABELS[fromStatus] || fromStatus;
    const toLabel = IPS_STATUS_LABELS[toStatus] || toStatus;
    const memberDisplay = memberNumber ? `${memberName}（${memberNumber}）` : memberName;

    const subject = `【BioVault】${memberName}様のステータスが更新されました`;
    const bodyText = `BioVault ステータス変更通知

会員: ${memberDisplay}
ステータス: ${fromLabel} → ${toLabel}
変更者: ${changedBy}
${note ? `備考: ${note}` : ""}
日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}

──────────────────
BioVault 管理通知（自動送信）
──────────────────`;

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
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:32px 24px;">
      <p style="font-size:12px;color:#BFA04B;letter-spacing:2px;margin:0 0 16px;">STATUS UPDATE</p>
      <p style="font-size:16px;color:#ffffff;margin:0 0 24px;">${memberDisplay}</p>
      <div style="background:#1A1A22;border:1px solid #2A2A38;border-radius:6px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:14px;color:#A0A0B0;">${fromLabel}</span>
          <span style="font-size:14px;color:#BFA04B;margin:0 8px;">→</span>
          <span style="font-size:14px;color:#BFA04B;font-weight:bold;">${toLabel}</span>
        </div>
      </div>
      <p style="font-size:12px;color:#A0A0B0;margin:0;">
        変更者: ${changedBy}<br>
        ${note ? `備考: ${note}<br>` : ""}
        日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
      </p>
    </div>
    <div style="margin-top:24px;text-align:center;">
      <p style="font-size:10px;color:#727288;">BioVault 管理通知（自動送信）</p>
    </div>
  </div>
</body>
</html>`;

    // 全宛先に並行送信（1通ずつ個別に送信）
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
  userId,
  memberName,
  memberNumber,
  planLabel,
  fromStatus,
  toStatus,
  changedBy,
}: {
  userId: string;
  memberName: string;
  memberNumber?: string;
  planLabel: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
}) {
  try {
    const recipients = await getNotificationRecipients(userId);
    if (recipients.length === 0) return;

    const fromLabel = CF_STATUS_LABELS[fromStatus] || fromStatus;
    const toLabel = CF_STATUS_LABELS[toStatus] || toStatus;
    const memberDisplay = memberNumber ? `${memberName}（${memberNumber}）` : memberName;

    const subject = `【BioVault】${memberName}様の培養上清液ステータスが更新されました`;
    const bodyText = `BioVault 培養上清液ステータス変更通知

会員: ${memberDisplay}
プラン: ${planLabel}
ステータス: ${fromLabel} → ${toLabel}
変更者: ${changedBy}
日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}

──────────────────
BioVault 管理通知（自動送信）
──────────────────`;

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
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:32px 24px;">
      <p style="font-size:12px;color:#BFA04B;letter-spacing:2px;margin:0 0 16px;">CULTURE FLUID UPDATE</p>
      <p style="font-size:16px;color:#ffffff;margin:0 0 8px;">${memberDisplay}</p>
      <p style="font-size:13px;color:#A0A0B0;margin:0 0 24px;">${planLabel}</p>
      <div style="background:#1A1A22;border:1px solid #2A2A38;border-radius:6px;padding:16px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:14px;color:#A0A0B0;">${fromLabel}</span>
          <span style="font-size:14px;color:#BFA04B;margin:0 8px;">→</span>
          <span style="font-size:14px;color:#BFA04B;font-weight:bold;">${toLabel}</span>
        </div>
      </div>
      <p style="font-size:12px;color:#A0A0B0;margin:0;">
        変更者: ${changedBy}<br>
        日時: ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
      </p>
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
