/**
 * 培養上清液サービスのプラン定義ヘルパー
 *
 * プランごとの施術可能回数（合計セッション数）を算出する。
 * 会員側（/culture-fluid/apply）と管理者側（CultureFluidStatusManager）の
 * 両方から参照される共通ロジック。
 */

/**
 * プランタイプごとの合計施術回数
 * - iv_drip_1: 点滴1回分（10ml） = 1回
 * - iv_drip_5: 点滴5回分（50ml）＋1回分（10ml） = 6回
 * - injection_1: 注射1回分（3ml） = 1回
 * - injection_5: 注射5回分（15ml）＋1回分（3ml） = 6回
 */
const PLAN_TOTAL_SESSIONS: Record<string, number> = {
  iv_drip_1: 1,
  iv_drip_1_included: 1, // iPSサービス（880万円）付属の点滴1回分
  iv_drip_5: 6,
  injection_1: 1,
  injection_5: 6,
};

/**
 * プランタイプから合計施術回数を取得する
 * 未知のプランタイプの場合は 1 を返す（安全側）
 */
export function getTotalSessions(planType: string): number {
  return PLAN_TOTAL_SESSIONS[planType] ?? 1;
}

/**
 * 残りの施術回数を算出する
 */
export function getRemainingSessions(planType: string, completedSessions: number): number {
  const total = getTotalSessions(planType);
  return Math.max(0, total - completedSessions);
}

/**
 * 全ての施術が完了したかどうか判定する
 */
export function isAllSessionsCompleted(planType: string, completedSessions: number): boolean {
  return completedSessions >= getTotalSessions(planType);
}
