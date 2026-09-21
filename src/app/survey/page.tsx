"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppChrome } from "@/components/AppChrome";
import type { Gender } from "@/lib/types";
import {
  addCompanySupportResponse,
  addExerciseResponse,
  addMentalHealthResponse,
  addResponse,
  addWorkLifeResponse,
  clientExists,
  getClientModules,
  getDepartments,
  getQqConditions,
} from "@/lib/storage";
import {
  buildScreenList,
  INITIAL_FORM,
  type ClientModules,
  type FormState,
  type ScreenId,
} from "./_types";
import { StepBasicInfo } from "./_steps/StepBasicInfo";
import { StepSymptoms } from "./_steps/StepSymptoms";
import { StepQQ } from "./_steps/StepQQ";
import { StepPainCare } from "./_steps/StepPainCare";
import { StepConsultation } from "./_steps/StepConsultation";
import { StepMentalHealth } from "./_steps/StepMentalHealth";
import { StepCompanySupport } from "./_steps/StepCompanySupport";
import { StepWorkLife } from "./_steps/StepWorkLife";
import { StepExercise } from "./_steps/StepExercise";

// getClientModules() の応答が届くまでの初期値（全モジュールOFF）
const DEFAULT_MODULES: ClientModules = {
  mentalHealth: false,
  companySupport: false,
  workLife: false,
  exercise: false,
};

