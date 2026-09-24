import type { AgeGroup, Gender, PainAreaCode, QqConditionId } from "./types";

/** プレゼンティーイズム・欠勤損失の共通単価（万円/日）。¥10,000/日固定 */
export const DAILY_LABOR_COST_MAN_YEN = 1;

export const AGE_GROUPS: { id: AgeGroup; label: string }[] = [
  { id: "20s", label: "20代" },
  { id: "30s", label: "30代" },
  { id: "40s", label: "40代" },
  { id: "50s", label: "50代" },
  { id: "60plus", label: "60代以上" },
];

export const GENDERS: { id: Gender; label: string }[] = [
  { id: "male", label: "男性" },
  { id: "female", label: "女性" },
  { id: "other", label: "その他" },
];

/** 健康問題IDから痛み部位へのデフォルトマッピング */
export const CONDITION_TO_PAIN_DEFAULT: Record<QqConditionId, PainAreaCode[]> = {
  none: [],
  allergy: ["head"],
  skin: ["wrist"],
  infection: ["head"],
  gi: [],
  limb_joint: ["arm", "wrist", "knee", "ankle"],
  lower_back: ["lower_back"],
  neck_shoulder: ["neck", "shoulder"],
  headache: ["head"],
  dental: ["head"],
  mental: ["head"],
  sleep: ["head"],
  fatigue: ["shoulder", "lower_back"],
  eye: ["head"],
  womens_health: ["lower_back", "head"],
  other: ["lower_back"],
};

/** QQメソッド 質問1の選択肢（v1.1: womens_health に統合） */
export const QQ_CONDITIONS: { id: QqConditionId; label: string }[] = [
  { id: "none", label: "健康上の問題や不調はない" },
  { id: "allergy", label: "アレルギーによる疾患（花粉症・アレルギー性結膜炎など）" },
  { id: "skin", label: "皮膚の病気・かゆみ（湿疹やアトピー性湿疹など）" },
  { id: "infection", label: "感染症による不調（風邪、インフルエンザ、胃腸炎）" },
  { id: "gi", label: "胃腸に関する不調（繰り返す下痢、便秘、胃不快感）" },
  { id: "limb_joint", label: "手足の関節の痛みや不自由さ（関節炎など）" },
  { id: "lower_back", label: "腰痛" },
  { id: "neck_shoulder", label: "首の不調や肩のこりなど" },
  { id: "headache", label: "頭痛（偏頭痛や慢性的な頭痛など）" },
  { id: "dental", label: "歯の不調（歯痛など）" },
  { id: "mental", label: "精神に関する不調" },
  { id: "sleep", label: "睡眠に関する不調（寝ようとしても眠れないなど）" },
  { id: "fatigue", label: "全身の倦怠感、疲労感" },
  { id: "eye", label: "眼の不調（視力低下・眼精疲労・ドライアイ・緑内障など）" },
  { id: "womens_health", label: "女性特有の不調（月経痛・月経前症状など）" },
  { id: "other", label: "その他" },
];