/**
 * ファイルストレージ（AWS S3）
 *
 * 環境変数:
 *   AWS_S3_REGION        - S3のリージョン（例: ap-northeast-1）
 *   AWS_S3_ACCESS_KEY    - IAMアクセスキー（SESと共用可）
 *   AWS_S3_SECRET_KEY    - IAMシークレットキー（SESと共用可）
 *   AWS_S3_BUCKET        - バケット名（例: biovault-assets）
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_S3_REGION || process.env.AWS_SES_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY || process.env.AWS_SES_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_S3_SECRET_KEY || process.env.AWS_SES_SECRET_KEY || "",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "biovault-member-images";
const REGION = process.env.AWS_S3_REGION || process.env.AWS_SES_REGION || "ap-northeast-1";

/**
 * ファイルをS3にアップロード
 * @returns 公開URL
 */
export async function uploadFile(
  path: string,
  file: File | Blob | Buffer,
  contentType: string = "application/octet-stream"
): Promise<string> {
  // File/Blob → Buffer に変換
  let body: Buffer;
  if (Buffer.isBuffer(file)) {
    body = file;
  } else {
    const arrayBuffer = await (file as Blob).arrayBuffer();
    body = Buffer.from(arrayBuffer);
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: path,
      Body: body,
      ContentType: contentType,
    })
  );

  // 公開URL（パブリックバケットの場合）
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${path}`;
}

/**
 * ファイルの公開URLを返す（S3パブリックバケットの場合はそのまま）
 */
export async function getFileUrl(storedUrl: string): Promise<string> {
  return storedUrl;
}

/**
 * S3からファイルを削除
 */
export async function deleteFile(url: string): Promise<void> {
  // URLからキーを抽出
  const key = url.replace(`https://${BUCKET}.s3.${REGION}.amazonaws.com/`, "");

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}
