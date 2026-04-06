import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// パンフレットURLを取得（認証必須）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const setting = await prisma.siteSetting.findUnique({ where: { key: "pamphlet_url" } });
  const url = setting?.content || "https://drive.google.com/file/d/1gGko6WSnt8jSR8k6GbsLby5kp3hQbXtE/view?usp=sharing";

  return NextResponse.json({ url });
}
