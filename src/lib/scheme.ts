/**
 * 流入スキーム（契約主体の会社）情報を一元管理するモジュール。
 *
 * BioVault という会員制サービス自体は共通だが、契約主体となる会社が
 * 「株式会社SCPP」と「株式会社MRT」の2系統に分かれる。
 *
 * - SCPP: 既存の流入経路（/form/app, /agency/form/app）
 * - MRT : /m/ 配下の流入経路（/m/form/app, /m/agency/form/app）
 *
 * 会員ログイン後に表示される同意書・契約書・特商法表記等は、
 * user.scheme に応じて本ファイルの会社情報を表示する。
 */

import { Scheme } from "@prisma/client";

export type SchemeKey = "SCPP" | "MRT";

export type CompanyInfo = {
  /** スキーム識別子 */
  scheme: SchemeKey;
  /** 正式社名（同意書等の本文で使用） */
  name: string;
  /** 「（以下「当社」という。）」等の文脈で使う略称 */
  shortName: string;
  /** 郵便番号 */
  postalCode: string;
  /** 所在地 */
  address: string;
  /** 電話番号 */
  phone: string;
  /** 代表者役職 + 氏名 */
  representative: string;
  /** サポート問い合わせメール */
  supportEmail: string;
  /** 設立年月日（表示用文字列） */
  establishedAt: string;
  /** 一覧画面でのバッジ表示色（Tailwind クラス） */
  badgeClass: string;
};

const COMPANIES: Record<SchemeKey, CompanyInfo> = {
  SCPP: {
    scheme: "SCPP",
    name: "株式会社SCPP",
    shortName: "SCPP",
    postalCode: "107-6012",
    address: "東京都港区赤坂1-12-32 アークヒルズ 森ビル12F",
    phone: "0120-788-839",
    representative: "代表取締役",
    supportEmail: "info@biovault.jp",
    establishedAt: "",
    badgeClass: "bg-blue-900/30 text-blue-300 border-blue-500/40",
  },
  MRT: {
    scheme: "MRT",
    name: "株式会社MRT",
    shortName: "MRT",
    postalCode: "107-6012",
    address: "東京都港区赤坂1-12-32 アークヒルズ 森ビル12F",
    phone: "0120-325-699",
    representative: "代表取締役 守田和之",
    // メールアドレスは BioVault ドメイン（info@biovault.jp）で SCPP と共通運用する
    supportEmail: "info@biovault.jp",
    establishedAt: "2020年2月7日",
    badgeClass: "bg-orange-900/30 text-orange-300 border-orange-500/40",
  },
};

/**
 * Prisma の Scheme enum / 任意の入力値から会社情報を取得する。
 * 不明な値は SCPP（既存スキーム）にフォールバック。
 */
export function getCompany(scheme: Scheme | SchemeKey | string | null | undefined): CompanyInfo {
  if (scheme === "MRT") return COMPANIES.MRT;
  return COMPANIES.SCPP;
}

/**
 * URL パスから流入スキームを判定する。
 *  - /m/ 配下からの遷移であれば MRT
 *  - それ以外は SCPP（既存）
 */
export function detectSchemeFromPath(pathname: string | null | undefined): SchemeKey {
  if (!pathname) return "SCPP";
  return pathname.startsWith("/m/") || pathname === "/m" ? "MRT" : "SCPP";
}

/**
 * リクエストボディ等で受け取った scheme 文字列を安全に正規化する。
 */
export function normalizeScheme(value: unknown): SchemeKey {
  return value === "MRT" ? "MRT" : "SCPP";
}

/**
 * 一覧画面のバッジ表示などで使うラベル。
 */
export function getSchemeLabel(scheme: Scheme | SchemeKey | string | null | undefined): string {
  return getCompany(scheme).shortName;
}

/**
 * スキームに対応する申込フォームURLのパスプレフィックスを返す。
 *  - SCPP: "" （ルート直下）
 *  - MRT : "/m"
 */
export function getSchemePathPrefix(scheme: Scheme | SchemeKey | string | null | undefined): string {
  return scheme === "MRT" ? "/m" : "";
}
