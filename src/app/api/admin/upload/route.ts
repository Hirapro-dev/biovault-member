import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";

// タイムアウト延長
export const maxDuration = 30;

/**
 * 管理者用 画像アップロードAPI
 * クライアント側で圧縮済みの画像をAWS S3にアップロード
 *
 * 大きな画像はクライアント側（Canvas API + WebP変換）で圧縮されてから送信される
 * サーバー側ではそのままS3にアップロード
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "ファイルが指定されていません" }, { status: 400 });
    }

    // ファイルサイズ制限（4MB — クライアント圧縮済みなので十分）
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "ファイルサイズが大きすぎます" }, { status: 400 });
    }

    // 画像ファイルのみ許可
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "画像ファイルのみアップロードできます" }, { status: 400 });
    }

    // ファイルパス生成
    const ext = file.type === "image/webp" ? "webp" : file.name.split(".").pop() || "jpg";
    const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // S3にアップロード
    const url = await uploadFile(path, file, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("アップロードエラー:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: `アップロードに失敗しました: ${message}` }, { status: 500 });
  }
}
