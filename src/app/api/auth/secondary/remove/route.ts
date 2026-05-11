/**
 * サブ Cookie から指定 userId のエントリを削除する。
 * ＋全削除（clearAll=true）にも対応。ログアウト時のクリーンアップなどに利用。
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  readSecondarySessions,
  serializeSecondarySessions,
  clearSecondarySessions,
} from "@/lib/secondary-sessions";

export async function POST(req: Request) {
  // 認証は問わない（ログアウト直後のクリーンアップでも呼ぶため）
  // ただし通常はセッションがある状態で呼ばれることを想定
  void getServerSession;
  void authOptions;

  const { userId, clearAll } = await req.json().catch(() => ({}));

  if (clearAll) {
    const res = NextResponse.json({ success: true, cleared: true });
    const cleared = clearSecondarySessions();
    res.cookies.set(cleared.name, cleared.value, cleared.options);
    return res;
  }

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId が指定されていません" }, { status: 400 });
  }

  const list = readSecondarySessions(req).filter((e) => e.userId !== userId);
  const res = NextResponse.json({ success: true, remaining: list.length });
  const sub = serializeSecondarySessions(list);
  res.cookies.set(sub.name, sub.value, sub.options);
  return res;
}
