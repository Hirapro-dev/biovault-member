import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 会員詳細取得
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      membership: {
        include: { treatments: true },
      },
      documents: true,
      notes: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// 会員情報更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const role = (session.user as { role: string }).role;
  const isSuperAdmin = role === "SUPER_ADMIN";

  // ユーザー情報の更新データ
  const userData: Record<string, unknown> = {};
  if (body.name !== undefined) userData.name = body.name;
  if (body.nameKana !== undefined) userData.nameKana = body.nameKana;
  if (body.nameRomaji !== undefined) userData.nameRomaji = body.nameRomaji;
  if (body.phone !== undefined) userData.phone = body.phone;
  if (body.dateOfBirth !== undefined) userData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  if (body.address !== undefined) userData.address = body.address;
  if (body.postalCode !== undefined) userData.postalCode = body.postalCode;
  if (body.occupation !== undefined) userData.occupation = body.occupation;

  // SUPER_ADMIN専用: 追加フィールド
  if (isSuperAdmin) {
    if (body.email !== undefined) {
      const existing = await prisma.user.findFirst({ where: { email: body.email, id: { not: id } } });
      if (existing) {
        return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 400 });
      }
      userData.email = body.email;
    }
    if (body.loginId !== undefined) {
      const existing = await prisma.user.findFirst({ where: { loginId: body.loginId, id: { not: id } } });
      if (existing) {
        return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
      }
      userData.loginId = body.loginId;
    }
    if (body.hasAgreedTerms !== undefined) {
      userData.hasAgreedTerms = body.hasAgreedTerms;
      userData.agreedTermsAt = body.hasAgreedTerms ? new Date() : null;
    }
    if (body.isIdIssued !== undefined) userData.isIdIssued = body.isIdIssued;
    if (body.referredByStaff !== undefined) userData.referredByStaff = body.referredByStaff || null;
    if (body.referredByAgency !== undefined) userData.referredByAgency = body.referredByAgency || null;
    if (body.salesRepName !== undefined) userData.salesRepName = body.salesRepName || null;
    if (body.paymentMethod !== undefined) userData.paymentMethod = body.paymentMethod || null;
    if (body.paymentDate !== undefined) userData.paymentDate = body.paymentDate ? new Date(body.paymentDate) : null;
  }

  if (Object.keys(userData).length > 0) {
    await prisma.user.update({ where: { id }, data: userData });
  }

  // 会員権情報の更新
  if (body.membership) {
    const membershipData: Record<string, unknown> = {};

    // 通常の更新（ADMIN以上）
    if (body.membership.paymentStatus !== undefined) membershipData.paymentStatus = body.membership.paymentStatus;
    if (body.membership.paidAmount !== undefined) membershipData.paidAmount = body.membership.paidAmount;
    if (body.membership.clinicDate !== undefined) membershipData.clinicDate = body.membership.clinicDate ? new Date(body.membership.clinicDate) : null;
    if (body.membership.clinicName !== undefined) membershipData.clinicName = body.membership.clinicName || null;
    if (body.membership.clinicAddress !== undefined) membershipData.clinicAddress = body.membership.clinicAddress || null;
    if (body.membership.clinicPhone !== undefined) membershipData.clinicPhone = body.membership.clinicPhone || null;
    if (body.membership.contractSignedAt !== undefined) membershipData.contractSignedAt = body.membership.contractSignedAt ? new Date(body.membership.contractSignedAt) : null;
    if (body.membership.referrerName !== undefined) membershipData.referrerName = body.membership.referrerName || null;

    // SUPER_ADMIN専用: 契約金額・会員番号・ステータス・契約日等
    if (isSuperAdmin) {
      if (body.membership.memberNumber !== undefined) {
        const existing = await prisma.membership.findFirst({ where: { memberNumber: body.membership.memberNumber, userId: { not: id } } });
        if (existing) {
          return NextResponse.json({ error: "この会員番号は既に使用されています" }, { status: 400 });
        }
        membershipData.memberNumber = body.membership.memberNumber;
      }
      if (body.membership.totalAmount !== undefined) membershipData.totalAmount = body.membership.totalAmount;
      if (body.membership.ipsStatus !== undefined) membershipData.ipsStatus = body.membership.ipsStatus;
      if (body.membership.contractDate !== undefined) membershipData.contractDate = body.membership.contractDate ? new Date(body.membership.contractDate) : null;
      if (body.membership.storageYears !== undefined) membershipData.storageYears = body.membership.storageYears;
      if (body.membership.storageStartAt !== undefined) membershipData.storageStartAt = body.membership.storageStartAt ? new Date(body.membership.storageStartAt) : null;
      if (body.membership.ipsCompletedAt !== undefined) membershipData.ipsCompletedAt = body.membership.ipsCompletedAt ? new Date(body.membership.ipsCompletedAt) : null;
      if (body.membership.serviceAppliedAt !== undefined) membershipData.serviceAppliedAt = body.membership.serviceAppliedAt ? new Date(body.membership.serviceAppliedAt) : null;
      if (body.membership.consentSignedAt !== undefined) membershipData.consentSignedAt = body.membership.consentSignedAt ? new Date(body.membership.consentSignedAt) : null;
      if (body.membership.deathWish !== undefined) membershipData.deathWish = body.membership.deathWish || null;
    }

    if (Object.keys(membershipData).length > 0) {
      await prisma.membership.update({ where: { userId: id }, data: membershipData });
    }
  }

  const updated = await prisma.user.findUnique({
    where: { id },
    include: { membership: true },
  });

  return NextResponse.json(updated);
}
