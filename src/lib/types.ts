export type AgeGroup = "20s" | "30s" | "40s" | "50s" | "60plus";

export type Gender = "male" | "female" | "other" | "prefer_not";

/** QQメソッド 質問1：仕事に最も影響している健康問題（例示はWellaboSWPの解説に準拠） */
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
  | "mens_pain"
  | "mens_other"
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
  submittedAt: string;
  department: string;
  ageGroup: AgeGroup;
  gender: Gender;
  /** QQ1 */
  qqCondition: string;
  /** QQ2：過去30日間の有症状日数 */
  symptomDaysPast30: number;
  /** QQ3：不調がある日の仕事の量（0〜10） */
  workQuantity: number;
  /** QQ4：不調がある日の仕事の質（0〜10） */
  workQuality: number;
  /** QQ5：有症状日に欠勤したことがある */
  hadAbsenteeismOnSymptomDays: boolean;
  /** 損失コスト計算用の月給（万円） */
  monthlySalaryManYen: number;
  /** ワークエンゲージメント（1〜6） */
  weVigor: number;
  weDedication: number;
  weAbsorption: number;
}

export interface QqConditionItem {
  id: string;
  label: string;
  painAreas: PainAreaCode[];
}

export type SummaryAxis = "department" | "age" | "gender";

export type SegmentTabValue = "all" | string;
