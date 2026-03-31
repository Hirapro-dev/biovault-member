import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "AGENCY") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { document } = await req.json();
  const userId = (session.user as any).id;

  // "all" の場合は3文書一括同意
  if (document === "all") {
    await prisma.agencyProfile.update({
      where: { userId },
      data: {
        hasAgreedContract: true,
        hasAgreedPledge: true,
        hasAgreedNda: true,
        agreedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  }

  // 個別同意（互換性のため残す）
  const updateData: Record<string, unknown> = {};
  if (document === "contract") updateData.hasAgreedContract = true;
  if (document === "pledge") updateData.hasAgreedPledge = true;
  if (document === "nda") updateData.hasAgreedNda = true;

  const profile = await prisma.agencyProfile.update({
    where: { userId },
    data: updateData,
  });

  if (profile.hasAgreedContract && profile.hasAgreedPledge && profile.hasAgreedNda && !profile.agreedAt) {
    await prisma.agencyProfile.update({
      where: { userId },
      data: { agreedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
