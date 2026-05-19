/**
 * MRT スキーム用の代理店登録申込フォーム入口（/m/agency/form/app）。
 *
 * 既存の /agency/form/app の AgencyApplyPageWrapper をそのまま再エクスポートする薄いラッパー。
 * フォーム本体は usePathname() で /m/ 配下を検知して
 * scheme = "MRT" として動作する（src/lib/scheme.ts / detectSchemeFromPath 参照）。
 */
export { default } from "../../../../agency/form/app/page";
