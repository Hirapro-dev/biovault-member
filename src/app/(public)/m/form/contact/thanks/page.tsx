/**
 * MRT スキーム用のお問い合わせ送信完了画面（/m/form/contact/thanks）。
 *
 * 既存の /form/contact/thanks をそのまま再エクスポートする薄いラッパー。
 * 本体は usePathname() で /m/ 配下を検知して scheme = "MRT" として動作する。
 */
export { default } from "../../../../form/contact/thanks/page";
