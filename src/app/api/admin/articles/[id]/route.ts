import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createContentUpdate } from "@/lib/content-notification";

// 記事更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // 更新前の公開状態を取得
  const before = await prisma.ipsArticle.findUnique({ where: { id }, select: { isPublished: true } });

  const article = await prisma.ipsArticle.update({
    where: { id },
    data: {
      title: body.title,
      summary: body.summary,
      content: body.content,
      category: body.category,
      imageUrl: body.imageUrl,
      sourceUrl: body.sourceUrl,
      sourceName: body.sourceName,
      isPublished: body.isPublished,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined,
    },
  });

  // 非公開→公開に切り替わった場合、更新通知を作成
  if (!before?.isPublished && article.isPublished) {
    await createContentUpdate({
      title: `「${article.title}」を公開しました`,
      contentType: "article",
      contentId: article.id,
      linkUrl: `/about-ips/news/${article.slug}`,
    });
  }

  return NextResponse.json(article);
}

// 記事削除
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.ipsArticle.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
