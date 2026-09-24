import { CONDITION_TO_PAIN_DEFAULT, QQ_CONDITIONS } from "./constants";
import type { ClientModules, CompanySupportRow, ExerciseRow, Gender, MentalHealthRow, PainAreaCode, QqConditionId, QqConditionItem, SecondPartData, SurveyResponse, SurveyRound, WorkLifeRow } from "./types";
import { supabase } from "./supabase";

function buildDefaultQqConditions(): QqConditionItem[] {
  return QQ_CONDITIONS.map((c) => ({
    id: c.id,
    label: c.label,
    painAreas: CONDITION_TO_PAIN_DEFAULT[c.id as QqConditionId] ?? [],
  }));
}

export async function getClients(): Promise<
  { code: string; name: string; modules: ClientModules }[]
> {
  const { data, error } = await supabase
    .from("clients")
    .select("code, name, module_mental_health, module_company_support, module_work_life, module_exercise")
    .order("name");
  if (error || !data) return [];
  return (data as {
    code: string;
    name: string;
    module_mental_health: boolean;
    module_company_support: boolean;
    module_work_life: boolean;
    module_exercise: boolean;
  }[]).map((r) => ({
    code: r.code,
    name: r.name,
    modules: {
      mentalHealth: r.module_mental_health,
      companySupport: r.module_company_support,
      workLife: r.module_work_life,
      exercise: r.module_exercise,
    },
  }));
}

/** #18: 匿名ユーザーからのクライアントコード存在確認。RLSを経由しないRPC（client_exists）を使用する。 */
export async function clientExists(code: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("client_exists", { p_code: code });
  if (error) return false;
  return data === true;
}

export async function createClientRecord(code: string, name: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("clients").insert({ code, name });
  return { error: error?.message ?? null };
}

const NO_MODULES: ClientModules = {
  mentalHealth: false,
  companySupport: false,
  workLife: false,
  exercise: false,
};

/**
 * #20: 企業ごとの第2部モジュールON/OFF設定を取得する。
 * clients テーブルは匿名ユーザーからSELECTできない（RLS）ため、
 * client_exists と同様に RLS を経由しない RPC（get_client_modules）を使用する。
 */
export async function getClientModules(clientCode: string): Promise<ClientModules> {
  const { data, error } = await supabase.rpc("get_client_modules", { p_code: clientCode });
  if (error || !data || data.length === 0) return NO_MODULES;
  const row = (data as {
    module_mental_health: boolean;
    module_company_support: boolean;
    module_work_life: boolean;
    module_exercise: boolean;
  }[])[0];
  return {
    mentalHealth: row.module_mental_health,
    companySupport: row.module_company_support,
    workLife: row.module_work_life,
    exercise: row.module_exercise,
  };
}

export async function updateClientRecord(code: string, name: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("clients").update({ name }).eq("code", code);
  return { error: error?.message ?? null };
}

/**
 * #20: 企業ごとの第2部モジュール（問17〜22）のON/OFF設定を更新する。
 * 設定画面はsystem_adminのみ表示され、clients テーブルはsystem_adminにFOR ALLで
 * 許可されているため、RLSの追加対応は不要（anonからの参照とは別経路）。
 */
export async function updateClientModules(
  code: string,
  modules: ClientModules,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("clients")
    .update({
      module_mental_health: modules.mentalHealth,
      module_company_support: modules.companySupport,
      module_work_life: modules.workLife,
      module_exercise: modules.exercise,
    })
    .eq("code", code);
  return { error: error?.message ?? null };
}

/** #40: 企業を削除する。紐づく回答データ・部署・実施回も含めてカスケード削除する（delete_client_cascade RPC）。 */
export async function deleteClientRecord(code: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("delete_client_cascade", { p_client_code: code });
  return { error: error?.message ?? null };
}

