import { AGE_GROUPS, CONDITION_TO_PAIN_DEFAULT, DAILY_LABOR_COST_MAN_YEN, GENDERS } from "./constants";
import { qqAnnualLossCostManYen, qqPerformanceDeclineRatio } from "./qq-method";
import type { AgeGroup, PainAreaCode, QqConditionId, SummaryAxis, SurveyResponse } from "./types";

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
  womens_health: "non_pain_disease",
  other: "non_pain_disease",
};

function conditionToStack(c: string): LossStackKey {
  return CONDITION_TO_STACK[c as QqConditionId] ?? "non_pain_disease";
}

function isNoCondition(r: SurveyResponse): boolean {
  return r.symptomConditions.includes("none");
}

/** 生年月日文字列から年代グループを計算 */
function ageGroupFromBirthDate(dateOfBirth: string): AgeGroup {
  const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  if (age < 30) return "20s";
  if (age < 40) return "30s";
  if (age < 50) return "40s";
  if (age < 60) return "50s";
  return "60plus";
}

/** プレゼンティーイズム年間損失（万円） */
export function responseAnnualLaborLossManYen(r: SurveyResponse): number {
  return qqAnnualLossCostManYen({
    symptomDaysPast30: r.symptomDaysPast30,
    workQuantity: r.workQuantity,
    workQuality: r.workQuality,
    isNoCondition: isNoCondition(r),
  });
}

/**
 * プレゼンティーイズム損失 / 欠勤損失の内訳。
 * 欠勤損失 = absenteeDaysPastYear × DAILY_LABOR_COST_MAN_YEN（実績日数 × 日当単価）
 */
export function splitProductivityAndAbsentManYen(r: SurveyResponse): {
  productivityManYen: number;
  absentManYen: number;
} {
  if (isNoCondition(r)) return { productivityManYen: 0, absentManYen: 0 };
  return {
    productivityManYen: responseAnnualLaborLossManYen(r),
    absentManYen: r.absenteeDaysPastYear * DAILY_LABOR_COST_MAN_YEN,
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
  if (total <= 0 || isNoCondition(r)) return empty;
  const k = conditionToStack(r.primaryCondition ?? "other");
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
  if (axis === "age") return rows.filter((r) => ageGroupFromBirthDate(r.dateOfBirth) === tab);
  if (axis === "gender") return rows.filter((r) => r.gender === tab);
  return rows;
}

function hasHealthIssue(r: SurveyResponse): boolean {
  return !isNoCondition(r);
}

/** 業務に支障（プレゼンティーイズム的影響）があるとみなす条件 */
function hasWorkImpairment(r: SurveyResponse): boolean {
  if (isNoCondition(r)) return false;
  return qqPerformanceDeclineRatio(r.workQuantity, r.workQuality) > 0;
}

export function summarizeOccupational(
  rows: SurveyResponse[],
  conditionPainMap?: Record<string, PainAreaCode[]>,
) {
  const total = rows.length;
  const withImpairment = rows.filter(hasWorkImpairment);
  const impairmentDen = withImpairment.length;
  const withAbsentAmongImpairment = withImpairment.filter((r) => r.absenteeDaysPastYear > 0);
  const healthIssues = rows.filter(hasHealthIssue);

  const conditionCounts: Record<string, number> = {};
  for (const r of rows) {
    for (const c of r.symptomConditions) {
      if (c === "none") continue;
      conditionCounts[c] = (conditionCounts[c] ?? 0) + 1;
    }
  }

  const painCounts: Partial<Record<PainAreaCode, number>> = {};
  for (const r of rows) {
    const painMap: Record<string, PainAreaCode[]> = conditionPainMap ?? CONDITION_TO_PAIN_DEFAULT;
    for (const c of r.symptomConditions) {
      const areas = painMap[c] ?? [];
      for (const p of areas) {
        painCounts[p] = (painCounts[p] ?? 0) + 1;
      }
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
  return rows.reduce((a, r) => {
    const { productivityManYen, absentManYen } = splitProductivityAndAbsentManYen(r);
    return a + productivityManYen + absentManYen;
  }, 0);
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

export function axisTabs(axis: SummaryAxis, departments: string[]): { id: string; label: string }[] {
  const all = { id: "all", label: "社内全体" };
  if (axis === "department") {
    return [all, ...departments.map((d) => ({ id: d, label: d }))];
  }
  if (axis === "age") {
    return [all, ...AGE_GROUPS.map((a) => ({ id: a.id, label: a.label }))];
  }
  return [all, ...GENDERS.map((g) => ({ id: g.id, label: g.label }))];
}

export function segmentLabel(axis: SummaryAxis, tab: string): string {
  if (tab === "all") return "社内全体";
  if (axis === "age") return AGE_GROUPS.find((a) => a.id === tab)?.label ?? tab;
  if (axis === "gender") return GENDERS.find((g) => g.id === tab)?.label ?? tab;
  return tab;
}