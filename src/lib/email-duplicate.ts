import prisma from "./prisma";

/**
 * メールアドレス重複チェック（許可リスト対応）
 *
 * 仕様：
 * - 通常は同じメアドで2つ以上のUserレコードを作れない
 * - 環境変数 EMAIL_DUPLICATE_ALLOWLIST（カンマ区切り）に列挙されたメアドのみ重複可
 * - 同一人物が会員＋代理店アカウントを両立する等の特殊運用に対応
 *
 * 使用例：
 *   const dup = await checkEmailDuplicate(email);
 *   if (dup) return NextResponse.json({ error: dup }, { status: 400 });
 */

/** 許可リストに含まれているメアドか（大文字小文字無視・前後空白除去） */
export function isEmailAllowedToDuplicate(email: string): boolean {
  const allowlist = (process.env.EMAIL_DUPLICATE_ALLOWLIST || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
  return allowlist.includes(email.trim().toLowerCase());
}

/**
 * 新規ユーザー作成時の重複チェック。
 * @param email チェック対象メアド
 * @param excludeUserId 自分自身のIDを除外したい場合（更新時）に指定
 * @returns 重複していたらエラーメッセージ、OK なら null
 */
export async function checkEmailDuplicate(
  email: string,
  excludeUserId?: string,
): Promise<string | null> {
  if (!email) return null;
  if (isEmailAllowedToDuplicate(email)) return null;

  const where: { email: string; id?: { not: string } } = { email };
  if (excludeUserId) where.id = { not: excludeUserId };
  const existing = await prisma.user.findFirst({ where, select: { id: true } });
  if (existing) return "このメールアドレスは既に使用されています";
  return null;
}