export default function SurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; round?: string }>;
}) {
  const { client: clientCode = "", round } = use(searchParams);
  // TODO(#20): surveyRoundId が null の場合はエラー表示 or バリデーション (#18 連携)
  const surveyRoundId = round ? Number(round) : null;
  const router = useRouter();

  const [departments, setDepartments] = useState<string[]>([]);
  const [qqConditions, setQqConditions] = useState<{ id: string; label: string }[]>([]);
  const [modules, setModules] = useState<ClientModules>(DEFAULT_MODULES);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("basic_info");
  const [clientStatus, setClientStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [consent, setConsent] = useState<"pending" | "agreed" | "declined">("pending");

  const load = useCallback(async () => {
    if (!clientCode || !surveyRoundId) {
      setClientStatus("invalid");
      return;
    }
    const valid = await clientExists(clientCode);
    if (!valid) {
      setClientStatus("invalid");
      return;
    }
    setClientStatus("valid");
    const [depts, conditions, clientModules] = await Promise.all([
      getDepartments(clientCode),
      getQqConditions(clientCode),
      getClientModules(clientCode),
    ]);
    setDepartments(depts);
    setQqConditions(conditions);
    setModules(clientModules);
  }, [clientCode]);

  useEffect(() => { queueMicrotask(() => load()); }, [load]);

  const updateForm = useCallback((updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const screens = useMemo(() => buildScreenList(form, modules), [form, modules]);
  const currentIndex = screens.indexOf(currentScreen);

  // 症状選択の変更などで現在画面がリストから外れた場合は直前の有効画面に戻る
  useEffect(() => {
    if (!screens.includes(currentScreen)) {
      setCurrentScreen(screens[Math.max(0, currentIndex - 1)] ?? "basic_info");
    }
  }, [screens, currentScreen, currentIndex]);

  const goNext = () => {
    if (currentIndex < screens.length - 1) setCurrentScreen(screens[currentIndex + 1]);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentScreen(screens[currentIndex - 1]);
  };

  const submit = async () => {
    const id = crypto.randomUUID();
    const submittedAt = new Date().toISOString();

    await addResponse({
      id,
      clientCode,
      surveyRoundId,
      submittedAt,
      fullName: form.fullName,
      fullNameKana: form.fullNameKana,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender as Gender,
      department: form.department,
      employmentType: form.employmentType,
      symptomConditions: form.symptomConditions,
      symptomConditionsOther: form.symptomConditionsOther || null,
      primaryCondition: form.primaryCondition || null,
      symptomDaysPast30: form.symptomDaysPast30,
      absenteeDaysPastYear: form.absenteeDaysPastYear,
      workQuantity: form.workQuantity,
      workQuality: form.workQuality,
      treatmentPlaces: form.treatmentPlaces,
      treatmentPlacesOther: form.treatmentPlacesOther || null,
      treatmentFrequency: form.treatmentFrequency,
      dailyItems: form.dailyItems,
      dailyItemsOther: form.dailyItemsOther || null,
      consultationHealth: form.consultationHealth,
      consultationWork: form.consultationWork,
      consultationFamily: form.consultationFamily,
      consultationMental: form.consultationMental,
      expertSupportIntent: form.expertSupportIntent,
    });

    if (modules.mentalHealth) {
      await addMentalHealthResponse(id, {
        q17_1: form.q17_1Score!,
        q17_2: form.q17_2Score!,
        q17_3: form.q17_3Score!,
        q17_4: form.q17_4Score!,
        q17_5: form.q17_5Score!,
        q17_6: form.q17_6Score!,
      });
    }

    if (modules.companySupport) {
      await addCompanySupportResponse(id, {
        q18_1: form.q18_1Score!,
        q18_2: form.q18_2Score!,
        q18_3: form.q18_3Score!,
        q18_4: form.q18_4Score!,
      });
    }

    if (modules.workLife) {
      await addWorkLifeResponse(id, {
        roleImpact: form.roleImpact,
        supportDesire: form.supportDesire || null,
      });
    }

    if (modules.exercise) {
      await addExerciseResponse(id, {
        hasExerciseHabit: form.hasExerciseHabit!,
        exerciseDays: form.exerciseDays,
      });
    }

    router.push("/survey/complete");
  };

  const stepProps = {
    form,
    onChange: updateForm,
    onNext: goNext,
    onPrev: goPrev,
    isFirst: currentIndex === 0,
    isLast: currentIndex === screens.length - 1,
    onSubmit: submit,
  };

  if (clientStatus === "checking") {
    return (
      <AppChrome title="従業員健康診断アンケート">
        <main className="max-w-2xl mx-auto px-6 py-10" />
      </AppChrome>
    );
  }

  if (clientStatus === "invalid") {
    return (
      <AppChrome title="従業員健康診断アンケート">
        <main className="max-w-2xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              URLが正しくありません。
              <br />
              担当者よりご案内のあったURLをご確認ください。
            </p>
          </div>
        </main>
      </AppChrome>
    );
  }

  if (consent === "pending") {
    return (
      <AppChrome title="従業員健康診断アンケート">
        <main className="max-w-2xl mx-auto px-6 py-10">
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-slate-800 mb-4">個人情報の取り扱いについて</h2>
              <div className="text-sm text-slate-600 mb-6 space-y-3 leading-relaxed">
                <p>
                  このアンケートでは、健康状態および就労状況に関する個人情報を収集します。収集した情報は、職場の健康管理施策の立案・改善を目的にのみ使用し、個人を特定する形での第三者提供はいたしません。
                </p>
                <p>
                  詳しくは
                  <a
                    href="/privacy-policy.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:underline"
                  >
                    個人情報保護方針（PDF）
                  </a>
                  をご確認ください。
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setConsent("declined")}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  同意しない
                </button>
                <button
                  type="button"
                  onClick={() => setConsent("agreed")}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 rounded-xl hover:bg-sky-700"
                >
                  同意する
                </button>
              </div>
            </div>
          </div>
        </main>
      </AppChrome>
    );
  }

  if (consent === "declined") {
    return (
      <AppChrome title="従業員健康診断アンケート">
        <main className="max-w-2xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">
              個人情報の取り扱いへの同意が必要なため、
              <br />
              アンケートを開始できません。
            </p>
          </div>
        </main>
      </AppChrome>
    );
  }

  return (
    <AppChrome title="従業員健康診断アンケート">
      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* プログレスバー */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-xs font-semibold text-sky-700 bg-sky-50 px-3 py-1 rounded-full">
            ステップ {currentIndex + 1} / {screens.length}
          </p>
          <div className="flex gap-1">
            {screens.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${i <= currentIndex ? "bg-sky-600" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>

        {currentScreen === "basic_info" && (
          <StepBasicInfo {...stepProps} departments={departments} />
        )}
        {currentScreen === "symptoms" && (
          <StepSymptoms {...stepProps} qqConditions={qqConditions} />
        )}
        {currentScreen === "qq" && <StepQQ {...stepProps} />}
        {currentScreen === "pain_care" && <StepPainCare {...stepProps} />}
        {currentScreen === "consultation" && <StepConsultation {...stepProps} />}
        {currentScreen === "mental_health" && <StepMentalHealth {...stepProps} />}
        {currentScreen === "company_support" && <StepCompanySupport {...stepProps} />}
        {currentScreen === "work_life" && <StepWorkLife {...stepProps} />}
        {currentScreen === "exercise" && <StepExercise {...stepProps} />}
      </main>
    </AppChrome>
  );
}