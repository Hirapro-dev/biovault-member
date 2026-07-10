import prisma from "./prisma";
import { sendEmail } from "./mail";
import { ipsCheckInvitationEmail } from "./affiliate-mail";
import { ipsCheckFormUrl } from "./affiliate";
import type { LeadCallStatus } from "@prisma/client";

/**
 * リードの架電記録更新 + 適合確認フォーム案内メール送信
 * admin / staff の両APIから共用する。
 *
 * - callStatus を CONNECTED に変更したときは案内メールを自動送信
 * - sendForm=true で再送も可能
 */
export async function updateLeadCall({
  leadId,
  callStatus,
  callNote,
  staffCode,
  sendForm,
}: {
  leadId: string;
  callStatus?: LeadCallStatus;
  callNote?: string | null;
  staffCode?: string | null;
  sendForm?: boolean;
}) {
  const lead = await prisma.affiliateLead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return { error: "リードが見つかりません", status: 404 as const };
  }

  // 「繋がった」への変更時は自動送信（既に申請済みなら送らない）
  const becameConnected = callStatus === "CONNECTED" && lead.callStatus !== "CONNECTED";
  const shouldSendForm = (becameConnected || sendForm) && !lead.applicationId;

  const updated = await prisma.affiliateLead.update({
    where: { id: leadId },
    data: {
      ...(callStatus ? { callStatus, calledAt: new Date() } : {}),
      ...(callNote !== undefined ? { callNote } : {}),
      ...(staffCode !== undefined ? { staffCode } : {}),
      ...(shouldSendForm ? { formSentAt: new Date() } : {}),
    },
  });

  let mailSent = false;
  if (shouldSendForm) {
    try {
      const mail = ipsCheckInvitationEmail(lead.name, ipsCheckFormUrl(lead.formToken));
      const result = await sendEmail({ to: lead.email, ...mail });
      mailSent = result.success;
    } catch (e) {
      console.error("IPS check invitation email failed:", e);
    }
  }

  return { lead: updated, mailSent, status: 200 as const };
}

// リード一覧の共通取得（admin / staff 共用・全員が同じリストを見る）
export async function listLeads() {
  return prisma.affiliateLead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      affiliateProfile: {
        select: {
          affiliateCode: true,
          channel: true,
          displayName: true,
          user: { select: { name: true } },
        },
      },
    },
  });
}
