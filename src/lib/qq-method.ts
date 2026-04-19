/**
 * QQメソッド（Quantity and Quality method）に基づく計算。
 * 参照: https://wellaboswp.com/column/qq-method-presenteeism-guide/
 *
 * パフォーマンス低下度 = 1 - (仕事の量 ÷ 10) × (仕事の質 ÷ 10)
 * 年間損失コスト（円ではなく本アプリでは「万円」単位で保持）=
 *   (有症状日数 ÷ 30) × パフォーマンス低下度 × 月給（万円）× 12
 */

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** パフォーマンス低下度（0〜1） */
export function qqPerformanceDeclineRatio(workQuantity: number, workQuality: number): number {
  const q = clamp(workQuantity, 0, 10) / 10;
  const u = clamp(workQuality, 0, 10) / 10;
  return 1 - q * u;
}

/** 年間損失コスト（万円） */
export function qqAnnualLossCostManYen(params: {
  symptomDaysPast30: number;
  workQuantity: number;
  workQuality: number;
  monthlySalaryManYen: number;
  isNoCondition: boolean;
}): number {
  if (params.isNoCondition) return 0;
  const p = qqPerformanceDeclineRatio(params.workQuantity, params.workQuality);
  const days = clamp(params.symptomDaysPast30, 0, 30);
  const salary = params.monthlySalaryManYen > 0 ? params.monthlySalaryManYen : 30;
  return (days / 30) * p * salary * 12;
}