export async function getDepartments(clientCode: string | null): Promise<string[]> {
  let query = supabase.from("departments").select("name").order("sort_order");
  if (clientCode) query = query.eq("client_code", clientCode);
  const { data, error } = await query;
  if (error || !data || data.length === 0) return [];
  return [...new Set(data.map((r: { name: string }) => r.name))];
}

export async function setDepartments(clientCode: string, departments: string[]): Promise<void> {
  await supabase.from("departments").delete().eq("client_code", clientCode);
  if (departments.length === 0) return;
  await supabase.from("departments").insert(
    departments.map((name, i) => ({ name, sort_order: i, client_code: clientCode })),
  );
}

export async function getQqConditions(clientCode: string | null): Promise<QqConditionItem[]> {
  let query = supabase.from("qq_conditions").select("id, label, pain_areas").order("sort_order");
  if (clientCode) query = query.eq("client_code", clientCode);
  const { data, error } = await query;
  if (error || !data || data.length === 0) return buildDefaultQqConditions();
  return data.map((r: { id: string; label: string; pain_areas: string[] }) => ({
    id: r.id,
    label: r.label,
    painAreas: (r.pain_areas ?? []) as PainAreaCode[],
  }));
}

export async function setQqConditions(clientCode: string, conditions: QqConditionItem[]): Promise<void> {
  await supabase.from("qq_conditions").delete().eq("client_code", clientCode);
  if (conditions.length === 0) return;
  await supabase.from("qq_conditions").insert(
    conditions.map((c, i) => ({
      id: c.id,
      label: c.label,
      pain_areas: c.painAreas,
      sort_order: i,
      client_code: clientCode,
    })),
  );
}

