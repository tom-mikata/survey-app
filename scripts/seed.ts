import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

const envFile = process.env.ENV_FILE ?? ".env.local";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ---- 部署 ----
const departments = [
  "業務部",
  "エアツール課",
  "油圧チゼル課",
  "営業部",
  "鋼材課",
  "熱処理課",
];

// ---- 健康問題の選択肢 ----
const qqConditions = [
  { id: "none",         label: "健康上の問題や不調はない",                                   pain_areas: [] },
  { id: "allergy",      label: "アレルギーによる疾患（花粉症・アレルギー性結膜炎など）",     pain_areas: ["head"] },
  { id: "skin",         label: "皮膚の病気・かゆみ（湿疹やアトピー性湿疹など）",             pain_areas: ["wrist"] },
  { id: "infection",    label: "感染症による不調（風邪、インフルエンザ、胃腸炎）",           pain_areas: ["head"] },
  { id: "gi",           label: "胃腸に関する不調（繰り返す下痢、便秘、胃不快感）",           pain_areas: [] },
  { id: "limb_joint",   label: "手足の関節の痛みや不自由さ（関節炎など）",                   pain_areas: ["arm", "wrist", "knee", "ankle"] },
  { id: "lower_back",   label: "腰痛",                                                       pain_areas: ["lower_back"] },
  { id: "neck_shoulder",label: "首の不調や肩のこりなど",                                     pain_areas: ["neck", "shoulder"] },
  { id: "headache",     label: "頭痛（偏頭痛や慢性的な頭痛など）",                           pain_areas: ["head"] },
  { id: "dental",       label: "歯の不調（歯痛など）",                                       pain_areas: ["head"] },
  { id: "mental",       label: "精神に関する不調",                                           pain_areas: ["head"] },
  { id: "sleep",        label: "睡眠に関する不調（寝ようとしても眠れないなど）",             pain_areas: ["head"] },
  { id: "fatigue",      label: "全身の倦怠感、疲労感",                                       pain_areas: ["shoulder", "lower_back"] },
  { id: "eye",          label: "眼の不調（視力低下・眼精疲労・ドライアイ・緑内障など）",     pain_areas: ["head"] },
  { id: "mens_pain",    label: "（女性のみ）月経痛（生理痛）",                               pain_areas: ["lower_back"] },
  { id: "mens_other",   label: "（女性のみ）月経前症状（イライラ・憂うつ・頭痛）",           pain_areas: ["head"] },
  { id: "other",        label: "その他",                                                     pain_areas: ["lower_back"] },
];

// ---- アンケート回答（29件） ----
type AgeGroup = "20s" | "30s" | "40s" | "50s" | "60plus";
type Gender = "male" | "female";
type ConditionId = "none" | "neck_shoulder" | "lower_back" | "headache" | "fatigue" | "limb_joint" | "eye" | "mental" | "allergy";

const SEED_CONDITIONS: ConditionId[] = [
  "none", "neck_shoulder", "lower_back", "headache", "fatigue",
  "limb_joint", "eye", "mental", "allergy",
];
const ages: AgeGroup[] = ["20s", "30s", "40s", "50s", "60plus"];
const genders: Gender[] = ["male", "female"];

const responses = Array.from({ length: 29 }, (_, i) => {
  const cond = SEED_CONDITIONS[i % SEED_CONDITIONS.length];
  const isNone = cond === "none";
  const days = isNone ? 0 : 5 + (i % 20);
  const q = isNone ? 10 : 4 + (i % 5);
  const u = isNone ? 10 : 5 + (i % 4);
  const decline = 1 - (q / 10) * (u / 10);
  const hasAbs = !isNone && decline > 0 && i % 4 === 0;

  return {
    id: `seed-${i}`,
    submitted_at: new Date().toISOString(),
    department: departments[i % departments.length],
    age_group: ages[i % ages.length],
    gender: genders[i % 2],
    qq_condition: cond,
    symptom_days_past30: days,
    work_quantity: q,
    work_quality: u,
    had_absenteeism: hasAbs,
    monthly_salary_man_yen: 28 + (i % 5) * 2,
    we_vigor: 2.5 + (i % 4) * 0.4,
    we_dedication: 3 + (i % 5) * 0.35,
    we_absorption: 3.2 + (i % 3) * 0.3,
  };
});

async function seed() {
  console.log("Seeding departments...");
  await supabase.from("departments").delete().neq("id", 0);
  const { error: deptErr } = await supabase.from("departments").insert(
    departments.map((name, i) => ({ name, sort_order: i })),
  );
  if (deptErr) { console.error("departments error:", deptErr); process.exit(1); }
  console.log(`  ${departments.length}件 挿入完了`);

  console.log("Seeding qq_conditions...");
  await supabase.from("qq_conditions").delete().neq("id", "");
  const { error: qqErr } = await supabase.from("qq_conditions").insert(
    qqConditions.map((c, i) => ({ ...c, sort_order: i })),
  );
  if (qqErr) { console.error("qq_conditions error:", qqErr); process.exit(1); }
  console.log(`  ${qqConditions.length}件 挿入完了`);

  console.log("Seeding survey_responses...");
  await supabase.from("survey_responses").delete().neq("id", "");
  const { error: resErr } = await supabase.from("survey_responses").insert(responses);
  if (resErr) { console.error("survey_responses error:", resErr); process.exit(1); }
  console.log(`  ${responses.length}件 挿入完了`);

  console.log("完了！");
}

seed();
