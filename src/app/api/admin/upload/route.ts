import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import sharp from "sharp";

/**
 * 管理者用 画像アップロードAPI
 * 画像をロスレス圧縮（WebP lossless）してからAWS S3にアップロード
 *
 * - アップロード上限: 20MB（圧縮前）
 * - 出力形式: WebP（ロスレス圧縮）
 * - 長辺最大: 2000px にリサイズ（元が小さければそのまま）
 */

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_DIMENSION = 2000; // 長辺最大px

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

    // ファイルサイズ制限（20MB — 圧縮前）
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: "ファイルサイズは20MB以下にしてください" }, { status: 400 });
    }

    // 画像ファイルのみ許可
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "画像ファイルのみアップロードできます" }, { status: 400 });
    }

    // 元画像をBufferに変換
    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const originalSize = originalBuffer.length;

    // sharpでロスレス圧縮（WebP lossless）+ リサイズ
    const compressed = await sharp(originalBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: "inside",          // アスペクト比を維持して長辺をMAX_DIMENSIONに収める
        withoutEnlargement: true, // 元が小さい場合は拡大しない
      })
      .webp({ lossless: true }) // ロスレスWebP
      .toBuffer();

    const compressedSize = compressed.length;
    const ratio = Math.round((1 - compressedSize / originalSize) * 100);

    console.log(
      `画像圧縮: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (${ratio}%削減)`
    );

    // ファイルパス生成（拡張子はwebp）
    const path = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

    // S3にアップロード
    const url = await uploadFile(path, compressed, "image/webp");

    return NextResponse.json({
      url,
      originalSize,
      compressedSize,
      reduction: `${ratio}%`,
    });
  } catch (error) {
    console.error("アップロードエラー:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: `アップロードに失敗しました: ${message}` }, { status: 500 });
  }
}
