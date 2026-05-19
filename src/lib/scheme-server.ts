/**
 * サーバーコンポーネント向けの scheme 取得ヘルパー。
 *
 * セッションのユーザーIDからDBの scheme を引き、対応する会社情報を返す。
 * クライアントコンポーネントからは使わないこと。
 */
import prisma from "./prisma";
import { getSession } from "./auth-helpers";
import { getCompany, type CompanyInfo, type SchemeKey } from "./scheme";

/**
 * 現在ログインしているユーザーの会社情報を返す。
 * 未ログイン・該当ユーザーなしの場合は SCPP（既存）にフォールバック。
 */
export async function getCurrentCompany(): Promise<CompanyInfo> {
  const session = await getSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return getCompany("SCPP");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { scheme: true },
  });
  return getCompany(user?.scheme ?? "SCPP");
}

/**
 * 現在ログインしているユーザーの scheme キーのみを返す（軽量版）。
 */
export async function getCurrentScheme(): Promise<SchemeKey> {
  const session = await getSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return "SCPP";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { scheme: true },
  });
  return (user?.scheme as SchemeKey | undefined) ?? "SCPP";
}
