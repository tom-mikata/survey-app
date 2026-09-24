import type { ClientModules, SurveyResponse, SurveyRound, SecondPartData } from "./types";
import { QQ_CONDITIONS } from "./constants";

// ── ラベルマップ ──────────────────────────────────────────────

const GENDER_LABEL: Record<string, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = {
  full_time: "正社員",
  part_time: "パート・アルバイト",
  contract: "契約社員",
  other: "その他",
};

const CONDITION_LABEL: Record<string, string> = Object.fromEntries(
  QQ_CONDITIONS.map((c) => [c.id, c.label]),
);

const TREATMENT_PLACE_LABEL: Record<string, string> = {
  hospital: "病院・クリニック",
  massage: "整骨院・鍼灸・マッサージなどの施術",
  none: "利用していない",
  other: "その他",
};

const DAILY_ITEM_LABEL: Record<string, string> = {
  patch: "湿布",
  medicine: "飲み薬（痛み止めなど）",
  ointment: "塗り薬",
  support: "コルセット・サポーター",
  supplement: "サプリメント",
  other: "その他",
  none: "使っていない",
};

const CONSULTATION_LABEL: Record<string, string> = {
  internal: "社内にある",
  external: "社外にある",
  both: "社内・社外の両方にある",
  none: "ない",
};

const EXPERT_SUPPORT_LABEL: Record<string, string> = {
  want: "利用してみたい",
  interested: "興味はある",
  no: "思わない",
};

const ROLE_IMPACT_LABEL: Record<string, string> = {
  rarely: "まったくない",
  little: "あまりない",
  sometimes: "ときどきある",
  often: "よくある",
  very_often: "いつもある",
};

const SUPPORT_DESIRE_LABEL: Record<string, string> = {
  want: "利用したい",
  conditional: "どちらともいえない",
  not_needed: "必要ない",
};

// ── ヘルパー ──────────────────────────────────────────────────

function calcAge(dateOfBirth: string, submittedAt: string): number {
  const birth = new Date(dateOfBirth);
  const ref = new Date(submittedAt);
  let age = ref.getFullYear() - birth.getFullYear();
  const notYetBirthday =
    ref.getMonth() < birth.getMonth() ||
    (ref.getMonth() === birth.getMonth() && ref.getDate() < birth.getDate());
  if (notYetBirthday) age--;
  return age;
}

function codestoLabels(codes: string[], labelMap: Record<string, string>): string {
  return codes.map((c) => labelMap[c] ?? c).join("、");
}

function k6Interpretation(total: number): string {
  if (total <= 4) return "低度の心理的苦痛（問題なし）";
  if (total <= 12) return "中等度の心理的苦痛（要フォロー）";
  return "高度の心理的苦痛（精神疾患の可能性が高い）";
}

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ── ヘッダー ──────────────────────────────────────────────────

function buildHeaders(modules: ClientModules): string[] {
  const headers = [
    "実施回",
    "回答日時",
    "問1（名前）",
    "問1（フリガナ）",
    "問2（性別）",
    "問3（年齢（生年月日から計算））",
    "問4（部署）",
    "問5（雇用形態）",
    "問6（体の不調（複数選択））",
    "問6（体の不調（その他詳細））",
    "問7（最も影響している不調）",
    "問8（有症状日数（直近30日））",
    "問9（欠勤日数（直近1年））",
    "問10（仕事量スコア（0-10））",
    "問11（仕事の質スコア（0-10））",
    "問12（利用した場所）",
    "問12（利用した場所（その他詳細））",
    "問13（月あたり利用回数）",
    "問14（日常的に使っているもの）",
    "問14（日常的に使っているもの（その他詳細））",
    "問15（相談先（体調・健康））",
    "問15（相談先（仕事・働き方））",
    "問15（相談先（家庭・生活の負担））",
    "問15（相談先（気持ち・心の落ち込み））",
    "問16（専門家支援の希望）",
  ];

  if (modules.mentalHealth) {
    headers.push(
      "問17（心の健康（神経過敏））",
      "問17（心の健康（絶望的））",
      "問17（心の健康（落ち着かない））",
      "問17（心の健康（落ち込み））",
      "問17（心の健康（骨折り））",
      "問17（心の健康（無価値））",
      "問17合計スコア",
      "問17解釈",
    );
  }

  if (modules.companySupport) {
    headers.push(
      "問18（会社の支援（貢献評価））",
      "問18（会社の支援（幸福増進））",
      "問18（会社の支援（メンタル支援））",
      "問18（会社の支援（意見の尊重））",
      "問18合計スコア",
      "問18平均スコア",
    );
  }

  if (modules.workLife) {
    headers.push(
      "問19（仕事以外の役割による影響）",
      "問20（支援の希望）",
    );
  }

  if (modules.exercise) {
    headers.push(
      "問21（運動習慣）",
      "問22（週あたり運動日数）",
    );
  }

  return headers;
}

// ── 行生成 ────────────────────────────────────────────────────

