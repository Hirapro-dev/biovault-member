import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 会員詳細取得
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      membership: {
        include: { treatments: true },
      },
      documents: true,
      notes: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// 会員情報更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: {
      name: body.name,
      nameKana: body.nameKana,
      nameRomaji: body.nameRomaji,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      address: body.address,
    },
  });

  // 会員権情報の更新
  if (body.membership) {
    await prisma.membership.update({
      where: { userId: id },
      data: {
        paymentStatus: body.membership.paymentStatus,
        paidAmount: body.membership.paidAmount,
        clinicDate: body.membership.clinicDate ? new Date(body.membership.clinicDate) : undefined,
        clinicName: body.membership.clinicName !== undefined ? body.membership.clinicName : undefined,
        clinicAddress: body.membership.clinicAddress !== undefined ? body.membership.clinicAddress : undefined,
        clinicPhone: body.membership.clinicPhone !== undefined ? body.membership.clinicPhone : undefined,
        contractSignedAt: body.membership.contractSignedAt ? new Date(body.membership.contractSignedAt) : undefined,
        referrerName: body.membership.referrerName,
      },
    });
  }

  return NextResponse.json(user);
}
