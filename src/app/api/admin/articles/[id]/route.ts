import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 記事更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const article = await prisma.ipsArticle.update({
    where: { id },
    data: {
      title: body.title,
      summary: body.summary,
      content: body.content,
      category: body.category,
      sourceUrl: body.sourceUrl,
      sourceName: body.sourceName,
      isPublished: body.isPublished,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
    },
  });

  return NextResponse.json(article);
}

// 記事削除
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.ipsArticle.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
