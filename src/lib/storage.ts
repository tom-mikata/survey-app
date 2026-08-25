import { CONDITION_TO_PAIN_DEFAULT, QQ_CONDITIONS } from "./constants";
import type { Gender, PainAreaCode, QqConditionId, QqConditionItem, SurveyResponse, SurveyRound } from "./types";
import { supabase } from "./supabase";

function buildDefaultQqConditions(): QqConditionItem[] {
  return QQ_CONDITIONS.map((c) => ({
    id: c.id,
    label: c.label,
    painAreas: CONDITION_TO_PAIN_DEFAULT[c.id as QqConditionId] ?? [],
  }));
}

export async function getClients(): Promise<{ code: string; name: string }[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("code, name")
    .order("name");
  if (error || !data) return [];
  return data as { code: string; name: string }[];
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