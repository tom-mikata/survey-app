import { describe, expect, it } from "vitest";
import { clamp, qqAnnualLossCostManYen, qqPerformanceDeclineRatio } from "../qq-method";

describe("clamp", () => {
  it("範囲内の値はそのまま返す", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("下限未満はloに丸める", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });
  it("上限超過はhiに丸める", () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("qqPerformanceDeclineRatio", () => {
  it("量=10・質=10のときパフォーマンス低下度は0", () => {
    expect(qqPerformanceDeclineRatio(10, 10)).toBe(0);
  });
  it("量=0・質=0のときパフォーマンス低下度は1", () => {
    expect(qqPerformanceDeclineRatio(0, 0)).toBe(1);
  });
  it("量=6・質=5のとき 1 - 0.6 * 0.5 = 0.7", () => {
    expect(qqPerformanceDeclineRatio(6, 5)).toBeCloseTo(0.7);
  });
  it("範囲外の値はclampされる", () => {
    expect(qqPerformanceDeclineRatio(15, 10)).toBe(0);
  });
});

describe("qqAnnualLossCostManYen", () => {
  it("isNoCondition=true のとき損失は0", () => {
    expect(
      qqAnnualLossCostManYen({ symptomDaysPast30: 20, workQuantity: 5, workQuality: 5, isNoCondition: true }),
    ).toBe(0);
  });

  it("有症状日数 × 12 × パフォーマンス低下度 × 1万円で計算される", () => {
    // days=18, q=6, u=5 → p = 1 - 0.6*0.5 = 0.7 → 18 * 12 * 0.7 * 1 = 151.2 万円
    expect(
      qqAnnualLossCostManYen({ symptomDaysPast30: 18, workQuantity: 6, workQuality: 5, isNoCondition: false }),
    ).toBeCloseTo(151.2);
  });

  it("有症状日数が0のとき損失は0", () => {
    expect(
      qqAnnualLossCostManYen({ symptomDaysPast30: 0, workQuantity: 5, workQuality: 5, isNoCondition: false }),
    ).toBe(0);
  });

  it("有症状日数が30を超えても30に丸められる", () => {
    const capped = qqAnnualLossCostManYen({
      symptomDaysPast30: 40, workQuantity: 5, workQuality: 5, isNoCondition: false,
    });
    const normal = qqAnnualLossCostManYen({
      symptomDaysPast30: 30, workQuantity: 5, workQuality: 5, isNoCondition: false,
    });
    expect(capped).toBeCloseTo(normal);
  });

  it("workQuantity=10・workQuality=10のとき損失は0（パフォーマンス低下なし）", () => {
    expect(
      qqAnnualLossCostManYen({ symptomDaysPast30: 20, workQuantity: 10, workQuality: 10, isNoCondition: false }),
    ).toBe(0);
  });
});