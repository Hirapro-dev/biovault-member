import prisma from "./prisma";
import crypto from "crypto";
import type { AffiliateChannel, AffiliateProfile } from "@prisma/client";

// ────────────────────────────────────────
// ご紹介協力制度（アフィリエイト）共通ロジック
// ────────────────────────────────────────

// 帰属Cookie（LP閲覧時に発行し、リード登録時に参照）
export const AFFILIATE_COOKIE = "bv_aff";
export const AFFILIATE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30日

// SiteSetting のキー定義
export const AFFILIATE_SETTING_KEYS = {
  autoApprove: "affiliate_auto_approve",                      // "true" | "false"
  rewardLeadNw: "affiliate_reward_lead_nw",                   // 第一報酬: 人脈繋がり
  rewardLeadKawara: "affiliate_reward_lead_kawara",           // 第一報酬: KAWARA版
  rewardConversionNw: "affiliate_reward_conversion_nw",       // 第二報酬: 人脈繋がり
  rewardConversionKawara: "affiliate_reward_conversion_kawara", // 第二報酬: KAWARA版
} as const;

export type AffiliateSettings = {
  autoApprove: boolean;
  rewardLead: Record<AffiliateChannel, number>;
  rewardConversion: Record<AffiliateChannel, number>;
};

// SiteSetting から設定一式を取得（未設定はデフォルト値）
export async function getAffiliateSettings(): Promise<AffiliateSettings> {
  const keys = Object.values(AFFILIATE_SETTING_KEYS);
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: [...keys] } },
    select: { key: true, content: true },
  });
  const map = new Map(rows.map((r) => [r.key, r.content]));
  const num = (key: string) => {
    const v = parseInt(map.get(key) || "", 10);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };
  return {
    autoApprove: map.get(AFFILIATE_SETTING_KEYS.autoApprove) === "true",
    rewardLead: {
      NW: num(AFFILIATE_SETTING_KEYS.rewardLeadNw),
      KAWARA: num(AFFILIATE_SETTING_KEYS.rewardLeadKawara),
    },
    rewardConversion: {
      NW: num(AFFILIATE_SETTING_KEYS.rewardConversionNw),
      KAWARA: num(AFFILIATE_SETTING_KEYS.rewardConversionKawara),
    },
  };
}

// 報酬額の解決: 協力者の個別設定 → なければチャネル別デフォルト
export function resolveRewardAmount(
  profile: Pick<AffiliateProfile, "channel" | "rewardAmountLead" | "rewardAmountConversion">,
  type: "LEAD" | "CONVERSION",
  settings: AffiliateSettings
): number {
  if (type === "LEAD") {
    return profile.rewardAmountLead ?? settings.rewardLead[profile.channel];
  }
  return profile.rewardAmountConversion ?? settings.rewardConversion[profile.channel];
}

// AF-0001 形式の協力者コードを採番（AG-/BV- と同じ方式）
export async function generateAffiliateCode(): Promise<string> {
  const last = await prisma.affiliateProfile.findFirst({
    orderBy: { affiliateCode: "desc" },
    select: { affiliateCode: true },
  });
  const nextNum = last ? parseInt(last.affiliateCode.replace("AF-", ""), 10) + 1 : 1;
  return `AF-${String(nextNum).padStart(4, "0")}`;
}

// IPアドレスは生値を保存せずSHA-256ハッシュのみ保持（不正検知用）
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip).digest("hex");
}

// リクエストからクライアントIPを取得（Vercel/プロキシ経由対応）
export function clientIpFrom(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

// 協力者の専用LP URLを生成
export function affiliateLpUrl(affiliateCode: string): string {
  const base = process.env.NEXTAUTH_URL || "https://member.biovault.jp";
  return `${base.replace(/\/$/, "")}/lp/ipsf/?ref=${affiliateCode}`;
}

// リード専用の適合確認フォームURLを生成
export function ipsCheckFormUrl(formToken: string): string {
  const base = process.env.NEXTAUTH_URL || "https://member.biovault.jp";
  return `${base.replace(/\/$/, "")}/form/ips-check/${formToken}`;
}

// ── ログインID・パスワード生成（既存applyルートと同方式） ──

const KANA_MAP: Record<string, string> = {"ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko","サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to","ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho","マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo","ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n","ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go","ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo","ダ":"da","ヂ":"di","ヅ":"du","デ":"de","ド":"do","バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo","パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po","ッ":"tt","ー":""};

function kataToRomaji(kana: string): string {
  let r = "", i = 0;
  while (i < kana.length) {
    if (i + 1 < kana.length && KANA_MAP[kana.substring(i, i + 2)]) { r += KANA_MAP[kana.substring(i, i + 2)]; i += 2; continue; }
    if (kana[i] === "ッ" && i + 1 < kana.length) { const n = KANA_MAP[kana[i + 1]]; if (n) r += n[0]; i++; continue; }
    if (KANA_MAP[kana[i]] !== undefined) r += KANA_MAP[kana[i]];
    i++;
  }
  return r;
}

export async function generateUniqueLoginId(nameKana: string, fallbackBase = "partner"): Promise<string> {
  const base = kataToRomaji(nameKana.trim().split(/[\s　]+/)[0]).toLowerCase() || fallbackBase;
  for (let attempt = 0; attempt < 100; attempt++) {
    const num = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const loginId = `${base}${num}`;
    const exists = await prisma.user.findUnique({ where: { loginId } });
    if (!exists) return loginId;
  }
  throw new Error("ログインIDの生成に失敗しました");
}

export function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}
