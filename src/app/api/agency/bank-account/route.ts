import { NextResponse } from "next/server";

/**
 * 振込先情報の変更は代理店アカウントから不可（閲覧専用）。
 * 変更は管理者側で行うため、このエンドポイントは 410 Gone を返す。
 */
export async function PATCH() {
  return NextResponse.json(
    { error: "振込先情報の変更は管理者までご連絡ください" },
    { status: 410 },
  );
}
