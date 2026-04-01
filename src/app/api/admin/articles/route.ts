import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 記事一覧取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const articles = await prisma.ipsArticle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(articles);
}

// 記事作成
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.title || !body.content || !body.category) {
    return NextResponse.json({ error: "タイトル、本文、カテゴリは必須です" }, { status: 400 });
  }

  // slug を自動生成（日時ベース + タイトルの一部）
  const slug = `${new Date().toISOString().slice(0, 10)}-${encodeURIComponent(
    body.title.slice(0, 30)
  ).toLowerCase().replace(/%[0-9a-f]{2}/gi, "")}-${Math.random().toString(36).slice(2, 6)}`;

  const article = await prisma.ipsArticle.create({
    data: {
      slug,
      title: body.title,
      summary: body.summary || body.content.slice(0, 200),
      content: body.content,
      category: body.category,
      imageUrl: body.imageUrl || null,
      sourceUrl: body.sourceUrl || null,
      sourceName: body.sourceName || null,
      isPublished: body.isPublished ?? false,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
      author: session.user.name || "管理者",
    },
  });

  return NextResponse.json(article);
}
