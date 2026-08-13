/**
 * QQメソッド（Quantity and Quality method）に基づく計算。
 * 参照: https://wellaboswp.com/column/qq-method-presenteeism-guide/
 *
 * パフォーマンス低下度 = 1 - (仕事の量 ÷ 10) × (仕事の質 ÷ 10)
 * プレゼンティーイズム年間損失（万円）=
 *   有症状日数 × 12か月 × パフォーマンス低下度 × DAILY_LABOR_COST_MAN_YEN
 */

import { DAILY_LABOR_COST_MAN_YEN } from "./constants";

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** パフォーマンス低下度（0〜1） */
export function qqPerformanceDeclineRatio(workQuantity: number, workQuality: number): number {
  const q = clamp(workQuantity, 0, 10) / 10;
  const u = clamp(workQuality, 0, 10) / 10;
  return 1 - q * u;
}

/** プレゼンティーイズム年間損失（万円） */
export function qqAnnualLossCostManYen(params: {
  symptomDaysPast30: number;
  workQuantity: number;
  workQuality: number;
  isNoCondition: boolean;
}): number {
  if (params.isNoCondition) return 0;
  const p = qqPerformanceDeclineRatio(params.workQuantity, params.workQuality);
  const days = clamp(params.symptomDaysPast30, 0, 30);
  return days * 12 * p * DAILY_LABOR_COST_MAN_YEN;
}