export async function getResponses(
  clientCode: string | null,
  surveyRoundId?: number | null,
): Promise<SurveyResponse[]> {
  let query = supabase.from("survey_responses").select("*").order("submitted_at");
  if (clientCode) query = query.eq("client_code", clientCode);
  if (surveyRoundId) query = query.eq("survey_round_id", surveyRoundId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((r: {
    id: string;
    client_code: string;
    survey_round_id: number | null;
    submitted_at: string;
    full_name: string;
    full_name_kana: string;
    date_of_birth: string;
    gender: string;
    department: string;
    employment_type: string;
    symptom_conditions: string[];
    symptom_conditions_other: string | null;
    primary_condition: string | null;
    symptom_days_past30: number;
    absentee_days_past_year: number;
    work_quantity: number;
    work_quality: number;
    treatment_places: string[];
    treatment_places_other: string | null;
    treatment_frequency: number | null;
    daily_items: string[];
    daily_items_other: string | null;
    consultation_health: string;
    consultation_work: string;
    consultation_family: string;
    consultation_mental: string;
    expert_support_intent: string;
  }) => ({
    id: r.id,
    clientCode: r.client_code,
    surveyRoundId: r.survey_round_id,
    submittedAt: r.submitted_at,
    fullName: r.full_name,
    fullNameKana: r.full_name_kana,
    dateOfBirth: r.date_of_birth,
    gender: r.gender as Gender,
    department: r.department,
    employmentType: r.employment_type,
    symptomConditions: r.symptom_conditions ?? [],
    symptomConditionsOther: r.symptom_conditions_other,
    primaryCondition: r.primary_condition,
    symptomDaysPast30: r.symptom_days_past30,
    absenteeDaysPastYear: r.absentee_days_past_year ?? 0,
    workQuantity: r.work_quantity,
    workQuality: r.work_quality,
    treatmentPlaces: r.treatment_places ?? [],
    treatmentPlacesOther: r.treatment_places_other,
    treatmentFrequency: r.treatment_frequency,
    dailyItems: r.daily_items ?? [],
    dailyItemsOther: r.daily_items_other,
    consultationHealth: r.consultation_health,
    consultationWork: r.consultation_work,
    consultationFamily: r.consultation_family,
    consultationMental: r.consultation_mental,
    expertSupportIntent: r.expert_support_intent,
  }));
}

export async function addResponse(response: SurveyResponse): Promise<void> {
  await supabase.from("survey_responses").insert({
    id: response.id,
    client_code: response.clientCode,
    survey_round_id: response.surveyRoundId,
    submitted_at: response.submittedAt,
    full_name: response.fullName,
    full_name_kana: response.fullNameKana,
    date_of_birth: response.dateOfBirth,
    gender: response.gender,
    department: response.department,
    employment_type: response.employmentType,
    symptom_conditions: response.symptomConditions,
    symptom_conditions_other: response.symptomConditionsOther,
    primary_condition: response.primaryCondition,
    symptom_days_past30: response.symptomDaysPast30,
    absentee_days_past_year: response.absenteeDaysPastYear,
    work_quantity: response.workQuantity,
    work_quality: response.workQuality,
    treatment_places: response.treatmentPlaces,
    treatment_places_other: response.treatmentPlacesOther,
    treatment_frequency: response.treatmentFrequency,
    daily_items: response.dailyItems,
    daily_items_other: response.dailyItemsOther,
    consultation_health: response.consultationHealth,
    consultation_work: response.consultationWork,
    consultation_family: response.consultationFamily,
    consultation_mental: response.consultationMental,
    expert_support_intent: response.expertSupportIntent,
  });
}

/** #20: 問17（心の健康、17-1〜17-6・各0〜4点）を mental_health_responses に保存する */
export async function addMentalHealthResponse(
  surveyResponseId: string,
  scores: { q17_1: number; q17_2: number; q17_3: number; q17_4: number; q17_5: number; q17_6: number },
): Promise<void> {
  await supabase.from("mental_health_responses").insert({
    survey_response_id: surveyResponseId,
    q17_1_score: scores.q17_1,
    q17_2_score: scores.q17_2,
    q17_3_score: scores.q17_3,
    q17_4_score: scores.q17_4,
    q17_5_score: scores.q17_5,
    q17_6_score: scores.q17_6,
  });
}

/** #20: 問18（会社のサポート、18-1〜18-4・各0〜6点）を company_support_responses に保存する */
export async function addCompanySupportResponse(
  surveyResponseId: string,
  scores: { q18_1: number; q18_2: number; q18_3: number; q18_4: number },
): Promise<void> {
  await supabase.from("company_support_responses").insert({
    survey_response_id: surveyResponseId,
    q18_1_score: scores.q18_1,
    q18_2_score: scores.q18_2,
    q18_3_score: scores.q18_3,
    q18_4_score: scores.q18_4,
  });
}

/** #20: 問19〜20（仕事以外の負担）を work_life_responses に保存する */
export async function addWorkLifeResponse(
  surveyResponseId: string,
  data: { roleImpact: string; supportDesire: string | null },
): Promise<void> {
  await supabase.from("work_life_responses").insert({
    survey_response_id: surveyResponseId,
    role_impact: data.roleImpact,
    support_desire: data.supportDesire,
  });
}

/** #20: 問21〜22（運動の習慣）を exercise_responses に保存する */
export async function addExerciseResponse(
  surveyResponseId: string,
  data: { hasExerciseHabit: boolean; exerciseDays: number | null },
): Promise<void> {
  await supabase.from("exercise_responses").insert({
    survey_response_id: surveyResponseId,
    has_exercise_habit: data.hasExerciseHabit,
    exercise_days: data.exerciseDays,
  });
}

export async function clearResponses(clientCode: string): Promise<void> {
  await supabase.from("survey_responses").delete().eq("client_code", clientCode);
}

export async function getSurveyRounds(clientCode: string): Promise<SurveyRound[]> {
  const { data, error } = await supabase
    .from("survey_rounds")
    .select("id, client_code, title, started_at, ended_at, created_at")
    .eq("client_code", clientCode)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r: {
    id: number;
    client_code: string;
    title: string;
    started_at: string | null;
    ended_at: string | null;
    created_at: string;
  }) => ({
    id: r.id,
    clientCode: r.client_code,
    title: r.title,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    createdAt: r.created_at,
  }));
}

