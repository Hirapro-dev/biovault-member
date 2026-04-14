import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 全設定取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const settings = await prisma.siteSetting.findMany({
    orderBy: { key: "asc" },
  });

  return NextResponse.json(settings);
}

// 設定更新（upsert）
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { key, title, content } = await req.json();

  if (!key || !title || !content) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  const setting = await prisma.siteSetting.upsert({
    where: { key },
    update: {
      title,
      content,
      updatedBy: session.user.name || "管理者",
    },
    create: {
      key,
      title,
      content,
      updatedBy: session.user.name || "管理者",
    },
  });

  return NextResponse.json(setting);
}
