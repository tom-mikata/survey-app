import { describe, expect, it } from "vitest";
import {
  filterResponses,
  laborLossTotalManYen,
  productivityAndAbsentTotalsManYen,
  responseAnnualLaborLossManYen,
  splitProductivityAndAbsentManYen,
  summarizeOccupational,
} from "../analytics";
import type { SurveyResponse } from "../types";

/** テスト用の SurveyResponse を最小限のフィールドで生成するヘルパー */
function makeResponse(overrides: Partial<SurveyResponse> = {}): SurveyResponse {
  return {
    id: "test-id",
    clientCode: "test",
    surveyRoundId: 1,
    submittedAt: "2026-08-01T00:00:00Z",
    fullName: "テスト 太郎",
    fullNameKana: "テスト タロウ",
    dateOfBirth: "1985-01-01",
    gender: "male",
    department: "営業部",
    employmentType: "正社員",
    symptomConditions: ["headache"],
    symptomConditionsOther: null,
    primaryCondition: "headache",
    symptomDaysPast30: 10,
    absenteeDaysPastYear: 0,
    workQuantity: 7,
    workQuality: 7,
    treatmentPlaces: [],
    treatmentPlacesOther: null,
    treatmentFrequency: null,
    dailyItems: [],
    dailyItemsOther: null,
    consultationHealth: "相談していない",
    consultationWork: "相談していない",
    consultationFamily: "相談していない",
    consultationMental: "相談していない",
    expertSupportIntent: "必要ない",
    ...overrides,
  };
}

describe("responseAnnualLaborLossManYen", () => {
  it("symptomConditions=['none']のとき損失は0", () => {
    const r = makeResponse({ symptomConditions: ["none"], primaryCondition: null, symptomDaysPast30: 20 });
    expect(responseAnnualLaborLossManYen(r)).toBe(0);
  });

  it("症状ありのとき QQ式で計算される", () => {
    // days=18, q=6, u=5 → p=0.7 → 18*12*0.7*1 = 151.2
    const r = makeResponse({ symptomDaysPast30: 18, workQuantity: 6, workQuality: 5 });
    expect(responseAnnualLaborLossManYen(r)).toBeCloseTo(151.2);
  });
});

describe("splitProductivityAndAbsentManYen", () => {
  it("不調なしのとき両方0", () => {
    const r = makeResponse({ symptomConditions: ["none"], absenteeDaysPastYear: 5 });
    const { productivityManYen, absentManYen } = splitProductivityAndAbsentManYen(r);
    expect(productivityManYen).toBe(0);
    expect(absentManYen).toBe(0);
  });

  it("欠勤損失 = absenteeDaysPastYear × DAILY_LABOR_COST_MAN_YEN（1万円/日）", () => {
    const r = makeResponse({ absenteeDaysPastYear: 5 });
    const { absentManYen } = splitProductivityAndAbsentManYen(r);
    expect(absentManYen).toBeCloseTo(5); // 5日 × 1万円 = 5万円
  });

  it("欠勤0日のとき欠勤損失は0", () => {
    const r = makeResponse({ absenteeDaysPastYear: 0 });
    const { absentManYen } = splitProductivityAndAbsentManYen(r);
    expect(absentManYen).toBe(0);
  });

  it("プレゼンティーイズム損失は QQ式と一致する", () => {
    const r = makeResponse({ symptomDaysPast30: 18, workQuantity: 6, workQuality: 5 });
    const { productivityManYen } = splitProductivityAndAbsentManYen(r);
    expect(productivityManYen).toBeCloseTo(responseAnnualLaborLossManYen(r));
  });
});

