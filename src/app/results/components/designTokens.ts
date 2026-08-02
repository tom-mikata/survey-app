// 損失カテゴリー（薄→濃の赤系パレット）
export const LOSS_LEGEND = [
  { key: "non_pain_disease" as const, label: "痛み以外の疾病", color: "#f6dcdc" },
  { key: "limb_pain" as const, label: "手足の痛み", color: "#e9a8a8" },
  { key: "headache" as const, label: "頭痛", color: "#cf6a6a" },
  { key: "neck_shoulder" as const, label: "首・肩の痛み", color: "#a53f3f" },
  { key: "lower_back" as const, label: "腰痛", color: "#7a1f1f" },
];

export const INDUSTRY = { overall: 3.3, vigor: 2.5, dedication: 3.8, absorption: 3.4 };
export const INDUSTRY_LABEL = "事務職（一般事務等）";

export const PRODUCTIVITY_COLOR = "#eab065"; // 生産性低下：落ち着いたアンバー
export const ABSENT_COLOR = "#b04040"; // 欠勤：深みのあるレッド

export type CompareTone = "good" | "eq" | "bad";

export function compareTone(score: number, industry: number): CompareTone {
  const d = score - industry;
  if (d > 0.15) return "good";
  if (d < -0.15) return "bad";
  return "eq";
}

export function compareLabel(score: number, industry: number): string {
  const t = compareTone(score, industry);
  return t === "good" ? "業界平均より高い" : t === "bad" ? "業界平均より低い" : "業界平均と同等";
}

export function scoreBandColor(v: number): string {
  if (v >= 4.5) return "#10b981"; // 非常に高い
  if (v >= 3.0) return "#14b8a6"; // やや高い
  if (v >= 1.5) return "#f5a524"; // やや低い
  return "#e4572e"; // 非常に低い
}

// 軸目盛りを切りのいい上限にスナップ
export function niceCeil(x: number): number {
  if (x <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const m = x / p;
  const nm = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nm * p;
}
