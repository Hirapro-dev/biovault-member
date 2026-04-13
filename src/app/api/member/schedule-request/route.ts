import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

/**
 * 日程調整リクエストAPI
 * 会員がマイページから「日程調整を行う」ボタンを押した際に呼ばれる。
 * - 管理者へメール通知
 * - 管理者メモに記録
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未認証です" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // ユーザーと会員権情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true },
  });

  if (!user || !user.membership) {
    return NextResponse.json({ error: "会員情報が見つかりません" }, { status: 400 });
  }

  // SERVICE_APPLIED ステータスの場合のみ受付
  if (user.membership.ipsStatus !== "SERVICE_APPLIED") {
    return NextResponse.json({ error: "現在のステータスでは日程調整リクエストはできません" }, { status: 400 });
  }

  // ステータスを SCHEDULE_ARRANGED に更新
  await prisma.$transaction([
    prisma.membership.update({
      where: { userId },
      data: { ipsStatus: "SCHEDULE_ARRANGED" },
    }),
    prisma.statusHistory.create({
      data: {
        userId,
        fromStatus: "SERVICE_APPLIED",
        toStatus: "SCHEDULE_ARRANGED",
        note: "細胞提供・保管同意書に同意 → 日程調整申請",
        changedBy: "会員本人",
      },
    }),
  ]);

  // 管理者メモに記録
  await prisma.adminNote.create({
    data: {
      userId: user.id,
      content: `【日程調整リクエスト】${user.name}様より日程調整の申請がありました。会員番号: ${user.membership.memberNumber}`,
      author: "システム（自動）",
    },
  });

  // 通知先メールアドレス
  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL || "app@biovault.jp";

  // 管理者にメール通知
  const emailPromises = [notifyEmail].map((to) =>
    sendEmail({
      to,
      subject: "【BioVault】日程調整リクエストが届きました",
      bodyText: `以下の会員様より、日程調整のリクエストがありました。

────────────────────
会員名: ${user.name}
会員番号: ${user.membership!.memberNumber}
メール: ${user.email}
電話: ${user.phone || "未登録"}
────────────────────

管理画面より日程調整の対応をお願いいたします。
https://biovault-member.vercel.app/admin/members/${user.id}

※ このメールはシステムから自動送信されています。`,
      bodyHtml: `
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
      <p style="font-size:16px;color:#BFA04B;margin:0 0 16px;font-weight:600;">日程調整リクエスト</p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 16px;">
        以下の会員様より、問診・採血の日程調整リクエストが届きました。
      </p>
      <div style="background:#1A1A22;border:1px solid #2A2A38;border-radius:6px;padding:20px;margin-bottom:24px;">
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">会員名</div>
        <div style="font-size:16px;color:#ffffff;margin-bottom:12px;">${user.name}</div>
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">会員番号</div>
        <div style="font-size:14px;color:#BFA04B;font-family:monospace;letter-spacing:2px;margin-bottom:12px;">${user.membership!.memberNumber}</div>
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">メール</div>
        <div style="font-size:14px;color:#D5D5DE;margin-bottom:12px;">${user.email}</div>
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">電話番号</div>
        <div style="font-size:14px;color:#D5D5DE;">${user.phone || "未登録"}</div>
      </div>
      <a href="https://biovault-member.vercel.app/admin/members/${user.id}" style="display:inline-block;background:linear-gradient(135deg,#BFA04B,#D4B856);color:#070709;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:1px;">
        管理画面で確認する
      </a>
    </div>
    <div style="margin-top:32px;text-align:center;">
      <p style="font-size:10px;color:#727288;">※ このメールはシステムから自動送信されています。</p>
    </div>
  </div>
</body>
</html>`,
    })
  );

  await Promise.allSettled(emailPromises);

  return NextResponse.json({ success: true });
}
