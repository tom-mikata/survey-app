import { AGE_GROUPS, GENDERS } from "./constants";
import { qqAnnualLossCostManYen, qqPerformanceDeclineRatio } from "./qq-method";
import type { PainAreaCode, QqConditionId, SummaryAxis, SurveyResponse } from "./types";

/** 画面の積み上げ凡例（5カテゴリ） */
export type LossStackKey =
  | "non_pain_disease"
  | "lower_back"
  | "limb_pain"
  | "headache"
  | "neck_shoulder";

const CONDITION_TO_STACK: Record<QqConditionId, LossStackKey> = {
  none: "non_pain_disease",
  allergy: "non_pain_disease",
  skin: "non_pain_disease",
  infection: "non_pain_disease",
  gi: "non_pain_disease",
  limb_joint: "limb_pain",
  lower_back: "lower_back",
  neck_shoulder: "neck_shoulder",
  headache: "headache",
  dental: "non_pain_disease",
  mental: "non_pain_disease",
  sleep: "non_pain_disease",
  fatigue: "non_pain_disease",
  eye: "non_pain_disease",
  mens_pain: "non_pain_disease",
  mens_other: "non_pain_disease",
  other: "non_pain_disease",
};

/** ヒートマップ用：主要不調から部位への参照（簡易マッピング） */
const CONDITION_TO_PAIN: Record<QqConditionId, PainAreaCode[]> = {
  none: [],
  allergy: ["head"],
  skin: ["hand"],
  infection: ["head"],
  gi: [],
  limb_joint: ["wrist", "hand", "knee", "ankle"],
  lower_back: ["lower_back"],
  neck_shoulder: ["neck", "shoulder"],
  headache: ["head"],
  dental: ["head"],
  mental: ["head"],
  sleep: ["head"],
  fatigue: ["shoulder", "lower_back"],
  eye: ["head"],
  mens_pain: ["lower_back"],
  mens_other: ["head"],
  other: ["lower_back"],
};

function conditionToStack(c: QqConditionId): LossStackKey {
  return CONDITION_TO_STACK[c];
}

/** QQ式による年間損失（万円）。欠勤のある回答は可視化用に一部を欠勤関連として配分 */
export function responseAnnualLaborLossManYen(r: SurveyResponse): number {
  return qqAnnualLossCostManYen({
    symptomDaysPast30: r.symptomDaysPast30,
    workQuantity: r.workQuantity,
    workQuality: r.workQuality,
    monthlySalaryManYen: r.monthlySalaryManYen,
    isNoCondition: r.qqCondition === "none",
  });
}

/** プレゼンティーイズム由来とみなす損失 / 欠勤関連の目安分割（ダッシュボード帯の内訳用） */
export function splitProductivityAndAbsentManYen(r: SurveyResponse): {
  productivityManYen: number;
  absentManYen: number;
} {
  const total = responseAnnualLaborLossManYen(r);
  if (total <= 0) return { productivityManYen: 0, absentManYen: 0 };
  if (!r.hadAbsenteeismOnSymptomDays) return { productivityManYen: total, absentManYen: 0 };
  const absentPortion = 0.07;
  return {
    productivityManYen: total * (1 - absentPortion),
    absentManYen: total * absentPortion,
  };
}

function stackAllocationForResponse(r: SurveyResponse): Record<LossStackKey, number> {
  const keys: LossStackKey[] = [
    "non_pain_disease",
    "lower_back",
    "limb_pain",
    "headache",
    "neck_shoulder",
  ];
  const empty = Object.fromEntries(keys.map((k) => [k, 0])) as Record<LossStackKey, number>;
  const total = responseAnnualLaborLossManYen(r);
  if (total <= 0 || r.qqCondition === "none") return empty;
  const k = conditionToStack(r.qqCondition);
  empty[k] = total;
  return empty;
}

export function filterResponses(
  rows: SurveyResponse[],
  axis: SummaryAxis,
  tab: "all" | string,
): SurveyResponse[] {
  if (tab === "all") return rows;
  if (axis === "department") return rows.filter((r) => r.department === tab);
  if (axis === "age") return rows.filter((r) => r.ageGroup === tab);
  if (axis === "gender") return rows.filter((r) => r.gender === tab);
  return rows;
}

function hasHealthIssue(r: SurveyResponse): boolean {
  return r.qqCondition !== "none";
}

/** 業務に支障（プレゼンティーイズム的影響）があるとみなす条件 */
function hasWorkImpairment(r: SurveyResponse): boolean {
  if (r.qqCondition === "none") return false;
  return qqPerformanceDeclineRatio(r.workQuantity, r.workQuality) > 0;
}

