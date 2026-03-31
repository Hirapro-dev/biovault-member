import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      hasAgreedTerms: true,
      agreedTermsAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
