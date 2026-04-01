import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

/**
 * 管理者用 画像アップロードAPI
 * サムネイル画像やエディター内の画像をVercel Blobにアップロード
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 });
    }

    // ファイルサイズ制限（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "ファイルサイズは5MB以下にしてください" }, { status: 400 });
    }

    // 画像ファイルのみ許可
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "画像ファイルのみアップロードできます" }, { status: 400 });
    }

    // ファイルパス生成
    const ext = file.name.split(".").pop() || "jpg";
    const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const url = await uploadFile(path, file, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("アップロードエラー:", error);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
