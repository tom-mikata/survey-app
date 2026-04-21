import { CONDITION_TO_PAIN_DEFAULT, QQ_CONDITIONS } from "./constants";
import type { AgeGroup, Gender, PainAreaCode, QqConditionId, QqConditionItem, SurveyResponse } from "./types";

const DEPT_KEY = "survey-app-departments";
const QQ_KEY = "survey-app-qq-conditions";
const RESPONSES_KEY = "survey-app-responses-v2";
const SEED_FLAG = "survey-app-seed-v2";

const defaultDepartments = [
  "業務部",
  "エアツール課",
  "油圧チゼル課",
  "営業部",
  "鋼材課",
  "熱処理課",
];

const SEED_CONDITIONS: QqConditionId[] = [
  "none",
  "neck_shoulder",
  "lower_back",
  "headache",
  "fatigue",
  "limb_joint",
  "eye",
  "mental",
  "allergy",
];

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getDepartments(): string[] {
  if (typeof window === "undefined") return defaultDepartments;
  const list = safeParse<string[]>(localStorage.getItem(DEPT_KEY), []);
  return list.length > 0 ? list : defaultDepartments;
}

export function setDepartments(departments: string[]): void {
  localStorage.setItem(DEPT_KEY, JSON.stringify(departments));
}

function buildDefaultQqConditions(): QqConditionItem[] {
  return QQ_CONDITIONS.map((c) => ({
    id: c.id,
    label: c.label,
    painAreas: CONDITION_TO_PAIN_DEFAULT[c.id as QqConditionId] ?? [],
  }));
}

export function getQqConditions(): QqConditionItem[] {
  if (typeof window === "undefined") return buildDefaultQqConditions();
  const raw = safeParse<{ id: string; label: string; painAreas?: PainAreaCode[] }[] | null>(
    localStorage.getItem(QQ_KEY),
    null,
  );
  if (!raw || raw.length === 0) return buildDefaultQqConditions();
  return raw.map((item) => ({
    id: item.id,
    label: item.label,
    painAreas: item.painAreas ?? (CONDITION_TO_PAIN_DEFAULT[item.id as QqConditionId] ?? []),
  }));
}

export function setQqConditions(conditions: QqConditionItem[]): void {
  localStorage.setItem(QQ_KEY, JSON.stringify(conditions));
}

export function getResponses(): SurveyResponse[] {
  if (typeof window === "undefined") return [];
  return safeParse<SurveyResponse[]>(localStorage.getItem(RESPONSES_KEY), []);
}

export function addResponse(response: SurveyResponse): void {
  const prev = getResponses();
  localStorage.setItem(RESPONSES_KEY, JSON.stringify([...prev, response]));
}

export function clearResponses(): void {
  localStorage.removeItem(RESPONSES_KEY);
}

/** デモ用の初期データ（初回のみ・QQメソッド入力形式） */
export function ensureSeedResponses(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;
  const depts = getDepartments();
  if (getResponses().length > 0) {
    localStorage.setItem(SEED_FLAG, "1");
    return;
  }

  const ages: AgeGroup[] = ["20s", "30s", "40s", "50s", "60plus"];
  const genders: Gender[] = ["male", "female"];

  const seeded: SurveyResponse[] = [];
  let id = 0;
  for (let i = 0; i < 29; i++) {
    const dept = depts[i % depts.length];
    const cond = SEED_CONDITIONS[i % SEED_CONDITIONS.length];
    const isNone = cond === "none";
    const days = isNone ? 0 : 5 + (i % 20);
    const q = isNone ? 10 : 4 + (i % 5);
    const u = isNone ? 10 : 5 + (i % 4);
    const decline = 1 - (q / 10) * (u / 10);
    const hasAbs = !isNone && decline > 0 && i % 4 === 0;

    seeded.push({
      id: `seed-${id++}`,
      submittedAt: new Date().toISOString(),
      department: dept,
      ageGroup: ages[i % ages.length],
      gender: genders[i % 2],
      qqCondition: cond,
      symptomDaysPast30: days,
      workQuantity: q,
      workQuality: u,
      hadAbsenteeismOnSymptomDays: hasAbs,
      monthlySalaryManYen: 28 + (i % 5) * 2,
      weVigor: 2.5 + (i % 4) * 0.4,
      weDedication: 3 + (i % 5) * 0.35,
      weAbsorption: 3.2 + (i % 3) * 0.3,
    });
  }

  localStorage.setItem(RESPONSES_KEY, JSON.stringify(seeded));
  localStorage.setItem(SEED_FLAG, "1");
}
