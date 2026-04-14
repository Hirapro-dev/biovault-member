import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 申込詳細取得
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const application = await prisma.application.findUnique({ where: { id } });

  if (!application) {
    return NextResponse.json({ error: "申込が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(application);
}

// ステータス更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const application = await prisma.application.update({
    where: { id },
    data: {
      status: body.status,
      adminNote: body.adminNote,
    },
  });

  return NextResponse.json(application);
}
