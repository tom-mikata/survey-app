export type AgeGroup = "20s" | "30s" | "40s" | "50s" | "60plus";

export type Gender = "male" | "female" | "other";

/** QQメソッド 質問1：仕事に最も影響している健康問題（v1.1: womens_health に統合） */
export type QqConditionId =
  | "none"
  | "allergy"
  | "skin"
  | "infection"
  | "gi"
  | "limb_joint"
  | "lower_back"
  | "neck_shoulder"
  | "headache"
  | "dental"
  | "mental"
  | "sleep"
  | "fatigue"
  | "eye"
  | "womens_health"
  | "other";

export type PainAreaCode =
  | "face"
  | "head"
  | "neck"
  | "shoulder"
  | "lower_back"
  | "arm"
  | "wrist"
  | "hip"
  | "knee"
  | "ankle";

export interface SurveyResponse {
  id: string;
  clientCode: string;
  surveyRoundId: number | null;
  submittedAt: string;
  // 基本情報
  fullName: string;
  fullNameKana: string;
  dateOfBirth: string;
  gender: Gender;
  department: string;
  employmentType: string;
  // 症状（複数選択）
  symptomConditions: string[];
  symptomConditionsOther: string | null;
  primaryCondition: string | null;
  // QQメソッド
  symptomDaysPast30: number;
  absenteeDaysPastYear: number;
  workQuantity: number;
  workQuality: number;
  // 治療・対処
  treatmentPlaces: string[];
  treatmentPlacesOther: string | null;
  treatmentFrequency: number | null;
  dailyItems: string[];
  dailyItemsOther: string | null;
  // 相談先・支援意向
  consultationHealth: string;
  consultationWork: string;
  consultationFamily: string;
  consultationMental: string;
  expertSupportIntent: string;
}

/** 企業ごとの第2部モジュール設定 */
export interface ClientModules {
  mentalHealth: boolean;
  companySupport: boolean;
  workLife: boolean;
  exercise: boolean;
}


export interface SurveyRound {
  id: number;
  clientCode: string;
  title: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

export type SummaryAxis = "department" | "age" | "gender";

export type SegmentTabValue = "all" | string;

/* ── 第2部モジュール行 ── */

export interface MentalHealthRow {
  surveyResponseId: string;
  q17_1Score: number;
  q17_2Score: number;
  q17_3Score: number;
  q17_4Score: number;
  q17_5Score: number;
  q17_6Score: number;
}

export interface CompanySupportRow {
  surveyResponseId: string;
  q18_1Score: number;
  q18_2Score: number;
  q18_3Score: number;
  q18_4Score: number;
}

export interface WorkLifeRow {
  surveyResponseId: string;
  roleImpact: string;
  supportDesire: string | null;
}

export interface ExerciseRow {
  surveyResponseId: string;
  hasExerciseHabit: boolean;
  exerciseDays: number | null;
}

export interface SecondPartData {
  mental: MentalHealthRow[];
  support: CompanySupportRow[];
  workLife: WorkLifeRow[];
  exercise: ExerciseRow[];
}