export async function createSurveyRound(
  clientCode: string,
  title: string,
  startedAt?: string,
  endedAt?: string,
): Promise<{ id: number | null; error: string | null }> {
  const { data, error } = await supabase
    .from("survey_rounds")
    .insert({
      client_code: clientCode,
      title,
      started_at: startedAt || null,
      ended_at: endedAt || null,
    })
    .select("id")
    .single();
  if (error) return { id: null, error: error.message };
  return { id: (data as { id: number }).id, error: null };
}

export async function deleteSurveyRound(id: number): Promise<void> {
  await supabase.from("survey_rounds").delete().eq("id", id);
}

export async function getSecondPartData(responseIds: string[]): Promise<SecondPartData> {
  if (responseIds.length === 0) return { mental: [], support: [], workLife: [], exercise: [] };

  const [mentalRes, supportRes, workLifeRes, exerciseRes] = await Promise.all([
    supabase.from("mental_health_responses")
      .select("survey_response_id, q17_1_score, q17_2_score, q17_3_score, q17_4_score, q17_5_score, q17_6_score")
      .in("survey_response_id", responseIds),
    supabase.from("company_support_responses")
      .select("survey_response_id, q18_1_score, q18_2_score, q18_3_score, q18_4_score")
      .in("survey_response_id", responseIds),
    supabase.from("work_life_responses")
      .select("survey_response_id, role_impact, support_desire")
      .in("survey_response_id", responseIds),
    supabase.from("exercise_responses")
      .select("survey_response_id, has_exercise_habit, exercise_days")
      .in("survey_response_id", responseIds),
  ]);

  const mental: MentalHealthRow[] = (mentalRes.data ?? []).map((r: {
    survey_response_id: string;
    q17_1_score: number; q17_2_score: number; q17_3_score: number;
    q17_4_score: number; q17_5_score: number; q17_6_score: number;
  }) => ({
    surveyResponseId: r.survey_response_id,
    q17_1Score: r.q17_1_score, q17_2Score: r.q17_2_score, q17_3Score: r.q17_3_score,
    q17_4Score: r.q17_4_score, q17_5Score: r.q17_5_score, q17_6Score: r.q17_6_score,
  }));

  const support: CompanySupportRow[] = (supportRes.data ?? []).map((r: {
    survey_response_id: string;
    q18_1_score: number; q18_2_score: number; q18_3_score: number; q18_4_score: number;
  }) => ({
    surveyResponseId: r.survey_response_id,
    q18_1Score: r.q18_1_score, q18_2Score: r.q18_2_score,
    q18_3Score: r.q18_3_score, q18_4Score: r.q18_4_score,
  }));

  const workLife: WorkLifeRow[] = (workLifeRes.data ?? []).map((r: {
    survey_response_id: string; role_impact: string; support_desire: string | null;
  }) => ({
    surveyResponseId: r.survey_response_id,
    roleImpact: r.role_impact,
    supportDesire: r.support_desire,
  }));

  const exercise: ExerciseRow[] = (exerciseRes.data ?? []).map((r: {
    survey_response_id: string; has_exercise_habit: boolean; exercise_days: number | null;
  }) => ({
    surveyResponseId: r.survey_response_id,
    hasExerciseHabit: r.has_exercise_habit,
    exerciseDays: r.exercise_days,
  }));

  return { mental, support, workLife, exercise };
}

export async function updateSurveyRound(
  id: number,
  title: string,
  startedAt?: string,
  endedAt?: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("survey_rounds")
    .update({
      title,
      started_at: startedAt || null,
      ended_at: endedAt || null,
    })
    .eq("id", id);
  return { error: error?.message ?? null };
}