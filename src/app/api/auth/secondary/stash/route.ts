/**
 * 「+ 別のアカウントを追加」フロー：
 *   現在ログイン中の NextAuth セッショントークンをサブ Cookie に退避し、
 *   メイン Cookie（next-auth.session-token）を消す。
 *   レスポンス後、クライアントはログイン画面に遷移し、別アカウントでログイン可能。
 *
 * 退避しておくことで「別アカウントログイン後、サブから戻して切替できる」状態を作る。
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  readSecondarySessions,
  serializeSecondarySessions,
  getNextAuthCookieName,
  MAX_SECONDARY_ACCOUNTS,
  type SecondarySessionEntry,
} from "@/lib/secondary-sessions";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // 現在のメインCookieからJWTを取得
  const cookieHeader = req.headers.get("cookie") || "";
  const cookieName = getNextAuthCookieName();
  const fallbackName = "next-auth.session-token";
  const tokenMatch = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${cookieName}=`))
    || cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${fallbackName}=`));
  if (!tokenMatch) {
    return NextResponse.json({ error: "現在のセッションを取得できませんでした" }, { status: 400 });
  }
  const eqIdx = tokenMatch.indexOf("=");
  const token = tokenMatch.substring(eqIdx + 1);
  if (!token) {
    return NextResponse.json({ error: "セッショントークンが空です" }, { status: 400 });
  }

  const u = session.user as { id: string; role: string; name?: string };
  // loginIdはセッションに含まれていないことがあるためDBから取得すべきだが、コスト削減のためsession.user.nameをloginIdの代用とせずに別途取得する
  // ここではnameのみ使用（loginIdはswap時に使うわけではないので表示用）
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 30 * 24 * 60 * 60; // 30日（NextAuth maxAge と揃える）

  // loginIdをDBから取得（少コスト）
  const { default: prisma } = await import("@/lib/prisma");
  const dbUser = await prisma.user.findUnique({
    where: { id: u.id },
    select: { loginId: true, name: true, role: true },
  });
  if (!dbUser) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const newEntry: SecondarySessionEntry = {
    token,
    userId: u.id,
    loginId: dbUser.loginId,
    role: dbUser.role,
    name: dbUser.name,
    addedAt: now,
    expiresAt,
  };

  // 既存のサブ一覧を読み込み、同じuserIdは除外して先頭に追加
  const existing = readSecondarySessions(req).filter((e) => e.userId !== newEntry.userId);
  const updated = [newEntry, ...existing].slice(0, MAX_SECONDARY_ACCOUNTS);

  // レスポンスに2つのCookie操作: メイン削除 & サブ更新
  const res = NextResponse.json({ success: true });
  const sub = serializeSecondarySessions(updated);
  res.cookies.set(sub.name, sub.value, sub.options);
  // メインのNextAuthセッションCookieを削除（HTTPS/HTTP両対応）
  res.cookies.set(cookieName, "", { ...sub.options, maxAge: 0 });
  if (cookieName !== fallbackName) {
    res.cookies.set(fallbackName, "", { ...sub.options, maxAge: 0, secure: false });
  }
  return res;
}
