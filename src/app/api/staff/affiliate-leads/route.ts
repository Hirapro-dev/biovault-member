import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listLeads } from "@/lib/affiliate-leads";

// リード一覧（営業スタッフ用・adminと同一リスト）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "STAFF") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const leads = await listLeads();
  return NextResponse.json({ leads });
}