describe("laborLossTotalManYen", () => {
  it("プレゼンティーイズム＋欠勤損失の合計を返す", () => {
    const r = makeResponse({ symptomDaysPast30: 18, workQuantity: 6, workQuality: 5, absenteeDaysPastYear: 5 });
    const total = laborLossTotalManYen([r]);
    const { productivityManYen, absentManYen } = splitProductivityAndAbsentManYen(r);
    expect(total).toBeCloseTo(productivityManYen + absentManYen);
  });

  it("不調なしの回答は0", () => {
    const r = makeResponse({ symptomConditions: ["none"] });
    expect(laborLossTotalManYen([r])).toBe(0);
  });

  it("複数回答の合計が正しい", () => {
    const r1 = makeResponse({ id: "r1", symptomDaysPast30: 10, workQuantity: 8, workQuality: 8, absenteeDaysPastYear: 0 });
    const r2 = makeResponse({ id: "r2", symptomConditions: ["none"] });
    expect(laborLossTotalManYen([r1, r2])).toBeCloseTo(laborLossTotalManYen([r1]));
  });
});

describe("summarizeOccupational", () => {
  it("symptomConditions配列の複数症状を正しく集計する", () => {
    const r = makeResponse({ symptomConditions: ["headache", "lower_back"] });
    const result = summarizeOccupational([r]);
    expect(result.healthProblems.conditionCounts["headache"]).toBe(1);
    expect(result.healthProblems.conditionCounts["lower_back"]).toBe(1);
  });

  it("'none'は conditionCounts に含めない", () => {
    const r = makeResponse({ symptomConditions: ["none"] });
    const result = summarizeOccupational([r]);
    expect(result.healthProblems.conditionCounts["none"]).toBeUndefined();
  });

  it("absenteeDaysPastYear > 0 の人を欠勤者として数える", () => {
    const r1 = makeResponse({ id: "r1", symptomDaysPast30: 15, workQuantity: 5, workQuality: 5, absenteeDaysPastYear: 3 });
    const r2 = makeResponse({ id: "r2", symptomDaysPast30: 15, workQuantity: 5, workQuality: 5, absenteeDaysPastYear: 0 });
    const result = summarizeOccupational([r1, r2]);
    expect(result.absenteeismAmongInterference.count).toBe(1);
  });

  it("全員不調なしのとき健康問題率は0", () => {
    const rows = [
      makeResponse({ id: "r1", symptomConditions: ["none"] }),
      makeResponse({ id: "r2", symptomConditions: ["none"] }),
    ];
    const result = summarizeOccupational(rows);
    expect(result.healthProblems.rate).toBe(0);
    expect(result.presenteeism.count).toBe(0);
  });
});

describe("filterResponses", () => {
  const rows: SurveyResponse[] = [
    makeResponse({ id: "r1", department: "営業部", gender: "male", dateOfBirth: "1985-01-01" }),
    makeResponse({ id: "r2", department: "総務部", gender: "female", dateOfBirth: "1995-06-15" }),
  ];

  it("tab='all'のとき全行を返す", () => {
    expect(filterResponses(rows, "department", "all")).toHaveLength(2);
  });

  it("部署フィルターが正しく動作する", () => {
    const result = filterResponses(rows, "department", "営業部");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r1");
  });

  it("性別フィルターが正しく動作する", () => {
    const result = filterResponses(rows, "gender", "female");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("r2");
  });

  it("年代フィルターが dateOfBirth から計算される（1995年生→20代または30代）", () => {
    const result = filterResponses(rows, "age", "20s");
    // 2026年時点で1995年生まれは30歳（30代）なのでマッチしない
    const result30s = filterResponses(rows, "age", "30s");
    expect(result30s[0].id).toBe("r2");
  });
});

describe("productivityAndAbsentTotalsManYen", () => {
  it("プレゼンティーイズムと欠勤の合計を正しく集計する", () => {
    const r1 = makeResponse({ id: "r1", symptomDaysPast30: 18, workQuantity: 6, workQuality: 5, absenteeDaysPastYear: 3 });
    const r2 = makeResponse({ id: "r2", symptomConditions: ["none"] });
    const totals = productivityAndAbsentTotalsManYen([r1, r2]);
    const { productivityManYen, absentManYen } = splitProductivityAndAbsentManYen(r1);
    expect(totals.productivity).toBeCloseTo(productivityManYen);
    expect(totals.absent).toBeCloseTo(absentManYen);
  });
});