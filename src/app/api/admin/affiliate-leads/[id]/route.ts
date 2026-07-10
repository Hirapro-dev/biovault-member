import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateLeadCall } from "@/lib/affiliate-leads";
import type { LeadCallStatus } from "@prisma/client";

const WRITE_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATOR"];
const CALL_STATUSES = ["UNCALLED", "CONNECTED", "NO_ANSWER", "RECALL", "INVALID"];

// リード更新（架電記録・適合確認フォーム送信/再送）
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !WRITE_ROLES.includes((session.user as { role?: string }).role || "")) {
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
    sendForm: body.sendForm === true,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ success: true, lead: result.lead, mailSent: result.mailSent });
}
