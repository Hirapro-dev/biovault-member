import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";

// 書類一覧取得
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;

  const documents = await prisma.document.findMany({
    where: { userId: id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(documents);
}

// PDF アップロード
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const documentId = formData.get("documentId") as string | null;

  if (!file || !documentId) {
    return NextResponse.json({ error: "ファイルと書類IDは必須です" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDFファイルのみアップロードできます" }, { status: 400 });
  }

  // 10MB制限
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "ファイルサイズは10MB以下にしてください" }, { status: 400 });
  }

  // ストレージにアップロード（現在: Vercel Blob / 将来: AWS S3）
  const fileUrl = await uploadFile(
    `documents/${id}/${documentId}-${Date.now()}.pdf`,
    file,
    "application/pdf"
  );

  // DB更新
  const document = await prisma.document.update({
    where: { id: documentId },
    data: {
      fileUrl,
      status: "SIGNED",
      signedAt: new Date(),
    },
  });

  return NextResponse.json({ document, url: fileUrl });
}
