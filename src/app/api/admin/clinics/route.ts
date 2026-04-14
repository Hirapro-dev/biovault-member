import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: クリニック一覧
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const clinics = await prisma.clinic.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clinics);
}

// POST: クリニック新規作成
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.name) {
    return NextResponse.json({ error: "クリニック名は必須です" }, { status: 400 });
  }

  const clinic = await prisma.clinic.create({
    data: {
      name: body.name,
      address: body.address || null,
      phone: body.phone || null,
      note: body.note || null,
    },
  });

  return NextResponse.json(clinic);
}
