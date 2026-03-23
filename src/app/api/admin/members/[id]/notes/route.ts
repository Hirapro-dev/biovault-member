import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: "メモ内容は必須です" }, { status: 400 });
  }

  const note = await prisma.adminNote.create({
    data: {
      userId: id,
      content,
      author: session.user.name || "管理者",
    },
  });

  return NextResponse.json(note);
}
