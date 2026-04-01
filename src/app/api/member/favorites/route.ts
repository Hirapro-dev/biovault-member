import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { FavoriteType } from "@prisma/client";

// GET: 自分のお気に入り一覧取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

// POST: お気に入り追加/削除（トグル）
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { contentType, contentId } = await req.json();

  if (!contentType || !contentId) {
    return NextResponse.json({ error: "contentTypeとcontentIdは必須です" }, { status: 400 });
  }

  // 既に存在するかチェック
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_contentType_contentId: {
        userId,
        contentType: contentType as FavoriteType,
        contentId,
      },
    },
  });

  if (existing) {
    // 既にある → 削除（お気に入り解除）
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  } else {
    // ない → 追加
    await prisma.favorite.create({
      data: {
        userId,
        contentType: contentType as FavoriteType,
        contentId,
      },
    });
    return NextResponse.json({ favorited: true });
  }
}
