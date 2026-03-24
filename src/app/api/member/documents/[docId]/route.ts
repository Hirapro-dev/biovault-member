import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getFileUrl } from "@/lib/storage";

// PDF の閲覧URL取得（認証済みユーザーのみ）
export async function GET(req: Request, { params }: { params: Promise<{ docId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { docId } = await params;
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const document = await prisma.document.findUnique({
    where: { id: docId },
  });

  if (!document) {
    return NextResponse.json({ error: "書類が見つかりません" }, { status: 404 });
  }

  // 会員は自分の書類のみ、管理者は全書類OK
  if (role === "MEMBER" && document.userId !== userId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  if (!document.fileUrl) {
    return NextResponse.json({ error: "PDFがアップロードされていません" }, { status: 404 });
  }

  // 一時URLを発行してリダイレクト
  const downloadUrl = await getFileUrl(document.fileUrl);

  return NextResponse.redirect(downloadUrl);
}
