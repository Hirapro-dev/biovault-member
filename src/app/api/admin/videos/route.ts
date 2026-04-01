import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// YouTubeのURLからVideo IDを抽出
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// 動画一覧取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(videos);
}

// 動画作成
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.title || !body.youtubeUrl) {
    return NextResponse.json({ error: "タイトルとYouTube URLは必須です" }, { status: 400 });
  }

  const youtubeId = extractYoutubeId(body.youtubeUrl);
  if (!youtubeId) {
    return NextResponse.json({ error: "有効なYouTube URLを入力してください" }, { status: 400 });
  }

  // YouTubeサムネイルを自動取得
  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  const video = await prisma.video.create({
    data: {
      title: body.title,
      description: body.description || null,
      youtubeUrl: body.youtubeUrl,
      youtubeId,
      thumbnailUrl,
      isPublished: body.isPublished ?? false,
      author: session.user.name || "管理者",
    },
  });

  return NextResponse.json(video);
}
