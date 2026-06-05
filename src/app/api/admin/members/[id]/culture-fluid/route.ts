import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 培養上清液注文一覧取得
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const orders = await prisma.cultureFluidOrder.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// 培養上清液注文を新規作成（SUPER_ADMIN専用・自由編集用）
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "権限がありません（全権限者専用）" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });

  if (!body.planType || !body.planLabel) {
    return NextResponse.json({ error: "プラン種別・ラベルは必須です" }, { status: 400 });
  }

  const toDate = (v: unknown) => (v ? new Date(v as string) : null);
  const sessionDates = Array.isArray(body.sessionDates) ? JSON.stringify(body.sessionDates) : null;

  const created = await prisma.cultureFluidOrder.create({
    data: {
      userId: id,
      planType: String(body.planType),
      planLabel: String(body.planLabel),
      totalAmount: Number(body.totalAmount) || 0,
      paymentStatus: body.paymentStatus || "PENDING",
      status: body.status || "APPLIED",
      completedSessions: Number(body.completedSessions) || 0,
      sessionDates,
      paidAt: toDate(body.paidAt),
      producedAt: toDate(body.producedAt),
      storageStartedAt: toDate(body.storageStartedAt),
      expiresAt: toDate(body.expiresAt),
      completedAt: toDate(body.completedAt),
      clinicDate: toDate(body.clinicDate),
      clinicName: body.clinicName || null,
      ...(body.createdAt ? { createdAt: new Date(body.createdAt) } : {}),
    },
  });

  return NextResponse.json(created);
}
