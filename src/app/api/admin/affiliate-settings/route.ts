import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { AFFILIATE_SETTING_KEYS, getAffiliateSettings } from "@/lib/affiliate";

const READ_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"];
const WRITE_ROLES = ["ADMIN", "SUPER_ADMIN"];

// 紹介協力制度の設定取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !READ_ROLES.includes((session.user as { role?: string }).role || "")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const settings = await getAffiliateSettings();
  return NextResponse.json({ settings });
}

// 設定更新（自動承認トグル・チャネル別デフォルト報酬額）
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !WRITE_ROLES.includes((session.user as { role?: string }).role || "")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const body = await req.json();
  const updatedBy = (session.user as { name?: string }).name || "管理者";

  const entries: { key: string; title: string; content: string }[] = [];

  if (body.autoApprove !== undefined) {
    entries.push({
      key: AFFILIATE_SETTING_KEYS.autoApprove,
      title: "紹介協力: 自動承認",
      content: body.autoApprove === true || body.autoApprove === "true" ? "true" : "false",
    });
  }
  const amountEntries: [string, string, unknown][] = [
    [AFFILIATE_SETTING_KEYS.rewardLeadNw, "紹介協力: 第一報酬(人脈繋がり)", body.rewardLeadNw],
    [AFFILIATE_SETTING_KEYS.rewardLeadKawara, "紹介協力: 第一報酬(KAWARA版)", body.rewardLeadKawara],
    [AFFILIATE_SETTING_KEYS.rewardConversionNw, "紹介協力: 第二報酬(人脈繋がり)", body.rewardConversionNw],
    [AFFILIATE_SETTING_KEYS.rewardConversionKawara, "紹介協力: 第二報酬(KAWARA版)", body.rewardConversionKawara],
  ];
  for (const [key, title, value] of amountEntries) {
    if (value !== undefined) {
      const n = parseInt(String(value), 10);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: `${title} の金額が不正です` }, { status: 400 });
      }
      entries.push({ key, title, content: String(n) });
    }
  }

  await prisma.$transaction(
    entries.map((e) =>
      prisma.siteSetting.upsert({
        where: { key: e.key },
        update: { content: e.content, updatedBy },
        create: { key: e.key, title: e.title, content: e.content, updatedBy },
      })
    )
  );

  const settings = await getAffiliateSettings();
  return NextResponse.json({ success: true, settings });
}
