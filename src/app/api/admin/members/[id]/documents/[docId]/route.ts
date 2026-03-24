import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 書類ステータス更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { docId } = await params;
  const body = await req.json();

  const document = await prisma.document.update({
    where: { id: docId },
    data: {
      status: body.status,
      signedAt: body.status === "SIGNED" ? new Date() : undefined,
    },
  });

  return NextResponse.json(document);
}