export function summarizeOccupational(rows: SurveyResponse[]) {
  const total = rows.length;
  const withImpairment = rows.filter(hasWorkImpairment);
  const impairmentDen = withImpairment.length;
  const withAbsentAmongImpairment = withImpairment.filter((r) => r.hadAbsenteeismOnSymptomDays);
  const healthIssues = rows.filter(hasHealthIssue);

  const conditionCounts: Partial<Record<QqConditionId, number>> = {};
  for (const r of rows) {
    if (r.qqCondition === "none") continue;
    conditionCounts[r.qqCondition] = (conditionCounts[r.qqCondition] ?? 0) + 1;
  }

  const painCounts: Partial<Record<PainAreaCode, number>> = {};
  for (const r of rows) {
    const areas = CONDITION_TO_PAIN[r.qqCondition] ?? [];
    for (const p of areas) {
      painCounts[p] = (painCounts[p] ?? 0) + 1;
    }
  }

  return {
    total,
    presenteeism: {
      count: withImpairment.length,
      rate: total ? withImpairment.length / total : 0,
    },
    absenteeismAmongInterference: {
      count: withAbsentAmongImpairment.length,
      denominator: impairmentDen,
      rate: impairmentDen ? withAbsentAmongImpairment.length / impairmentDen : 0,
    },
    healthProblems: {
      count: healthIssues.length,
      rate: total ? healthIssues.length / total : 0,
      conditionCounts,
    },
    painCounts,
  };
}

export function laborLossByDepartment(rows: SurveyResponse[], departments: string[]) {
  const byDept: Record<string, Record<LossStackKey, number>> = {};
  for (const d of departments) {
    byDept[d] = {
      non_pain_disease: 0,
      lower_back: 0,
      limb_pain: 0,
      headache: 0,
      neck_shoulder: 0,
    };
  }

  for (const r of rows) {
    const parts = stackAllocationForResponse(r);
    const target = byDept[r.department];
    if (!target) continue;
    (Object.keys(parts) as LossStackKey[]).forEach((k) => {
      target[k] += parts[k];
    });
  }

  return departments.map((d) => {
    const stack = byDept[d];
    const sum =
      stack.non_pain_disease +
      stack.lower_back +
      stack.limb_pain +
      stack.headache +
      stack.neck_shoulder;
    return { department: d, stack, totalManYen: sum };
  });
}

export function laborLossTotalManYen(rows: SurveyResponse[]): number {
  return rows.reduce((a, r) => a + responseAnnualLaborLossManYen(r), 0);
}

export function laborLossSplitForTotal(rows: SurveyResponse[]) {
  const keys: LossStackKey[] = [
    "non_pain_disease",
    "lower_back",
    "limb_pain",
    "headache",
    "neck_shoulder",
  ];
  const agg: Record<LossStackKey, number> = {
    non_pain_disease: 0,
    lower_back: 0,
    limb_pain: 0,
    headache: 0,
    neck_shoulder: 0,
  };
  for (const r of rows) {
    const parts = stackAllocationForResponse(r);
    for (const k of keys) agg[k] += parts[k];
  }
  return { keys, agg, total: keys.reduce((a, k) => a + agg[k], 0) };
}

export function productivityAndAbsentTotalsManYen(rows: SurveyResponse[]) {
  return rows.reduce(
    (a, r) => {
      const s = splitProductivityAndAbsentManYen(r);
      return {
        productivity: a.productivity + s.productivityManYen,
        absent: a.absent + s.absentManYen,
      };
    },
    { productivity: 0, absent: 0 },
  );
}

export function workEngagementSummary(rows: SurveyResponse[]) {
  if (rows.length === 0) {
    return {
      overall: 0,
      vigor: 0,
      dedication: 0,
      absorption: 0,
    };
  }
  const n = rows.length;
  const sum = rows.reduce(
    (a, r) => ({
      vigor: a.vigor + r.weVigor,
      dedication: a.dedication + r.weDedication,
      absorption: a.absorption + r.weAbsorption,
    }),
    { vigor: 0, dedication: 0, absorption: 0 },
  );
  const vigor = sum.vigor / n;
  const dedication = sum.dedication / n;
  const absorption = sum.absorption / n;
  const overall = (vigor + dedication + absorption) / 3;
  return { overall, vigor, dedication, absorption };
}

export function workEngagementByDepartment(rows: SurveyResponse[], departments: string[]) {
  return departments.map((d) => {
    const sub = rows.filter((r) => r.department === d);
    return { department: d, ...workEngagementSummary(sub) };
  });
}

export function axisTabs(axis: SummaryAxis, departments: string[]): { id: string; label: string }[] {
  const all = { id: "all", label: "社内全体" };
  if (axis === "department") {
    return [all, ...departments.map((d) => ({ id: d, label: d }))];
  }
  if (axis === "age") {
    return [all, ...AGE_GROUPS.map((a) => ({ id: a.id, label: a.label }))];
  }
  return [all, ...GENDERS.filter((g) => g.id !== "prefer_not").map((g) => ({ id: g.id, label: g.label }))];
}

export function segmentLabel(axis: SummaryAxis, tab: string): string {
  if (tab === "all") return "社内全体";
  if (axis === "age") return AGE_GROUPS.find((a) => a.id === tab)?.label ?? tab;
  if (axis === "gender") return GENDERS.find((g) => g.id === tab)?.label ?? tab;
  return tab;
}
