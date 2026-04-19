"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppChrome } from "@/components/AppChrome";
import { AGE_GROUPS, GENDERS, QQ_CONDITIONS } from "@/lib/constants";
import { addResponse, getDepartments } from "@/lib/storage";
import type { AgeGroup, Gender, QqConditionId, SurveyResponse } from "@/lib/types";

const STEPS = 10;

/** 全角数字を半角にし、数字以外を除去（IME確定後の値向け） */
function toAsciiDigitsOnly(raw: string): string {
  return raw
    .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, "");
}

export default function SurveyPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<string[]>([]);
  const [step, setStep] = useState(1);

  const [department, setDepartment] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup | "">("");
  const [gender, setGender] = useState<Gender | "">("");
  const [qqCondition, setQqCondition] = useState<QqConditionId | "">("");
  const [symptomDaysPast30, setSymptomDaysPast30] = useState(0);
  /** ステップ5の入力欄（空文字を許しキーボード入力しやすくする） */
  const [symptomDaysInput, setSymptomDaysInput] = useState("0");
  const [workQuantity, setWorkQuantity] = useState(7);
  const [workQuality, setWorkQuality] = useState(7);
  const [hadAbsenteeismOnSymptomDays, setHadAbsenteeismOnSymptomDays] = useState(false);
  const [monthlySalaryManYen, setMonthlySalaryManYen] = useState(30);
  /** ステップ9の入力欄 */
  const [monthlySalaryInput, setMonthlySalaryInput] = useState("30");
  const [weVigor, setWeVigor] = useState(4);
  const [weDedication, setWeDedication] = useState(4);
  const [weAbsorption, setWeAbsorption] = useState(4);

  /** 日本語IMEの変換中は値を加工しない（合成が途切れるのを防ぐ） */
  const symptomImeComposingRef = useRef(false);
  const salaryImeComposingRef = useRef(false);

  const isNoCondition = qqCondition === "none";

  const load = useCallback(() => {
    setDepartments(getDepartments());
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const prevStepRef = useRef(step);

  /** ステップに「入った直後」だけ同期（入力中は symptomDaysPast30 の変化で上書きしない） */
  useEffect(() => {
    const prev = prevStepRef.current;
    if (step === 5 && prev !== 5) setSymptomDaysInput(String(symptomDaysPast30));
    if (step === 9 && prev !== 9) setMonthlySalaryInput(String(monthlySalaryManYen));
    prevStepRef.current = step;
  }, [step, symptomDaysPast30, monthlySalaryManYen]);

  const canNext = useMemo(() => {
    if (step === 1) return department.length > 0;
    if (step === 2) return ageGroup !== "";
    if (step === 3) return gender !== "";
    if (step === 4) return qqCondition !== "";
    if (step === 5) return symptomDaysPast30 >= 0 && symptomDaysPast30 <= 30;
    if (step === 6) return workQuantity >= 0 && workQuantity <= 10;
    if (step === 7) return workQuality >= 0 && workQuality <= 10;
    if (step === 8) return true;
    if (step === 9) return monthlySalaryManYen > 0;
    if (step === 10) return weVigor >= 1 && weDedication >= 1 && weAbsorption >= 1;
    return false;
  }, [
    step,
    department,
    ageGroup,
    gender,
    qqCondition,
    symptomDaysPast30,
    workQuantity,
    workQuality,
    monthlySalaryManYen,
    weVigor,
    weDedication,
    weAbsorption,
  ]);

  const goNext = () => {
    if (step === 4 && qqCondition === "none") {
      setSymptomDaysPast30(0);
      setSymptomDaysInput("0");
      setWorkQuantity(10);
      setWorkQuality(10);
      setHadAbsenteeismOnSymptomDays(false);
      setStep(9);
      return;
    }
    setStep((s) => Math.min(STEPS, s + 1));
  };

  const goPrev = () => {
    if (step === 9 && isNoCondition) {
      setStep(4);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = () => {
    const salaryDigits = toAsciiDigitsOnly(monthlySalaryInput);
    const salaryParsed = parseInt(salaryDigits, 10);
    const salaryFinal = Number.isNaN(salaryParsed) || salaryParsed < 1 ? 30 : salaryParsed;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `r-${Date.now()}`;
    const cond = qqCondition as QqConditionId;
    const r: SurveyResponse = {
      id,
      submittedAt: new Date().toISOString(),
      department,
      ageGroup: ageGroup as AgeGroup,
      gender: gender as Gender,
      qqCondition: cond,
      symptomDaysPast30: cond === "none" ? 0 : symptomDaysPast30,
      workQuantity: cond === "none" ? 10 : workQuantity,
      workQuality: cond === "none" ? 10 : workQuality,
      hadAbsenteeismOnSymptomDays: cond === "none" ? false : hadAbsenteeismOnSymptomDays,
      monthlySalaryManYen: salaryFinal,
      weVigor,
      weDedication,
      weAbsorption,
    };
    addResponse(r);
    router.push("/survey/complete");
  };

  const onSymptomDaysFieldChange = (raw: string) => {
    const digits = toAsciiDigitsOnly(raw);
    setSymptomDaysInput(digits);
    if (digits === "") {
      setSymptomDaysPast30(0);
      return;
    }
    const n = parseInt(digits, 10);
    if (Number.isNaN(n)) return;
    const clamped = Math.min(30, Math.max(0, n));
    setSymptomDaysPast30(clamped);
    if (clamped !== n) setSymptomDaysInput(String(clamped));
  };

  const onSalaryFieldChange = (raw: string) => {
    const digits = toAsciiDigitsOnly(raw);
    setMonthlySalaryInput(digits);
    if (digits === "") {
      setMonthlySalaryManYen(0);
      return;
    }
    const n = parseInt(digits, 10);
    if (Number.isNaN(n)) return;
    setMonthlySalaryManYen(Math.max(0, n));
  };

  const normalizeSalaryOnBlur = () => {
    const n = parseInt(toAsciiDigitsOnly(monthlySalaryInput), 10);
    if (Number.isNaN(n) || n < 1) {
      setMonthlySalaryManYen(30);
      setMonthlySalaryInput("30");
      return;
    }
    setMonthlySalaryManYen(n);
    setMonthlySalaryInput(String(n));
  };

  const questionTitle = (() => {
    if (step === 1) return "所属部署を選んでください";
    if (step === 2) return "年代を選んでください";
    if (step === 3) return "性別を選んでください";
    if (step === 4) return "仕事に最も影響を及ぼしている健康上の問題はどれですか（QQメソッド 質問1）";
    if (step === 5) return "その不調が続いた日数を教えてください（QQメソッド 質問2）";
    if (step === 6) return "不調がある日の「仕事の量」について（QQメソッド 質問3）";
    if (step === 7) return "不調がある日の「仕事の質」について（QQメソッド 質問4）";
    if (step === 8) return "有症状日の欠勤について（QQメソッド 質問5）";
    if (step === 9) return "損失額の算出に用いる月給（万円）";
    return "ワークエンゲージメントについてお答えください";
  })();

  const stepBadge = step <= 3 ? `属性 ${step}/3` : step <= 8 ? `QQ ${step - 3}/5` : step === 9 ? "補足" : "WE";

  return (
    <AppChrome title="従業員健康診断アンケート">
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <p className="text-xs font-semibold text-sky-700 bg-sky-50 px-3 py-1 rounded-full">
            {stepBadge} · ステップ {step} / {STEPS}
          </p>
          <div className="flex gap-1">
            {Array.from({ length: STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full ${i < step ? "bg-sky-600" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">{questionTitle}</h1>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          {step === 1 ? (
            <label className="block">
              <span className="text-sm font-medium text-slate-600">部署</span>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-white"
              >
                <option value="">選択してください</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-400">
                一覧にない場合は、管理者に「設定」から部署の登録を依頼してください。
              </p>
            </label>
          ) : null}

          {step === 2 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AGE_GROUPS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAgeGroup(a.id)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold text-left transition-colors ${
                    ageGroup === a.id
                      ? "border-sky-500 bg-sky-50 text-sky-900"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold text-left transition-colors ${
                    gender === g.id
                      ? "border-sky-500 bg-sky-50 text-sky-900"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <p className="text-sm text-slate-500 mb-3 leading-relaxed">
                最も影響が大きいものを1つ選んでください（
                <a
                  href="https://wellaboswp.com/column/qq-method-presenteeism-guide/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline"
                >
                  QQメソッド
                </a>
                ）。
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-[28rem] overflow-y-auto pr-1">
                {QQ_CONDITIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setQqCondition(c.id)}
                    className={`rounded-xl border px-4 py-3 text-sm text-left font-medium leading-snug ${
                      qqCondition === c.id
                        ? "border-sky-500 bg-sky-50 text-sky-900"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <p className="text-sm text-slate-600 mb-3">過去30日間で、当該の不調があった日は何日でしたか？（0〜30）</p>
              <input
                type="text"
                inputMode="numeric"
                lang="en"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                aria-label="過去30日間の有症状日数"
                value={symptomDaysInput}
                onCompositionStart={() => {
                  symptomImeComposingRef.current = true;
                }}
                onCompositionEnd={(e) => {
                  symptomImeComposingRef.current = false;
                  onSymptomDaysFieldChange(e.currentTarget.value);
                }}
                onChange={(e) => {
                  if (symptomImeComposingRef.current) {
                    setSymptomDaysInput(e.target.value);
                    return;
                  }
                  onSymptomDaysFieldChange(e.target.value);
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-sky-500/30 [ime-mode:disabled]"
              />
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                日本語入力中は変換確定後に数字が反映されます。テンキーや半角の直接入力も利用できます。
              </p>
              <input
                type="range"
                min={0}
                max={30}
                value={symptomDaysPast30}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setSymptomDaysPast30(n);
                  setSymptomDaysInput(String(n));
                }}
                className="w-full mt-4 accent-sky-600"
              />
            </div>
          ) : null}

          {step === 6 ? (
            <div>
              <p className="text-sm text-slate-600 mb-2">
                不調がある日は、不調がない日と比べて、どの程度の仕事量をこなせましたか？（0〜10）
              </p>
              <p className="text-xs text-slate-400 mb-3">10：同じ量 / 0：全くできなかった</p>
              <Scale0to10 value={workQuantity} onChange={setWorkQuantity} />
            </div>
          ) : null}

          {step === 7 ? (
            <div>
              <p className="text-sm text-slate-600 mb-2">
                不調がある日は、不調がない日と比べて、どの程度の仕事の質を保てましたか？（0〜10）
              </p>
              <p className="text-xs text-slate-400 mb-3">10：同じ質 / 0：全く保てなかった</p>
              <Scale0to10 value={workQuality} onChange={setWorkQuality} />
            </div>
          ) : null}

          {step === 8 ? (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">
                上記の不調があった日に、欠勤したことがありますか？
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHadAbsenteeismOnSymptomDays(false)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${
                    !hadAbsenteeismOnSymptomDays
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  いいえ
                </button>
                <button
                  type="button"
                  onClick={() => setHadAbsenteeismOnSymptomDays(true)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${
                    hadAbsenteeismOnSymptomDays
                      ? "border-sky-500 bg-sky-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  はい
                </button>
              </div>
            </div>
          ) : null}

          {step === 9 ? (
            <div>
              <p className="text-sm text-slate-600 mb-2 leading-relaxed">
                QQメソッドの年間損失コスト算出に使用します。
                <span className="block text-xs text-slate-400 mt-1">
                  年間損失（万円）＝（有症状日数÷30）×パフォーマンス低下度×月給（万円）×12
                </span>
              </p>
              <label className="block">
                <span className="text-sm font-medium text-slate-600">月給（万円）</span>
                <input
                  type="text"
                  inputMode="numeric"
                  lang="en"
                  spellCheck={false}
                  autoComplete="off"
                  autoCapitalize="off"
                  aria-label="月給（万円）"
                  value={monthlySalaryInput}
                  onCompositionStart={() => {
                    salaryImeComposingRef.current = true;
                  }}
                  onCompositionEnd={(e) => {
                    salaryImeComposingRef.current = false;
                    onSalaryFieldChange(e.currentTarget.value);
                  }}
                  onChange={(e) => {
                    if (salaryImeComposingRef.current) {
                      setMonthlySalaryInput(e.target.value);
                      return;
                    }
                    onSalaryFieldChange(e.target.value);
                  }}
                  onBlur={normalizeSalaryOnBlur}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-sky-500/30 [ime-mode:disabled]"
                />
              </label>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                日本語入力中は変換確定後に数字が反映されます。テンキーや半角の直接入力も利用できます。
              </p>
            </div>
          ) : null}

          {step === 10 ? (
            <div className="space-y-8">
              <LikertRow label="活力（仕事に精力的に取り組めている実感）" value={weVigor} onChange={setWeVigor} />
              <LikertRow
                label="熱意（仕事にやりがいを感じている）"
                value={weDedication}
                onChange={setWeDedication}
              />
              <LikertRow
                label="没頭（仕事に没頭している）"
                value={weAbsorption}
                onChange={setWeAbsorption}
              />
              <p className="text-xs text-slate-400 leading-relaxed">
                各項目は 1（まったくそう思わない）〜 6（非常にそう思う）で評価してください。
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 1}
            onClick={goPrev}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40"
          >
            戻る
          </button>
          <div className="flex gap-3">
            {step < STEPS ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={goNext}
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-semibold px-6 py-3 rounded-xl"
              >
                次へ
              </button>
            ) : (
              <button
                type="button"
                disabled={!canNext}
                onClick={submit}
                className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-semibold px-6 py-3 rounded-xl"
              >
                回答を送信
              </button>
            )}
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          <Link href="/" className="text-sky-600 hover:underline">
            トップへ戻る
          </Link>
        </p>
      </main>
    </AppChrome>
  );
}

function Scale0to10({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 11 }).map((_, n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`min-w-[2.25rem] h-10 px-2 rounded-lg text-sm font-bold border ${
            value === n ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function LikertRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-lg text-sm font-bold border ${
              value === n ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