function buildRow(
  response: SurveyResponse,
  roundTitle: string,
  secondPart: SecondPartData,
  modules: ClientModules,
): string[] {
  const mental = secondPart.mental.find((r) => r.surveyResponseId === response.id);
  const support = secondPart.support.find((r) => r.surveyResponseId === response.id);
  const workLife = secondPart.workLife.find((r) => r.surveyResponseId === response.id);
  const exercise = secondPart.exercise.find((r) => r.surveyResponseId === response.id);

  const submittedDate = new Date(response.submittedAt);
  const formattedDate = `${submittedDate.getFullYear()}/${String(submittedDate.getMonth() + 1).padStart(2, "0")}/${String(submittedDate.getDate()).padStart(2, "0")} ${String(submittedDate.getHours()).padStart(2, "0")}:${String(submittedDate.getMinutes()).padStart(2, "0")}`;

  const row: (string | number | null)[] = [
    roundTitle,
    formattedDate,
    response.fullName,
    response.fullNameKana,
    GENDER_LABEL[response.gender] ?? response.gender,
    calcAge(response.dateOfBirth, response.submittedAt),
    response.department,
    EMPLOYMENT_TYPE_LABEL[response.employmentType] ?? response.employmentType,
    codestoLabels(response.symptomConditions, CONDITION_LABEL),
    response.symptomConditionsOther ?? "",
    response.primaryCondition ? (CONDITION_LABEL[response.primaryCondition] ?? response.primaryCondition) : "",
    response.symptomDaysPast30,
    response.absenteeDaysPastYear,
    response.workQuantity,
    response.workQuality,
    codestoLabels(response.treatmentPlaces, TREATMENT_PLACE_LABEL),
    response.treatmentPlacesOther ?? "",
    response.treatmentFrequency ?? "",
    codestoLabels(response.dailyItems, DAILY_ITEM_LABEL),
    response.dailyItemsOther ?? "",
    CONSULTATION_LABEL[response.consultationHealth] ?? response.consultationHealth,
    CONSULTATION_LABEL[response.consultationWork] ?? response.consultationWork,
    CONSULTATION_LABEL[response.consultationFamily] ?? response.consultationFamily,
    CONSULTATION_LABEL[response.consultationMental] ?? response.consultationMental,
    EXPERT_SUPPORT_LABEL[response.expertSupportIntent] ?? response.expertSupportIntent,
  ];

  if (modules.mentalHealth) {
    if (mental) {
      const total = mental.q17_1Score + mental.q17_2Score + mental.q17_3Score + mental.q17_4Score + mental.q17_5Score + mental.q17_6Score;
      row.push(mental.q17_1Score, mental.q17_2Score, mental.q17_3Score, mental.q17_4Score, mental.q17_5Score, mental.q17_6Score, total, k6Interpretation(total));
    } else {
      row.push("", "", "", "", "", "", "", "");
    }
  }

  if (modules.companySupport) {
    if (support) {
      const total = support.q18_1Score + support.q18_2Score + support.q18_3Score + support.q18_4Score;
      const avg = Math.round((total / 4) * 100) / 100;
      row.push(support.q18_1Score, support.q18_2Score, support.q18_3Score, support.q18_4Score, total, avg);
    } else {
      row.push("", "", "", "", "", "");
    }
  }

  if (modules.workLife) {
    row.push(
      workLife ? (ROLE_IMPACT_LABEL[workLife.roleImpact] ?? workLife.roleImpact) : "",
      workLife?.supportDesire ? (SUPPORT_DESIRE_LABEL[workLife.supportDesire] ?? workLife.supportDesire) : "",
    );
  }

  if (modules.exercise) {
    row.push(
      exercise ? (exercise.hasExerciseHabit ? "あり" : "なし") : "",
      exercise?.exerciseDays ?? "",
    );
  }

  return row.map(escapeCsv);
}

// ── 公開API ───────────────────────────────────────────────────

export function downloadCsv(
  responses: SurveyResponse[],
  secondPart: SecondPartData,
  surveyRounds: SurveyRound[],
  modules: ClientModules,
  displayRoundId: number | null,
): void {
  const roundMap = Object.fromEntries(surveyRounds.map((r) => [r.id, r]));
  const selectedRound = displayRoundId !== null ? roundMap[displayRoundId] : null;

  const headers = buildHeaders(modules);
  const rows = responses.map((r) => {
    const title = r.surveyRoundId !== null ? (roundMap[r.surveyRoundId]?.title ?? "") : "";
    return buildRow(r, title, secondPart, modules);
  });

  const lines = [headers.map(escapeCsv), ...rows].map((cols) => cols.join(","));
  const csvContent = "﻿" + lines.join("\r\n"); // UTF-8 BOM

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  const datePart = selectedRound
    ? selectedRound.title.replace(/[^\w぀-ゟ゠-ヿ一-鿿]/g, "_")
    : "all";
  a.download = `survey_responses_${datePart}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
