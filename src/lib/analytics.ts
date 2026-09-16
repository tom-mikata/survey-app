import { AGE_GROUPS, CONDITION_TO_PAIN_DEFAULT, DAILY_LABOR_COST_MAN_YEN, GENDERS } from "./constants";
import { qqAnnualLossCostManYen, qqPerformanceDeclineRatio } from "./qq-method";
import type { AgeGroup, CompanySupportRow, ExerciseRow, MentalHealthRow, PainAreaCode, QqConditionId, SummaryAxis, SurveyResponse, WorkLifeRow } from "./types";

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

/* =============================================================================
 * 問6-22 集計関数
 * ========================================================================== */

function hasSymptoms(r: SurveyResponse): boolean {
  return r.symptomConditions.length > 0 && !r.symptomConditions.includes("none");
}

/** 問6: 症状のある人の割合・症状別件数 */
export function summarizeSymptoms(rows: SurveyResponse[]) {
  const total = rows.length;
  const withAny = rows.filter(hasSymptoms);
  const counts: Record<string, number> = {};
  for (const r of rows) {
    for (const c of r.symptomConditions) {
      if (c !== "none") counts[c] = (counts[c] ?? 0) + 1;
    }
  }
  return { total, withAnyCount: withAny.length, withAnyRate: total ? withAny.length / total : 0, counts };
}

/** 問7: 主な不調の分布（有症状者内） */
export function summarizePrimaryCondition(rows: SurveyResponse[]) {
  const withSym = rows.filter(hasSymptoms);
  const counts: Record<string, number> = {};
  for (const r of withSym) {
    if (r.primaryCondition) counts[r.primaryCondition] = (counts[r.primaryCondition] ?? 0) + 1;
  }
  return { total: withSym.length, counts };
}

export type DayBucket = "1-5" | "6-15" | "16-25" | "26+";

function toDayBucket(d: number): DayBucket {
  if (d <= 5) return "1-5";
  if (d <= 15) return "6-15";
  if (d <= 25) return "16-25";
  return "26+";
}

/** 問8-11: 有症状日数・欠勤日数・仕事量・仕事の質（有症状者内） */
export function summarizeQqDetail(rows: SurveyResponse[]) {
  const withSym = rows.filter(hasSymptoms);
  const n = withSym.length;
  const emptyBuckets: Record<DayBucket, number> = { "1-5": 0, "6-15": 0, "16-25": 0, "26+": 0 };
  if (n === 0) return { total: 0, avgDays: 0, dayBuckets: emptyBuckets, avgAbsent: 0, zeroAbsentRate: 0, avgWorkQty: 0, avgWorkQual: 0 };

  const dayBuckets = { ...emptyBuckets };
  let sumDays = 0, sumAbsent = 0, sumQty = 0, sumQual = 0, zeroAbsent = 0;
  for (const r of withSym) {
    dayBuckets[toDayBucket(r.symptomDaysPast30)]++;
    sumDays += r.symptomDaysPast30;
    sumAbsent += r.absenteeDaysPastYear;
    if (r.absenteeDaysPastYear === 0) zeroAbsent++;
    sumQty += r.workQuantity;
    sumQual += r.workQuality;
  }
  return { total: n, avgDays: sumDays / n, dayBuckets, avgAbsent: sumAbsent / n, zeroAbsentRate: zeroAbsent / n, avgWorkQty: sumQty / n, avgWorkQual: sumQual / n };
}

export type FreqBucket = "0" | "1-2" | "3-4" | "5+";

function toFreqBucket(f: number): FreqBucket {
  if (f === 0) return "0";
  if (f <= 2) return "1-2";
  if (f <= 4) return "3-4";
  return "5+";
}

/** 問12-14: 利用先・頻度・日常品 */
export function summarizeTreatment(rows: SurveyResponse[]) {
  const total = rows.length;
  const withTreatment = rows.filter(r => r.treatmentPlaces.length > 0 && !r.treatmentPlaces.includes("none"));
  const treatmentCounts: Record<string, number> = {};
  const dailyItemCounts: Record<string, number> = {};
  const freqBuckets: Record<FreqBucket, number> = { "0": 0, "1-2": 0, "3-4": 0, "5+": 0 };
  for (const r of rows) {
    for (const t of r.treatmentPlaces) {
      if (t !== "none") treatmentCounts[t] = (treatmentCounts[t] ?? 0) + 1;
    }
    for (const d of r.dailyItems) {
      if (d !== "none") dailyItemCounts[d] = (dailyItemCounts[d] ?? 0) + 1;
    }
    freqBuckets[toFreqBucket(r.treatmentFrequency ?? 0)]++;
  }
  return { total, withTreatmentCount: withTreatment.length, withTreatmentRate: total ? withTreatment.length / total : 0, treatmentCounts, freqBuckets, dailyItemCounts };
}

