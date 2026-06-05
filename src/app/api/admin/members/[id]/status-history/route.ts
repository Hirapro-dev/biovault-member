import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// IpsStatus enum の有効値（既存レガシー値も含めて受容）
const VALID_STATUS = new Set([
  "REGISTERED", "TERMS_AGREED", "SERVICE_APPLIED", "SCHEDULE_ARRANGED",
  "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE", "STORAGE_EXPIRED",
  "APPLICATION", "CONTRACT_SIGNED", "CLINIC_RESERVED", "IPS_COMPLETED",
]);

type EntryInput = {
  fromStatus?: string;
  toStatus?: string;
  note?: string | null;
  changedBy?: string;
  changedAt?: string;
};

/**
 * ステータス履歴の一括置き換え（SUPER_ADMIN専用）。
 * 既存履歴を全削除し、送られた entries で作り直す。
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "権限がありません（全権限者専用）" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const entries: EntryInput[] = Array.isArray(body.entries) ? body.entries : [];

  // ユーザー存在確認
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  // バリデーション
  const data = [];
  for (const e of entries) {
    const fromStatus = e.fromStatus || "";
    const toStatus = e.toStatus || "";
    if (!VALID_STATUS.has(fromStatus) || !VALID_STATUS.has(toStatus)) {
      return NextResponse.json({ error: `不正なステータス値が含まれています（${fromStatus} / ${toStatus}）` }, { status: 400 });
    }
    if (!e.changedAt || isNaN(new Date(e.changedAt).getTime())) {
      return NextResponse.json({ error: "日付が不正な行があります" }, { status: 400 });
    }
    data.push({
      userId: id,
      fromStatus: fromStatus as never,
      toStatus: toStatus as never,
      note: e.note?.trim() || null,
      changedBy: e.changedBy?.trim() || "全権限者編集",
      changedAt: new Date(e.changedAt),
    });
  }

  // トランザクションで置き換え
  await prisma.$transaction([
    prisma.statusHistory.deleteMany({ where: { userId: id } }),
    ...(data.length > 0 ? [prisma.statusHistory.createMany({ data })] : []),
  ]);

  const updated = await prisma.statusHistory.findMany({
    where: { userId: id },
    orderBy: { changedAt: "asc" },
  });
  return NextResponse.json(updated);
}
