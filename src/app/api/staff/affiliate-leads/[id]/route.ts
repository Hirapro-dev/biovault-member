import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateLeadCall } from "@/lib/affiliate-leads";
import type { LeadCallStatus } from "@prisma/client";

const CALL_STATUSES = ["UNCALLED", "CONNECTED", "NO_ANSWER", "RECALL", "INVALID"];

// リード更新（営業スタッフ用: 架電記録・フォーム送信。対応者のstaffCodeを自動記録）
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const sUser = session?.user as { role?: string; staffCode?: string | null } | undefined;
  if (!session?.user || sUser?.role !== "STAFF") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const callStatus =
    typeof body.callStatus === "string" && CALL_STATUSES.includes(body.callStatus)
      ? (body.callStatus as LeadCallStatus)
      : undefined;

  const result = await updateLeadCall({
    leadId: id,
    callStatus,
    callNote: body.callNote !== undefined ? String(body.callNote || "") || null : undefined,
    staffCode: sUser?.staffCode || undefined,
    sendForm: body.sendForm === true,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, lead: result.lead, mailSent: result.mailSent });
}
