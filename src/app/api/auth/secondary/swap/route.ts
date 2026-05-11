/**
 * 「アカウント切替」フロー：
 *   サブ Cookie に保存されている指定アカウントの JWT をメイン Cookie に昇格させ、
 *   現在のメイン Cookie の JWT は（まだ有効期限内なら）サブ Cookie に降格保存。
 *   結果として「ワンクリックでアカウントが入れ替わる（パスワード再入力なし）」。
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
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { userId: targetUserId } = await req.json();
  if (!targetUserId || typeof targetUserId !== "string") {
    return NextResponse.json({ error: "切替先のユーザーIDが指定されていません" }, { status: 400 });
  }

  // サブ一覧から対象を検索
  const allSubs = readSecondarySessions(req);
  const target = allSubs.find((e) => e.userId === targetUserId);
  if (!target) {
    return NextResponse.json({ error: "指定されたアカウントが見つかりません（期限切れの可能性）" }, { status: 404 });
  }

  // 対象ユーザーが現在もアクティブか念のため確認（無効化されていたら切替拒否）
  const targetDb = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, isActive: true, role: true, name: true, loginId: true },
  });
  if (!targetDb || !targetDb.isActive) {
    return NextResponse.json({ error: "対象アカウントは現在利用できません" }, { status: 400 });
  }

  // 現在のメインCookieのトークンをサブCookieへ降格（再切替に備えて）
  const cookieHeader = req.headers.get("cookie") || "";
  const mainCookieName = getNextAuthCookieName();
  const fallbackName = "next-auth.session-token";
  const tokenMatch = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${mainCookieName}=`))
    || cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${fallbackName}=`));
  const currentToken = tokenMatch ? tokenMatch.substring(tokenMatch.indexOf("=") + 1) : "";

  const currentUser = session.user as { id: string };
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 30 * 24 * 60 * 60;

  let updatedSubs = allSubs.filter((e) => e.userId !== targetUserId); // ターゲットを除外
  if (currentToken && currentUser.id !== targetUserId) {
    // 現在のアカウントを先頭にサブへ降格（同じuserIdが既にあれば置き換え）
    updatedSubs = updatedSubs.filter((e) => e.userId !== currentUser.id);
    const dbCurrent = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { loginId: true, name: true, role: true },
    });
    if (dbCurrent) {
      const downgraded: SecondarySessionEntry = {
        token: currentToken,
        userId: currentUser.id,
        loginId: dbCurrent.loginId,
        role: dbCurrent.role,
        name: dbCurrent.name,
        addedAt: now,
        expiresAt,
      };
      updatedSubs = [downgraded, ...updatedSubs];
    }
  }
  updatedSubs = updatedSubs.slice(0, MAX_SECONDARY_ACCOUNTS);

  // 切替先トークンを最終ログイン日時更新（NextAuth callback で行われるので軽微）
  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { lastLoginAt: new Date() },
    });
  } catch (e) {
    console.error("Failed to update lastLoginAt on account switch:", e);
  }

  const res = NextResponse.json({
    success: true,
    user: { id: targetDb.id, role: targetDb.role, name: targetDb.name, loginId: targetDb.loginId },
  });

  // メインCookieに切替先トークンをセット
  const isHttps = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  res.cookies.set(mainCookieName, target.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isHttps,
    maxAge: 30 * 24 * 60 * 60,
  });

  // サブCookieを更新
  const sub = serializeSecondarySessions(updatedSubs);
  res.cookies.set(sub.name, sub.value, sub.options);

  return res;
}
