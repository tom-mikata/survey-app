import { CONDITION_TO_PAIN_DEFAULT, QQ_CONDITIONS } from "./constants";
import type { AgeGroup, Gender, PainAreaCode, QqConditionId, QqConditionItem, SurveyResponse } from "./types";
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

export async function createClientRecord(code: string, name: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from("clients").insert({ code, name });
  return { error: error?.message ?? null };
}

export async function getDepartments(clientCode: string | null): Promise<string[]> {
  let query = supabase.from("departments").select("name").order("sort_order");
  if (clientCode) query = query.eq("client_code", clientCode);
  const { data, error } = await query;
  if (error || !data || data.length === 0) return [];
  return data.map((r: { name: string }) => r.name);
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

export async function getResponses(clientCode: string | null): Promise<SurveyResponse[]> {
  let query = supabase.from("survey_responses").select("*").order("submitted_at");
  if (clientCode) query = query.eq("client_code", clientCode);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((r: {
    id: string;
    client_code: string;
    submitted_at: string;
    department: string;
    age_group: string;
    gender: string;
    qq_condition: string;
    symptom_days_past30: number;
    work_quantity: number;
    work_quality: number;
    had_absenteeism: boolean;
    monthly_salary_man_yen: number;
    we_vigor: number;
    we_dedication: number;
    we_absorption: number;
  }) => ({
    id: r.id,
    clientCode: r.client_code,
    submittedAt: r.submitted_at,
    department: r.department,
    ageGroup: r.age_group as AgeGroup,
    gender: r.gender as Gender,
    qqCondition: r.qq_condition,
    symptomDaysPast30: r.symptom_days_past30,
    workQuantity: r.work_quantity,
    workQuality: r.work_quality,
    hadAbsenteeismOnSymptomDays: r.had_absenteeism,
    monthlySalaryManYen: r.monthly_salary_man_yen,
    weVigor: r.we_vigor,
    weDedication: r.we_dedication,
    weAbsorption: r.we_absorption,
  }));
}

export async function addResponse(response: SurveyResponse): Promise<void> {
  await supabase.from("survey_responses").insert({
    id: response.id,
    client_code: response.clientCode,
    submitted_at: response.submittedAt,
    department: response.department,
    age_group: response.ageGroup,
    gender: response.gender,
    qq_condition: response.qqCondition,
    symptom_days_past30: response.symptomDaysPast30,
    work_quantity: response.workQuantity,
    work_quality: response.workQuality,
    had_absenteeism: response.hadAbsenteeismOnSymptomDays,
    monthly_salary_man_yen: response.monthlySalaryManYen,
    we_vigor: response.weVigor,
    we_dedication: response.weDedication,
    we_absorption: response.weAbsorption,
  });
}

export async function clearResponses(clientCode: string): Promise<void> {
  await supabase.from("survey_responses").delete().eq("client_code", clientCode);
}
