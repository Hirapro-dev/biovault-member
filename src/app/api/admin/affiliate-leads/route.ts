import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listLeads } from "@/lib/affiliate-leads";

const READ_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"];

// リード一覧（admin・staffと同一リスト）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !READ_ROLES.includes((session.user as { role?: string }).role || "")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const leads = await listLeads();
  return NextResponse.json({ leads });
}
