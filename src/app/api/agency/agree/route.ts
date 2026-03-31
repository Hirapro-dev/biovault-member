import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "AGENCY") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { document } = await req.json(); // "contract" | "pledge" | "nda"
  const userId = (session.user as any).id;

  const updateData: Record<string, unknown> = {};
  if (document === "contract") updateData.hasAgreedContract = true;
  if (document === "pledge") updateData.hasAgreedPledge = true;
  if (document === "nda") updateData.hasAgreedNda = true;

  const profile = await prisma.agencyProfile.update({
    where: { userId },
    data: updateData,
  });

  // 全て同意済みか確認
  if (profile.hasAgreedContract && profile.hasAgreedPledge && profile.hasAgreedNda && !profile.agreedAt) {
    await prisma.agencyProfile.update({
      where: { userId },
      data: { agreedAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}
