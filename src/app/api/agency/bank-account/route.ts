import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * エージェント自身の振込先情報を更新するAPI
 * - ログイン中のエージェントの agencyProfile のみ更新
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "AGENCY") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const { bankName, bankBranch, bankAccountType, bankAccountNumber, bankAccountName } = body ?? {};

  // 型バリデーション（最低限）
  const data: {
    bankName?: string | null;
    bankBranch?: string | null;
    bankAccountType?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
  } = {};
  if (bankName !== undefined) data.bankName = String(bankName || "").trim() || null;
  if (bankBranch !== undefined) data.bankBranch = String(bankBranch || "").trim() || null;
  if (bankAccountType !== undefined) {
    const v = String(bankAccountType || "").trim();
    if (v && !["普通", "当座"].includes(v)) {
      return NextResponse.json({ error: "口座種別は「普通」または「当座」で指定してください" }, { status: 400 });
    }
    data.bankAccountType = v || null;
  }
  if (bankAccountNumber !== undefined) {
    const v = String(bankAccountNumber || "").trim();
    if (v && !/^[0-9]{1,10}$/.test(v)) {
      return NextResponse.json({ error: "口座番号は数字のみで入力してください" }, { status: 400 });
    }
    data.bankAccountNumber = v || null;
  }
  if (bankAccountName !== undefined) data.bankAccountName = String(bankAccountName || "").trim() || null;

  const profile = await prisma.agencyProfile.findUnique({ where: { userId } });
  if (!profile) {
    return NextResponse.json({ error: "エージェントプロフィールが見つかりません" }, { status: 404 });
  }

  const updated = await prisma.agencyProfile.update({
    where: { userId },
    data,
    select: {
      bankName: true,
      bankBranch: true,
      bankAccountType: true,
      bankAccountNumber: true,
      bankAccountName: true,
    },
  });

  return NextResponse.json({ success: true, profile: updated });
}
