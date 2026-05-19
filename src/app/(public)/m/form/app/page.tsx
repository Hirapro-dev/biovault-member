/**
 * MRT スキーム用の会員申込フォーム入口（/m/form/app）。
 *
 * 既存の /form/app の ApplyPageWrapper をそのまま再エクスポートする薄いラッパー。
 * フォーム本体は usePathname() で /m/ 配下を検知して
 * scheme = "MRT" として動作する（src/lib/scheme.ts / detectSchemeFromPath 参照）。
 *
 * これにより SCPP 版・MRT 版でフォームの実装を二重メンテせずに済む。
 */
export { default } from "../../../form/app/page";