export type ConsultationField = "consultationHealth" | "consultationWork" | "consultationFamily" | "consultationMental";

/** 問15-16: 相談先・専門家支援意向 */
export function summarizeConsultation(rows: SurveyResponse[]) {
  const total = rows.length;
  const fields: ConsultationField[] = ["consultationHealth", "consultationWork", "consultationFamily", "consultationMental"];
  const counts: Record<ConsultationField, Record<string, number>> = {
    consultationHealth: { internal: 0, external: 0, both: 0, none: 0 },
    consultationWork:   { internal: 0, external: 0, both: 0, none: 0 },
    consultationFamily: { internal: 0, external: 0, both: 0, none: 0 },
    consultationMental: { internal: 0, external: 0, both: 0, none: 0 },
  };
  const expertCounts = { want: 0, interested: 0, no: 0 };
  for (const r of rows) {
    for (const f of fields) {
      const v = r[f];
      if (v in counts[f]) (counts[f] as Record<string, number>)[v]++;
    }
    const v = r.expertSupportIntent;
    if (v === "want" || v === "interested" || v === "no") expertCounts[v]++;
  }
  return { total, counts, expertCounts };
}

/** 問17: K6スコア集計 */
export function summarizeMentalHealth(rows: MentalHealthRow[]) {
  const n = rows.length;
  const buckets: Record<"0-4" | "5-9" | "10-12" | "13+", number> = { "0-4": 0, "5-9": 0, "10-12": 0, "13+": 0 };
  if (n === 0) return { total: 0, atLeast5Count: 0, atLeast5Rate: 0, atLeast13Count: 0, atLeast13Rate: 0, buckets };
  let count5 = 0, count13 = 0;
  for (const r of rows) {
    const s = r.q17_1Score + r.q17_2Score + r.q17_3Score + r.q17_4Score + r.q17_5Score + r.q17_6Score;
    if (s >= 5) count5++;
    if (s >= 13) count13++;
    if (s <= 4) buckets["0-4"]++;
    else if (s <= 9) buckets["5-9"]++;
    else if (s <= 12) buckets["10-12"]++;
    else buckets["13+"]++;
  }
  return { total: n, atLeast5Count: count5, atLeast5Rate: count5 / n, atLeast13Count: count13, atLeast13Rate: count13 / n, buckets };
}

/** 問18: POS（会社のサポート）スコア集計 */
export function summarizeCompanySupport(rows: CompanySupportRow[]) {
  const n = rows.length;
  if (n === 0) return { total: 0, overallAvg: 0, itemAvgs: [0, 0, 0, 0] as [number, number, number, number] };
  const sums = [0, 0, 0, 0];
  for (const r of rows) {
    sums[0] += r.q18_1Score; sums[1] += r.q18_2Score;
    sums[2] += r.q18_3Score; sums[3] += r.q18_4Score;
  }
  const itemAvgs = sums.map(s => s / n) as [number, number, number, number];
  return { total: n, overallAvg: itemAvgs.reduce((a, b) => a + b) / 4, itemAvgs };
}

/** 問19-20: 仕事以外の役割負担 */
export function summarizeWorkLife(rows: WorkLifeRow[]) {
  const n = rows.length;
  const impactCounts: Record<string, number> = { rarely: 0, little: 0, sometimes: 0, often: 0, very_often: 0 };
  const supportCounts: Record<string, number> = { want: 0, conditional: 0, not_needed: 0 };
  for (const r of rows) {
    if (r.roleImpact in impactCounts) impactCounts[r.roleImpact]++;
    if (r.supportDesire && r.supportDesire in supportCounts) supportCounts[r.supportDesire]++;
  }
  const hasImpact = (impactCounts.sometimes ?? 0) + (impactCounts.often ?? 0) + (impactCounts.very_often ?? 0);
  return { total: n, impactCounts, hasImpactCount: hasImpact, hasImpactRate: n ? hasImpact / n : 0, supportCounts };
}

/** 問21-22: 運動習慣 */
export function summarizeExercise(rows: ExerciseRow[]) {
  const n = rows.length;
  const daysBuckets: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5+": 0 };
  let sumDays = 0, daysCount = 0;
  const exerciseCount = rows.filter(r => r.hasExerciseHabit).length;
  for (const r of rows) {
    if (r.hasExerciseHabit && r.exerciseDays !== null) {
      sumDays += r.exerciseDays; daysCount++;
      daysBuckets[r.exerciseDays >= 5 ? "5+" : `${r.exerciseDays}`] = (daysBuckets[r.exerciseDays >= 5 ? "5+" : `${r.exerciseDays}`] ?? 0) + 1;
    }
  }
  return { total: n, exerciseCount, exerciseRate: n ? exerciseCount / n : 0, avgDays: daysCount ? sumDays / daysCount : 0, daysBuckets };
}