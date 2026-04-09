import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 培養上清液の申込を受け付け可能な iPS ステータス
// SERVICE_APPLIED 以降（iPSサービス申込済みの会員）であれば、
// iPS 作製が未完了でも「予約申込」として受け付ける
const ELIGIBLE_IPS_STATUSES = [
  "SERVICE_APPLIED",
  "SCHEDULE_ARRANGED",
  "BLOOD_COLLECTED",
  "IPS_CREATING",
  "STORAGE_ACTIVE",
] as const;

// 培養上清液追加購入申込
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  // iPSサービス申込済み以降であることを確認（予約申込を許可するため制約を緩和）
  const membership = await prisma.membership.findUnique({ where: { userId } });
  if (!membership || !ELIGIBLE_IPS_STATUSES.includes(membership.ipsStatus as typeof ELIGIBLE_IPS_STATUSES[number])) {
    return NextResponse.json(
      { error: "iPSサービスへのお申込みが完了してからご利用いただけます" },
      { status: 400 }
    );
  }

  const plans: Record<string, { label: string; amount: number }> = {
    iv_drip_1: { label: "点滴1回分（10ml）", amount: 880000 },
    iv_drip_5: { label: "点滴5回分（50ml）＋1回分（10ml）", amount: 4400000 },
    injection_1: { label: "注射1回分（3ml）", amount: 440000 },
    injection_5: { label: "注射5回分（15ml）＋1回分（3ml）", amount: 2200000 },
  };

  const plan = plans[body.planType];
  if (!plan) {
    return NextResponse.json({ error: "プランが正しくありません" }, { status: 400 });
  }

  const order = await prisma.cultureFluidOrder.create({
    data: {
      userId,
      planType: body.planType,
      planLabel: plan.label,
      totalAmount: plan.amount,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
      cautionAgreedAt: new Date(), // 留意事項は申込時に同意済み
    },
  });

  return NextResponse.json({ success: true, orderId: order.id });
}
