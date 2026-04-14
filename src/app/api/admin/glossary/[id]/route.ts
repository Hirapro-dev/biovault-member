import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH: 用語の更新
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const term = await prisma.glossaryTerm.update({
    where: { id },
    data: {
      ...(body.term !== undefined && { term: body.term }),
      ...(body.reading !== undefined && { reading: body.reading || null }),
      ...(body.english !== undefined && { english: body.english || null }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json(term);
}

// DELETE: 用語の物理削除
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.glossaryTerm.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
