/**
 * 複数アカウント保持（サブセッション）管理ユーティリティ
 *
 * NextAuth の標準セッションは「メイン Cookie 1つに1セッション」前提のため、
 * 別途 サブ Cookie に他アカウントの JWT を保存しておき、UI から「アカウント切り替え」
 * できるようにする。切替時はメイン Cookie とサブ Cookie 内の対象トークンを入れ替える。
 *
 * セキュリティ要点:
 * - サブ Cookie は HttpOnly + Secure(本番) + SameSite=Lax
 * - JWT は NextAuth が発行したものをそのまま流用（追加の署名処理なし）
 * - 最大 5 アカウントまで（Cookie サイズと現実的な必要数のバランス）
 * - 期限切れエントリは自動除外
 */
import type { NextRequest } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const SECONDARY_COOKIE_NAME = "bv-secondary-sessions";
export const MAX_SECONDARY_ACCOUNTS = 5;
const COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30日（NextAuthのJWTと揃える）

/** NextAuthセッションCookieの名前を環境別に取得 */
export function getNextAuthCookieName(): string {
  return process.env.NEXTAUTH_URL?.startsWith("https://")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";
}

/** サブセッションエントリ */
export type SecondarySessionEntry = {
  /** NextAuthが発行したJWT（暗号化済み）。そのままメインCookieに戻せる */
  token: string;
  userId: string;
  loginId: string;
  role: string;
  name: string;
  /** 追加した日時 (UNIX秒) */
  addedAt: number;
  /** 有効期限 (UNIX秒)。JWTの有効期限と揃える */
  expiresAt: number;
};

/** Cookieオプション（書き込み用） */
function buildCookieOptions(): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NEXTAUTH_URL?.startsWith("https://") ?? false,
    maxAge: COOKIE_MAX_AGE_SEC,
  };
}

/** リクエストCookieからサブセッション一覧を読み出す（期限切れは自動除外） */
export function readSecondarySessions(req: NextRequest | Request): SecondarySessionEntry[] {
  let raw: string | undefined;
  if ("cookies" in req && typeof (req as NextRequest).cookies?.get === "function") {
    raw = (req as NextRequest).cookies.get(SECONDARY_COOKIE_NAME)?.value;
  } else {
    // Request オブジェクトの場合は手動でパース
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${SECONDARY_COOKIE_NAME}=`));
    raw = match?.substring(SECONDARY_COOKIE_NAME.length + 1);
  }
  if (!raw) return [];
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    if (!Array.isArray(parsed)) return [];
    const now = Math.floor(Date.now() / 1000);
    return (parsed as unknown[])
      .filter((e): e is SecondarySessionEntry => {
        if (!e || typeof e !== "object") return false;
        const ent = e as Record<string, unknown>;
        return typeof ent.token === "string"
          && typeof ent.userId === "string"
          && typeof ent.loginId === "string"
          && typeof ent.role === "string"
          && typeof ent.name === "string"
          && typeof ent.addedAt === "number"
          && typeof ent.expiresAt === "number"
          && ent.expiresAt > now;
      });
  } catch {
    return [];
  }
}

/** サブセッション一覧を Cookie として serialize */
export function serializeSecondarySessions(list: SecondarySessionEntry[]): {
  name: string;
  value: string;
  options: Partial<ResponseCookie>;
} {
  const value = encodeURIComponent(JSON.stringify(list));
  return { name: SECONDARY_COOKIE_NAME, value, options: buildCookieOptions() };
}

/** サブセッション Cookie を削除するための serialize */
export function clearSecondarySessions(): {
  name: string;
  value: string;
  options: Partial<ResponseCookie>;
} {
  return {
    name: SECONDARY_COOKIE_NAME,
    value: "",
    options: { ...buildCookieOptions(), maxAge: 0 },
  };
}

/** UIに公開する安全な情報のみを返す（tokenは含めない） */
export type SecondarySessionPublic = Omit<SecondarySessionEntry, "token">;
export function toPublic(entry: SecondarySessionEntry): SecondarySessionPublic {
  const { token: _t, ...rest } = entry;
  void _t;
  return rest;
}
