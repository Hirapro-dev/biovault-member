import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const where = role === "ADMIN" || role === "SUPER_ADMIN" ? {} : { agencyUserId: userId };
  const requests = await prisma.printRequest.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "AGENCY") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const userId = (session.user as any).id;
  const body = await req.json();
  if (!body.companyName || !body.representativeName || !body.quantity || !body.shippingAddress || !body.paymentMethod) {
    return NextResponse.json({ error: "必須項目が入力されていません" }, { status: 400 });
  }
  const profile = await prisma.agencyProfile.findUnique({ where: { userId } });
  const request = await prisma.printRequest.create({
    data: {
      agencyUserId: userId,
      agencyCode: profile?.agencyCode || "---",
      companyName: body.companyName,
      representativeName: body.representativeName,
      quantity: body.quantity,
      postalCode: body.postalCode || null,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
      note: body.note || null,
    },
  });
  // 管理者へメール通知
  try {
    const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL || "app@biovault.jp";
    await sendEmail({
      to: notifyEmail,
      subject: `【BioVault】パンフレット印刷依頼（${profile?.agencyCode} / ${body.companyName}）`,
      bodyText: `パンフレット印刷依頼が届きました。\n\n代理店: ${profile?.agencyCode} / ${body.companyName}\n代表者: ${body.representativeName}\n部数: ${body.quantity}部\n支払方法: ${body.paymentMethod === "bank_transfer" ? "銀行振込" : "代引き"}\n送り先: 〒${body.postalCode || "---"} ${body.shippingAddress}\n備考: ${body.note || "なし"}`,
    });
  } catch (e) { console.error("Print request email failed:", e); }
  return NextResponse.json({ id: request.id, success: true });
}
