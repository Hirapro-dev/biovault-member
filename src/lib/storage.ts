/**
 * ファイルストレージ抽象化レイヤー
 *
 * 現在: Vercel Blob Store (Private)
 * 将来: AWS S3 に差し替え予定
 *
 * 移行時はこのファイルの実装だけ変更すればOK
 */

import { put, del, getDownloadUrl } from "@vercel/blob";

export async function uploadFile(
  path: string,
  file: File | Blob,
  contentType: string = "application/pdf"
): Promise<string> {
  const blob = await put(path, file, {
    access: "public",
    contentType,
  });
  return blob.url;
}

export async function getFileUrl(storedUrl: string): Promise<string> {
  // Private Blob の場合、一時的なダウンロードURLを発行
  try {
    const downloadUrl = await getDownloadUrl(storedUrl);
    return downloadUrl;
  } catch {
    // フォールバック: そのままURLを返す
    return storedUrl;
  }
}

export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

// 将来の AWS S3 移行時の実装例:
//
// import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
//
// const s3 = new S3Client({ region: process.env.AWS_REGION });
//
// export async function uploadFile(path: string, file: File | Blob, contentType: string) {
//   const buffer = Buffer.from(await file.arrayBuffer());
//   await s3.send(new PutObjectCommand({
//     Bucket: process.env.S3_BUCKET,
//     Key: path,
//     Body: buffer,
//     ContentType: contentType,
//   }));
//   return `s3://${process.env.S3_BUCKET}/${path}`;
// }
//
// export async function getFileUrl(storedUrl: string): Promise<string> {
//   const key = storedUrl.replace(`s3://${process.env.S3_BUCKET}/`, "");
//   return getSignedUrl(s3, new GetObjectCommand({
//     Bucket: process.env.S3_BUCKET,
//     Key: key,
//   }), { expiresIn: 3600 }); // 1時間有効
// }
