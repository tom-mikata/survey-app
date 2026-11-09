/**
 * scripts/manual-screenshots/seed-demo.ts
 *
 * マニュアル撮影用ダミーデータを Dev Supabase に投入する。
 * 実行前に環境変数を設定:
 *   export DEMO_ADMIN_PASS="テスト用パスワード（8文字以上）"
 *
 * 実行:
 *   npx tsx scripts/manual-screenshots/seed-demo.ts
 *
 * 冪等: demo クライアントが既に存在する場合はスキップして終了する。
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─── データ定義 ──────────────────────────────────────────────────────────────

interface ResponseData {
  id: string;
  submittedAt: string;
  name: string;
  kana: string;
  dob: string;
  gender: "male" | "female";
  dept: string;
  employment: string;
  symptoms: string[];
  primary: string | null;
  days: number;
  absent: number;
  qty: number;
  qual: number;
  places: string[];
  freq: number | null;
  daily: string[];
  cHealth: string;
  cWork: string;
  cFamily: string;
  cMental: string;
  expert: string;
  k6: [number, number, number, number, number, number];
  spos: [number, number, number, number];
  roleImpact: string;
  supportDesire: string;
  exerciseHabit: boolean;
  exerciseDays: number | null;
}

// 共通プロフィール（16人分）
const PERSONS = [
  { name: "見本 太郎",  kana: "ミホン タロウ",   dob: "1975-04-10", gender: "male"   as const, dept: "製造部", employment: "正社員" },
  { name: "見本 花子",  kana: "ミホン ハナコ",   dob: "1982-07-15", gender: "female" as const, dept: "総務部", employment: "正社員" },
  { name: "見本 一郎",  kana: "ミホン イチロウ",  dob: "1990-01-20", gender: "male"   as const, dept: "営業部", employment: "正社員" },
  { name: "見本 二郎",  kana: "ミホン ジロウ",   dob: "1968-11-05", gender: "male"   as const, dept: "管理部", employment: "正社員" },
  { name: "見本 三郎",  kana: "ミホン サブロウ",  dob: "1978-03-22", gender: "male"   as const, dept: "製造部", employment: "正社員" },
  { name: "見本 四郎",  kana: "ミホン シロウ",   dob: "1985-09-08", gender: "male"   as const, dept: "総務部", employment: "正社員" },
  { name: "見本 五郎",  kana: "ミホン ゴロウ",   dob: "1995-06-14", gender: "male"   as const, dept: "営業部", employment: "正社員" },
  { name: "見本 六郎",  kana: "ミホン ロクロウ",  dob: "1972-12-30", gender: "male"   as const, dept: "管理部", employment: "正社員" },
  { name: "見本 七郎",  kana: "ミホン シチロウ",  dob: "1988-08-25", gender: "male"   as const, dept: "製造部", employment: "正社員" },
  { name: "見本 八郎",  kana: "ミホン ハチロウ",  dob: "1963-05-18", gender: "male"   as const, dept: "総務部", employment: "正社員" },
  { name: "見本 陽子",  kana: "ミホン ヨウコ",   dob: "1980-02-28", gender: "female" as const, dept: "営業部", employment: "正社員" },
  { name: "見本 良子",  kana: "ミホン リョウコ",  dob: "1992-10-11", gender: "female" as const, dept: "管理部", employment: "正社員" },
  { name: "見本 幸子",  kana: "ミホン サチコ",   dob: "1977-07-04", gender: "female" as const, dept: "製造部", employment: "正社員" },
  { name: "見本 恵子",  kana: "ミホン ケイコ",   dob: "1987-04-19", gender: "female" as const, dept: "総務部", employment: "正社員" },
  { name: "見本 美子",  kana: "ミホン ヨシコ",   dob: "1997-01-25", gender: "female" as const, dept: "営業部", employment: "正社員" },
  { name: "見本 知子",  kana: "ミホン トモコ",   dob: "1970-09-07", gender: "female" as const, dept: "管理部", employment: "正社員" },
];

function makeResponses(roundPrefix: string, dateOffset: string, isRound2 = false): ResponseData[] {
  // [症状, primary, days, absent, qty, qual, places, freq, daily, cH, cW, cF, cM, expert]
  type S = {
    symptoms: string[]; primary: string | null;
    days: number; absent: number; qty: number; qual: number;
    places: string[]; freq: number | null; daily: string[];
    cHealth: string; cWork: string; cFamily: string; cMental: string; expert: string;
  };

  const r1Symptom: S[] = [
    // 01 lower_back（製造部 太郎）
    { symptoms: ["lower_back"], primary: "lower_back", days: 15, absent: 2, qty: 6, qual: 6, places: ["hospital"], freq: 2, daily: ["patch"], cHealth: "none", cWork: "internal", cFamily: "none", cMental: "none", expert: "interested" },
    // 02 neck_shoulder（総務部 花子）
    { symptoms: ["neck_shoulder"], primary: "neck_shoulder", days: 10, absent: 0, qty: 7, qual: 7, places: ["massage"], freq: 1, daily: ["patch"], cHealth: "none", cWork: "none", cFamily: "none", cMental: "none", expert: "no" },
    // 03 none（営業部 一郎）
    { symptoms: ["none"], primary: null, days: 0, absent: 0, qty: 10, qual: 10, places: ["none"], freq: null, daily: ["none"], cHealth: "none", cWork: "internal", cFamily: "none", cMental: "none", expert: "no" },
    // 04 headache（管理部 二郎）
    { symptoms: ["headache"], primary: "headache", days: 12, absent: 1, qty: 6, qual: 5, places: ["hospital"], freq: 2, daily: ["medicine"], cHealth: "external", cWork: "internal", cFamily: "none", cMental: "none", expert: "interested" },
    // 05 fatigue（製造部 三郎）
    { symptoms: ["fatigue"], primary: "fatigue", days: 20, absent: 3, qty: 5, qual: 5, places: ["hospital"], freq: 1, daily: ["supplement"], cHealth: "none", cWork: "none", cFamily: "none", cMental: "none", expert: "interested" },
    // 06 none（総務部 四郎）
    { symptoms: ["none"], primary: null, days: 0, absent: 0, qty: 10, qual: 10, places: ["none"], freq: null, daily: ["supplement"], cHealth: "internal", cWork: "internal", cFamily: "none", cMental: "none", expert: "no" },
    // 07 lower_back（営業部 五郎）
    { symptoms: ["lower_back"], primary: "lower_back", days: 8, absent: 0, qty: 8, qual: 8, places: ["massage"], freq: 1, daily: ["support"], cHealth: "none", cWork: "none", cFamily: "none", cMental: "none", expert: "no" },
    // 08 none（管理部 六郎）
    { symptoms: ["none"], primary: null, days: 0, absent: 0, qty: 10, qual: 10, places: ["none"], freq: null, daily: ["none"], cHealth: "none", cWork: "internal", cFamily: "none", cMental: "none", expert: "no" },
    // 09 mental+sleep（製造部 七郎）
    { symptoms: ["mental", "sleep"], primary: "mental", days: 18, absent: 4, qty: 5, qual: 4, places: ["hospital"], freq: 2, daily: ["medicine"], cHealth: "none", cWork: "none", cFamily: "none", cMental: "external", expert: "want" },
    // 10 lower_back（総務部 八郎）
    { symptoms: ["lower_back"], primary: "lower_back", days: 25, absent: 5, qty: 4, qual: 4, places: ["hospital", "massage"], freq: 4, daily: ["patch", "medicine"], cHealth: "external", cWork: "none", cFamily: "none", cMental: "none", expert: "want" },
    // 11 neck_shoulder（営業部 陽子）
    { symptoms: ["neck_shoulder"], primary: "neck_shoulder", days: 14, absent: 1, qty: 7, qual: 6, places: ["massage"], freq: 2, daily: ["patch"], cHealth: "none", cWork: "none", cFamily: "none", cMental: "none", expert: "interested" },
    // 12 none（管理部 良子）
    { symptoms: ["none"], primary: null, days: 0, absent: 0, qty: 10, qual: 10, places: ["none"], freq: null, daily: ["none"], cHealth: "none", cWork: "none", cFamily: "none", cMental: "none", expert: "no" },
    // 13 headache（製造部 幸子）
    { symptoms: ["headache"], primary: "headache", days: 10, absent: 0, qty: 7, qual: 7, places: ["hospital"], freq: 1, daily: ["medicine"], cHealth: "none", cWork: "none", cFamily: "none", cMental: "none", expert: "no" },
    // 14 fatigue（総務部 恵子）
    { symptoms: ["fatigue"], primary: "fatigue", days: 16, absent: 2, qty: 6, qual: 6, places: ["hospital"], freq: 1, daily: ["supplement"], cHealth: "none", cWork: "none", cFamily: "external", cMental: "none", expert: "interested" },
    // 15 none（営業部 美子）
    { symptoms: ["none"], primary: null, days: 0, absent: 0, qty: 10, qual: 10, places: ["none"], freq: null, daily: ["none"], cHealth: "none", cWork: "internal", cFamily: "none", cMental: "none", expert: "no" },
    // 16 lower_back+neck_shoulder（管理部 知子）
    { symptoms: ["lower_back", "neck_shoulder"], primary: "lower_back", days: 20, absent: 3, qty: 5, qual: 5, places: ["hospital"], freq: 3, daily: ["patch"], cHealth: "external", cWork: "none", cFamily: "none", cMental: "none", expert: "want" },
  ];

  // R2: 同じプロフィール、症状を一部改善
  const r2Symptom: S[] = [
    r1Symptom[0], // 01 lower_back 継続（改善値は下の第2部で調整）
    { ...r1Symptom[1], symptoms: ["none"], primary: null, days: 0, absent: 0, qty: 10, qual: 10, places: ["none"], freq: null, daily: ["none"], expert: "no" }, // 02 改善→none
    r1Symptom[2], // 03 none 継続
    { ...r1Symptom[3], days: 8, absent: 0, qty: 7, qual: 7 }, // 04 headache 軽減
    { ...r1Symptom[4], symptoms: ["none"], primary: null, days: 0, absent: 0, qty: 10, qual: 10, places: ["none"], freq: null, daily: ["none"], expert: "no" }, // 05 改善→none
    r1Symptom[5], // 06 none 継続
    { ...r1Symptom[6], symptoms: ["neck_shoulder"], primary: "neck_shoulder", places: ["massage"], daily: ["patch"] }, // 07 lower_back→neck_shoulder
    r1Symptom[7], // 08 none 継続
    { ...r1Symptom[8], symptoms: ["mental"], primary: "mental", days: 12, absent: 2, qty: 6, qual: 5 }, // 09 改善（sleep解消）
    { ...r1Symptom[9], days: 18, absent: 3, qty: 5, qual: 5 }, // 10 lower_back 軽減
    r1Symptom[10], // 11 neck_shoulder 継続
    r1Symptom[11], // 12 none 継続
    { ...r1Symptom[12], symptoms: ["none"], primary: null, days: 0, absent: 0, qty: 10, qual: 10, places: ["none"], freq: null, daily: ["none"], expert: "no" }, // 13 改善→none
    r1Symptom[13], // 14 fatigue 継続
    r1Symptom[14], // 15 none 継続
    { ...r1Symptom[15], symptoms: ["lower_back"], primary: "lower_back", days: 14, absent: 1, qty: 6, qual: 6 }, // 16 改善（neck_shoulder解消）
  ];

  const symptoms = isRound2 ? r2Symptom : r1Symptom;

  // K6 scores: R1 やや高め、R2 改善傾向
  const k6R1: [number, number, number, number, number, number][] = [
    [1,0,1,1,1,0], [1,1,0,1,1,0], [0,0,0,0,1,0], [1,1,1,1,2,0],
    [1,1,1,2,2,1], [0,0,0,0,0,0], [0,0,1,0,1,0], [0,1,0,0,1,0],
    [3,2,2,3,2,2], [2,1,2,1,2,1], [1,1,1,1,1,0], [0,0,0,0,0,0],
    [1,0,1,1,1,0], [2,1,2,2,2,1], [0,0,0,0,1,0], [2,1,2,2,1,1],
  ];
  const k6R2: [number, number, number, number, number, number][] = [
    [1,0,0,1,1,0], [0,0,0,0,0,0], [0,0,0,0,0,0], [1,0,1,1,1,0],
    [0,0,0,1,1,0], [0,0,0,0,0,0], [0,0,0,0,1,0], [0,0,0,0,1,0],
    [2,1,2,2,1,1], [1,1,1,1,2,0], [1,1,0,1,1,0], [0,0,0,0,0,0],
    [0,0,0,0,1,0], [1,1,1,2,1,1], [0,0,0,0,0,0], [1,0,1,1,1,0],
  ];

  // SPOS-J scores (0-6 per item)
  const sposR1: [number, number, number, number][] = [
    [4,4,3,4], [5,5,4,5], [5,5,5,5], [3,3,3,3],
    [3,3,2,3], [6,6,6,6], [5,4,5,4], [4,4,4,4],
    [2,2,2,2], [3,3,3,3], [4,4,4,5], [5,5,5,5],
    [4,4,4,4], [3,3,4,3], [5,6,5,6], [3,3,3,4],
  ];
  const sposR2: [number, number, number, number][] = [
    [5,4,4,5], [5,5,5,5], [5,5,5,5], [4,3,4,4],
    [5,5,5,5], [6,6,6,6], [5,5,5,5], [4,4,4,4],
    [3,3,3,3], [4,4,4,4], [4,4,5,5], [5,5,5,5],
    [5,5,5,5], [4,4,4,4], [5,6,5,6], [4,4,4,4],
  ];

  const roleImpacts = ["rarely","little","rarely","little","sometimes","rarely","rarely","rarely","often","sometimes","sometimes","rarely","little","often","rarely","often"];
  const supportDesires = ["not_needed","not_needed","not_needed","not_needed","conditional","not_needed","not_needed","not_needed","want","conditional","conditional","not_needed","not_needed","want","not_needed","want"];

  const exerciseHabits = [false, true, true, false, false, true, true, false, false, false, true, true, true, false, true, false];
  const exerciseDays   = [null, 2, 3, null, null, 4, 2, null, null, null, 2, 3, 2, null, 4, null];

  const k6 = isRound2 ? k6R2 : k6R1;
  const spos = isRound2 ? sposR2 : sposR1;
  const dateBase = isRound2 ? "2027-03" : "2026-09";
  const days = [5,5,5,5,5,5,6,6,6,6,7,7,7,7,8,8];

  return PERSONS.map((p, i) => ({
    id: `${roundPrefix}-${String(i + 1).padStart(2, "0")}`,
    submittedAt: `${dateBase}-${String(days[i]).padStart(2,"0")}T${String(9 + i).padStart(2,"0")}:00:00Z`,
    name: p.name,
    kana: p.kana,
    dob: p.dob,
    gender: p.gender,
    dept: p.dept,
    employment: p.employment,
    ...symptoms[i],
    k6: k6[i],
    spos: spos[i],
    roleImpact: roleImpacts[i],
    supportDesire: supportDesires[i],
    exerciseHabit: exerciseHabits[i],
    exerciseDays: exerciseDays[i] as number | null,
  }));
}

// ─── 挿入ヘルパー ──────────────────────────────────────────────────────────────

async function insertResponses(roundId: number, responses: ResponseData[]) {
  for (const r of responses) {
    const { error } = await supabase.from("survey_responses").insert({
      id: r.id,
      client_code: "demo",
      survey_round_id: roundId,
      submitted_at: r.submittedAt,
      full_name: r.name,
      full_name_kana: r.kana,
      date_of_birth: r.dob,
      gender: r.gender,
      department: r.dept,
      employment_type: r.employment,
      symptom_conditions: r.symptoms,
      primary_condition: r.primary,
      symptom_days_past30: r.days,
      absentee_days_past_year: r.absent,
      work_quantity: r.qty,
      work_quality: r.qual,
      treatment_places: r.places,
      treatment_frequency: r.freq,
      daily_items: r.daily,
      consultation_health: r.cHealth,
      consultation_work: r.cWork,
      consultation_family: r.cFamily,
      consultation_mental: r.cMental,
      expert_support_intent: r.expert,
    });
    if (error) throw new Error(`survey_responses insert error (${r.id}): ${error.message}`);

    await supabase.from("mental_health_responses").insert({
      survey_response_id: r.id,
      q17_1_score: r.k6[0], q17_2_score: r.k6[1], q17_3_score: r.k6[2],
      q17_4_score: r.k6[3], q17_5_score: r.k6[4], q17_6_score: r.k6[5],
    });
    await supabase.from("company_support_responses").insert({
      survey_response_id: r.id,
      q18_1_score: r.spos[0], q18_2_score: r.spos[1],
      q18_3_score: r.spos[2], q18_4_score: r.spos[3],
    });
    await supabase.from("work_life_responses").insert({
      survey_response_id: r.id,
      role_impact: r.roleImpact,
      support_desire: r.supportDesire,
    });
    await supabase.from("exercise_responses").insert({
      survey_response_id: r.id,
      has_exercise_habit: r.exerciseHabit,
      exercise_days: r.exerciseDays,
    });
  }
}

// ─── メイン ────────────────────────────────────────────────────────────────────

async function ensureRound(title: string, startedAt: string, endedAt: string): Promise<number> {
  const { data: existing } = await supabase
    .from("survey_rounds").select("id").eq("client_code", "demo").eq("title", title).single();
  if (existing) return existing.id;
  const { data, error } = await supabase.from("survey_rounds")
    .insert({ client_code: "demo", title, started_at: startedAt, ended_at: endedAt })
    .select("id").single();
  if (error) throw new Error(`round insert error: ${error.message}`);
  return data!.id;
}

async function main() {
  const demoPass = process.env.DEMO_ADMIN_PASS;
  if (!demoPass || demoPass.length < 8) {
    throw new Error("DEMO_ADMIN_PASS が未設定または8文字未満です");
  }

  // 1. クライアント
  const { data: existingClient } = await supabase.from("clients").select("code").eq("code", "demo").single();
  if (!existingClient) {
    console.log("1/7 クライアント作成...");
    const { error } = await supabase.from("clients").insert({
      code: "demo", name: "見本株式会社",
      module_mental_health: true, module_company_support: true,
      module_work_life: true, module_exercise: true,
    });
    if (error) throw new Error(error.message);
  } else {
    console.log("1/7 クライアント既存 → スキップ");
  }

  // 2. 部署
  const { data: existingDepts } = await supabase.from("departments").select("id").eq("client_code", "demo");
  if (!existingDepts || existingDepts.length === 0) {
    console.log("2/7 部署作成...");
    await supabase.from("departments").insert([
      { client_code: "demo", name: "総務部", sort_order: 0 },
      { client_code: "demo", name: "製造部", sort_order: 1 },
      { client_code: "demo", name: "営業部", sort_order: 2 },
      { client_code: "demo", name: "管理部", sort_order: 3 },
    ]);
  } else {
    console.log("2/7 部署既存 → スキップ");
  }

  // 3. 実施回（不足分のみ作成）
  console.log("3/7 実施回確認/作成...");
  const r1Id = await ensureRound("第1回 2026年9月", "2026-09-01", "2026-09-30");
  const r2Id = await ensureRound("第2回 2027年3月", "2027-03-01", "2027-03-31");
  await ensureRound("第3回 2027年9月（撮影用）", "2027-09-01", "2027-09-30");
  console.log(`  r1=${r1Id}, r2=${r2Id}`);

  // 4. 第1回 回答（なければ作成）
  const { count: r1Count } = await supabase.from("survey_responses")
    .select("id", { count: "exact", head: true }).eq("survey_round_id", r1Id);
  if (!r1Count || r1Count === 0) {
    console.log("4/7 第1回 回答データ作成（16件）...");
    await insertResponses(r1Id, makeResponses("demo-r1", "2026-09", false));
  } else {
    console.log(`4/7 第1回 回答既存（${r1Count}件）→ スキップ`);
  }

  // 5. 第2回 回答（なければ作成）
  const { count: r2Count } = await supabase.from("survey_responses")
    .select("id", { count: "exact", head: true }).eq("survey_round_id", r2Id);
  if (!r2Count || r2Count === 0) {
    console.log("5/7 第2回 回答データ作成（16件）...");
    await insertResponses(r2Id, makeResponses("demo-r2", "2027-03", true));
  } else {
    console.log(`5/7 第2回 回答既存（${r2Count}件）→ スキップ`);
  }

  // 6. client_admin アカウント（なければ作成）
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const demoUser = existingUsers?.users.find(u => u.email === "demo-admin@example.com");
  if (!demoUser) {
    console.log("6/7 client_admin アカウント作成...");
    const { error: userErr } = await supabase.auth.admin.createUser({
      email: "demo-admin@example.com",
      password: demoPass,
      app_metadata: { role: "client_admin", client_code: "demo" },
      email_confirm: true,
    });
    if (userErr) throw new Error(`auth user create error: ${userErr.message}`);
  } else {
    console.log("6/7 client_admin 既存 → スキップ");
  }

  console.log("7/7 完了！");
  console.log("  クライアント: demo（見本株式会社）");
  console.log("  実施回: 第1回/第2回（各16件）＋第3回（0件）");
  console.log("  アカウント: demo-admin@example.com");
}

main().catch((e) => { console.error(e); process.exit(1); });
