import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: 用語集一覧（カテゴリ→表示順）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const terms = await prisma.glossaryTerm.findMany({
    orderBy: [
      { category: "asc" },
      { sortOrder: "asc" },
    ],
  });

  return NextResponse.json(terms);
}

// POST: 用語の新規作成
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.term || !body.description) {
    return NextResponse.json({ error: "用語名と説明は必須です" }, { status: 400 });
  }

  const term = await prisma.glossaryTerm.create({
    data: {
      term: body.term,
      reading: body.reading || null,
      english: body.english || null,
      description: body.description,
      category: body.category || "basic",
      sortOrder: body.sortOrder || 0,
    },
  });

  return NextResponse.json(term);
}
