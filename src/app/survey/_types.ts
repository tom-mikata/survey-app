import type { Gender } from "@/lib/types";

/** アンケートフォーム全体の状態。設問設計書 v1.1 に対応 */
export type FormState = {
  // 問1〜5 基本属性
  fullName: string;
  fullNameKana: string;
  gender: Gender | "";
  dateOfBirth: string;       // "YYYY-MM-DD"
  department: string;
  employmentType: string;    // "full_time" | "part_time" | "contract" | "other"

  // 問6 この1か月の体の不調（複数選択・16選択肢）
  symptomConditions: string[];
  symptomConditionsOther: string;  // 「その他の不調」の自由記述

  // 問7 最も仕事に影響している不調（問6で症状ありの人のみ）
  primaryCondition: string;

  // 問8〜11 QQメソッド（問6で「不調はない」以外の人のみ）
  symptomDaysPast30: number;     // 問8: 直近30日間の有症状日数
  absenteeDaysPastYear: number;  // 問9: 直近1年間の欠勤日数
  workQuantity: number;          // 問10: 症状ありの日の仕事量（0〜10）
  workQuality: number;           // 問11: 症状ありの日の仕事の質（0〜10）

  // 問12〜14 不調への対処（全員表示）
  treatmentPlaces: string[];       // 問12: この1か月で利用した場所
  treatmentPlacesOther: string;    // 問12 「その他」自由記述
  treatmentFrequency: number | null; // 問13: 月あたり利用回数（問12で利用ありの人のみ）
  dailyItems: string[];            // 問14: 日常的に使っているもの
  dailyItemsOther: string;         // 問14 「その他」自由記述

  // 問15〜16 相談・支援（全員表示）
  consultationHealth: string;     // 問15: 体調・健康の相談先
  consultationWork: string;       // 問15: 仕事や働き方の相談先
  consultationFamily: string;     // 問15: 家庭・生活の負担の相談先
  consultationMental: string;     // 問15: 気持ちや心の落ち込みの相談先
  expertSupportIntent: string;    // 問16: 専門家の支援を利用したいか

  // 問17〜22 心の健康モジュール（企業設定ONの場合のみ）
  // ※ 問題文は牧氏から入手後に確定。スコアは 0〜4
  q17Score: number | null;
  q18Score: number | null;
  q19Score: number | null;
  q20Score: number | null;
  q21Score: number | null;
  q22Score: number | null;

  // 問23〜26 会社のサポートモジュール（企業設定ONの場合のみ）
  // ※ 問題文は牧氏から入手後に確定。スコアは 1〜7
  q23Score: number | null;
  q24Score: number | null;
  q25Score: number | null;
  q26Score: number | null;

  // 問27〜28 仕事以外の負担モジュール（企業設定ONの場合のみ）
  roleImpact: string;     // 問27: 仕事以外の役割による影響（5段階）
  supportDesire: string;  // 問28: 支援の希望（問27でときどきある以上の人のみ）

  // 問29〜30 運動習慣モジュール（企業設定ONの場合のみ）
  hasExerciseHabit: boolean | null;  // 問29: 運動習慣があるか
  exerciseDays: number | null;       // 問30: 週あたり運動日数（問29でありの人のみ、1〜7）
};

export const INITIAL_FORM: FormState = {
  fullName: "",
  fullNameKana: "",
  gender: "",
  dateOfBirth: "",
  department: "",
  employmentType: "",

  symptomConditions: [],
  symptomConditionsOther: "",
  primaryCondition: "",

  symptomDaysPast30: 0,
  absenteeDaysPastYear: 0,
  workQuantity: 7,
  workQuality: 7,

  treatmentPlaces: [],
  treatmentPlacesOther: "",
  treatmentFrequency: null,
  dailyItems: [],
  dailyItemsOther: "",

  consultationHealth: "",
  consultationWork: "",
  consultationFamily: "",
  consultationMental: "",
  expertSupportIntent: "",

  q17Score: null,
  q18Score: null,
  q19Score: null,
  q20Score: null,
  q21Score: null,
  q22Score: null,

  q23Score: null,
  q24Score: null,
  q25Score: null,
  q26Score: null,

  roleImpact: "",
  supportDesire: "",

  hasExerciseHabit: null,
  exerciseDays: null,
};

/** 企業ごとの第2部モジュール設定 */
export type ClientModules = {
  mentalHealth: boolean;
  companySupport: boolean;
  workLife: boolean;
  exercise: boolean;
};

/** アンケートの画面（スクリーン）識別子 */
export type ScreenId =
  | "basic_info"       // 問1〜5
  | "symptoms"         // 問6〜7
  | "qq"               // 問8〜11（問6で症状ありの人のみ）
  | "pain_care"        // 問12〜14
  | "consultation"     // 問15〜16
  | "mental_health"    // 問17〜22（モジュールONのみ）
  | "company_support"  // 問23〜26（モジュールONのみ）
  | "work_life"        // 問27〜28（モジュールONのみ）
  | "exercise";        // 問29〜30（モジュールONのみ）

/** 現在のフォーム状態とモジュール設定から表示すべき画面リストを生成する */
export function buildScreenList(form: FormState, modules: ClientModules): ScreenId[] {
  const hasSymptoms =
    form.symptomConditions.length > 0 &&
    !form.symptomConditions.includes("none");

  const screens: ScreenId[] = ["basic_info", "symptoms"];
  if (hasSymptoms) screens.push("qq");
  screens.push("pain_care", "consultation");
  if (modules.mentalHealth) screens.push("mental_health");
  if (modules.companySupport) screens.push("company_support");
  if (modules.workLife) screens.push("work_life");
  if (modules.exercise) screens.push("exercise");
  return screens;
}

/** 各ステップコンポーネントが受け取る共通 Props */
export type StepProps = {
  form: FormState;
  onChange: (updates: Partial<FormState>) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  onSubmit: () => Promise<void>;
};