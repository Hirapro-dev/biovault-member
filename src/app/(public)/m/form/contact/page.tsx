/**
 * MRT スキーム用のお問い合わせフォーム入口（/m/form/contact）。
 *
 * 既存の /form/contact をそのまま再エクスポートする薄いラッパー。
 * フォーム本体は usePathname() で /m/ 配下を検知して
 * scheme = "MRT" として動作する（src/lib/scheme.ts / detectSchemeFromPath 参照）。
 */
export { default } from "../../../form/contact/page";
