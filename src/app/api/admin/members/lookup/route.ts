import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 会員番号から会員情報と売上対象オーダーを検索するAPI
 * 用途: 報酬追加フォームで memberNumber → 顧客名・売上オーダー候補を自動補完
 *
 * GET /api/admin/members/lookup?memberNumber=BV-0001
 *  → {
 *      found: true,
 *      user: { id, name, memberNumber },
 *      orders: [
 *        { key, label, amount, paid },  // iPS契約・培養上清液の売上対象候補
 *        ...
 *      ]
 *    }
 *  → { found: false }
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const memberNumber = searchParams.get("memberNumber")?.trim();

  if (!memberNumber) {
    return NextResponse.json({ error: "memberNumber が必要です" }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: { memberNumber },
    select: {
      memberNumber: true,
      totalAmount: true,
      paidAmount: true,
      paymentStatus: true,
      contractDate: true,
      user: {
        select: {
          id: true,
          name: true,
          cultureFluidOrders: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              planLabel: true,
              totalAmount: true,
              paymentStatus: true,
              paidAt: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ found: false });
  }

  // 売上対象オーダー候補を組み立て
  const orders: Array<{
    key: string;
    label: string;
    amount: number;
    paid: boolean;
    date: string | null;
  }> = [];

  // iPS契約
  orders.push({
    key: `ips:${membership.user.id}`,
    label: "iPS作製・保管 基本パッケージ",
    amount: membership.totalAmount,
    paid: membership.paymentStatus === "COMPLETED",
    date: membership.contractDate ? membership.contractDate.toISOString() : null,
  });

  // 培養上清液オーダー（iPSサービス付属の0円分は除外）
  for (const order of membership.user.cultureFluidOrders) {
    if (order.totalAmount === 0) continue;
    orders.push({
      key: `cf:${order.id}`,
      label: order.planLabel,
      amount: order.totalAmount,
      paid: order.paymentStatus === "COMPLETED",
      date: (order.paidAt || order.createdAt).toISOString(),
    });
  }

  return NextResponse.json({
    found: true,
    user: {
      id: membership.user.id,
      name: membership.user.name,
      memberNumber: membership.memberNumber,
    },
    orders,
  });
}
