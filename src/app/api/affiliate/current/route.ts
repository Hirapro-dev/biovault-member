import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AFFILIATE_COOKIE, LEAD_COOKIE } from "@/lib/affiliate";

/**
 * ご紹介協力制度経由の申込フォーム向けの現在情報を返す（公開API）
 *
 * - httpOnly Cookie はブラウザのJSから読めないため、サーバー側で読み取って返す。
 * - bv_aff（帰属Cookie）: ご紹介協力者コード。申込の紐付けに使用。
 * - bv_lead（リード識別Cookie）: LP登録済みリード。申込フォームの自動入力に使用。
 *
 * リードが引き当てられた場合は、そのリードの紹介協力者コードを優先して返す。
 */
export async function GET(req: NextRequest) {
  const affRef = req.cookies.get(AFFILIATE_COOKIE)?.value || "";
  const leadId = req.cookies.get(LEAD_COOKIE)?.value || "";

  // LP登録済みリードの引き当て（自動入力用）
  let lead: {
    name: string;
    nameKana: string;
    email: string;
    phone: string;
    postalCode: string | null;
    address: string;
    occupation: string | null;
  } | null = null;
  let leadAffiliateCode: string | null = null;

  if (leadId) {
    const record = await prisma.affiliateLead.findUnique({
      where: { id: leadId },
      select: {
        name: true,
        nameKana: true,
        email: true,
        phone: true,
        postalCode: true,
        address: true,
        occupation: true,
        affiliateProfile: { select: { affiliateCode: true } },
      },
    });
    if (record) {
      lead = {
        name: record.name,
        nameKana: record.nameKana,
        email: record.email,
        phone: record.phone,
        postalCode: record.postalCode,
        address: record.address,
        occupation: record.occupation,
      };
      leadAffiliateCode = record.affiliateProfile.affiliateCode;
    }
  }

  // 紐付けコード: リード由来を優先、無ければ帰属Cookie。有効(AF-XXXX)のみ。
  const candidate = leadAffiliateCode || affRef;
  const affiliateCode = /^AF-\d{4,}$/.test(candidate) ? candidate : null;

  return NextResponse.json({ affiliateCode, lead });
}
