/**
 * 保存中のサブアカウント一覧を返す（UI 表示用）。
 * tokenは返さない。
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readSecondarySessions, toPublic, MAX_SECONDARY_ACCOUNTS } from "@/lib/secondary-sessions";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const all = readSecondarySessions(req);
  const currentUserId = (session.user as { id: string }).id;
  // 現在ログイン中のアカウントは候補から除外
  const accounts = all.filter((e) => e.userId !== currentUserId).map(toPublic);

  return NextResponse.json({ accounts, max: MAX_SECONDARY_ACCOUNTS });
}
