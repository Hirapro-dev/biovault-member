import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 動画更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const video = await prisma.video.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      youtubeUrl: body.youtubeUrl,
      youtubeId: body.youtubeId,
      thumbnailUrl: body.thumbnailUrl,
      isPublished: body.isPublished,
    },
  });

  return NextResponse.json(video);
}

// 動画削除
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.video.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
