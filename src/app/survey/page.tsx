"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppChrome } from "@/components/AppChrome";
import { clientExists, getDepartments, getQqConditions } from "@/lib/storage";
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

// TODO(#20): storage.ts に getClientModules(clientCode) を追加して差し替える
//            clients テーブルの module_mental_health / module_company_support /
//            module_work_life / module_exercise カラムを参照する
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
  const [modules] = useState<ClientModules>(DEFAULT_MODULES);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [currentScreen, setCurrentScreen] = useState<ScreenId>("basic_info");
  const [clientStatus, setClientStatus] = useState<"checking" | "valid" | "invalid">("checking");

  const load = useCallback(async () => {
    if (!clientCode) {
      setClientStatus("invalid");
      return;
    }
    const valid = await clientExists(clientCode);
    if (!valid) {
      setClientStatus("invalid");
      return;
    }
    setClientStatus("valid");
    const [depts, conditions] = await Promise.all([
      getDepartments(clientCode),
      getQqConditions(clientCode),
    ]);
    setDepartments(depts);
    setQqConditions(conditions);
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
    // TODO(#20): 以下を実装する
    // 1. addResponse を新スキーマ（FormState）に合わせて更新
    //    - survey_round_id: surveyRoundId（NOT NULL なので必須）
    //    - full_name, date_of_birth, employment_type など新カラムを含める
    // 2. modules.mentalHealth が true の場合は mental_health_responses にも INSERT
    // 3. modules.companySupport が true の場合は company_support_responses にも INSERT
    // 4. modules.workLife が true の場合は work_life_responses にも INSERT
    // 5. modules.exercise が true の場合は exercise_responses にも INSERT
    console.log("TODO: submit", { form, surveyRoundId });
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