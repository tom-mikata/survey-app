"use client";

import { useEffect, useMemo } from "react";
import { INITIAL_FORM, type StepProps } from "../_types";

/** 学生A 担当: 問6〜7（体の不調）
 *
 * 問6: この1か月の体の不調（複数選択・16選択肢）    → form.symptomConditions[]
 *       「不調はない」を選んだ場合は他の選択肢を選べないようにする（排他制御）
 *       「その他の不調」を選んだ場合は自由記述欄を表示  → form.symptomConditionsOther
 * 問7: 最も仕事に影響している不調（問6の回答から1つ）→ form.primaryCondition
 *       表示条件: 問6で「不調はない」以外を選んだ場合のみ
 *       問6で症状を1つだけ選んだ場合はその症状を自動的に primaryCondition に設定し、
 *       問7自体は表示しない（藤田さん確認済み仕様、2026-08-19）
 *
 * 問6の16選択肢（設問設計書 v1.1）は qqConditions として渡される。
 * DB上の選択肢ID は qq_conditions テーブルで管理（"none" が「不調はない」に相当）。
 *
 * 「不調はない」を選んだ人に問8〜11（qq 画面）を表示しない制御は
 * _types.ts の buildScreenList が担当する。
 */
export function StepSymptoms({
  form,
  onChange,
  onNext,
  onPrev,
  isFirst,
  isLast,
  onSubmit,
  qqConditions,
}: StepProps & { qqConditions: { id: string; label: string }[] }) {
  const hasNoCondition = form.symptomConditions.includes("none");
  // 問2で男性を選んだ場合は「女性特有の不調」を選択肢から除外し、選択済みなら自動解除する
  const visibleConditions = useMemo(
    () => form.gender === "male" ? qqConditions.filter((c) => c.id !== "womens_health") : qqConditions,
    [qqConditions, form.gender],
  );
  useEffect(() => {
    if (form.gender !== "male") return;
    if (!form.symptomConditions.includes("womens_health")) return;
    const next = form.symptomConditions.filter((c) => c !== "womens_health");
    onChange({
      symptomConditions: next,
      primaryCondition: form.primaryCondition === "womens_health" ? "" : form.primaryCondition,
    });
  }, [form.gender]); // eslint-disable-line react-hooks/exhaustive-deps

  // 症状が1つだけの場合はそれを問7の回答として自動選択し、問7自体は表示しない
  const showPrimaryCondition =
    form.symptomConditions.length > 1 && !hasNoCondition;

  const canNext = useMemo(() => {
    if (form.symptomConditions.length === 0) return false;
    if (showPrimaryCondition && form.primaryCondition === "") return false;
    return true;
  }, [form.symptomConditions, form.primaryCondition, showPrimaryCondition]);

  const toggleSymptom = (id: string) => {
    if (id === "none") {
      // 「不調はない」は他の症状と排他。選択中にもう一度押した場合は解除する
      // （解除できないと誤タップから復帰できず、他の選択肢は disabled のままになる）
      onChange({
        symptomConditions: hasNoCondition ? [] : ["none"],
        primaryCondition: "",
        symptomConditionsOther: "",
        // 問8〜11 は表示されないため、回答済みの値が残らないよう初期値に戻す
        symptomDaysPast30: INITIAL_FORM.symptomDaysPast30,
        absenteeDaysPastYear: INITIAL_FORM.absenteeDaysPastYear,
        workQuantity: INITIAL_FORM.workQuantity,
        workQuality: INITIAL_FORM.workQuality,
      });
      return;
    }
    const without = form.symptomConditions.filter((s) => s !== "none" && s !== id);
    const next = form.symptomConditions.includes(id) ? without : [...without, id];
    // 症状の組み合わせが変わると問7の選択肢も変わるため、問7はリセットする。
    // ただし症状が1つだけに絞られた場合は、それを自動的に問7の回答にする
    onChange({
      symptomConditions: next,
      primaryCondition: next.length === 1 ? next[0] : "",
      // 「その他の不調」を外したら自由記述も破棄する
      symptomConditionsOther: next.includes("other") ? form.symptomConditionsOther : "",
    });
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        この1か月の体の不調について
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <p className="inline-block text-sm font-semibold text-slate-900 bg-slate-100 rounded px-2.5 py-0.5 mb-1">問6</p>
        <p className="text-sm text-slate-600 mb-3">この1か月間で、当てはまる症状すべてに答えてください（いくつでも選べます）。</p>

        {/* 問6 複数選択（「不調はない」は他の選択肢と排他。E-2: 他の症状タップで「不調はない」を自動解除） */}
        <div className="grid grid-cols-1 gap-2 max-h-[28rem] overflow-y-auto pr-1">
          {visibleConditions.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleSymptom(c.id)}
              aria-pressed={form.symptomConditions.includes(c.id)}
              className={`rounded-xl border px-4 py-3 text-sm text-left font-medium leading-snug transition-colors ${
                form.symptomConditions.includes(c.id)
                  ? "border-sky-500 bg-sky-50 text-sky-900"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 「その他の不調」選択時の自由記述欄（設問設計書では任意記入） */}
        {form.symptomConditions.includes("other") && (
          <label className="block">
            <span className="text-sm font-medium text-slate-600">
              その他の不調（任意記入）
            </span>
            <input
              type="text"
              value={form.symptomConditionsOther}
              onChange={(e) => onChange({ symptomConditionsOther: e.target.value })}
              placeholder="具体的にご記入ください"
              maxLength={200}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </label>
        )}

        {/* 問7 いちばん仕事に影響している不調（問6で症状ありの場合のみ表示） */}
        {showPrimaryCondition && (
          <div className="border-t border-slate-100 pt-6">
            <p className="inline-block text-sm font-semibold text-slate-700 bg-slate-100 rounded px-2.5 py-0.5 mb-1">問7. いちばん仕事に影響している不調</p>
            <p className="text-sm text-slate-600 mb-3">
              問6で選んだ症状のうち、仕事に1番影響しているものを1つ選んでください。
            </p>
            <div className="grid grid-cols-1 gap-2">
              {visibleConditions
                .filter((c) => form.symptomConditions.includes(c.id))
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={form.primaryCondition === c.id}
                    onClick={() => onChange({ primaryCondition: c.id })}
                    className={`rounded-xl border px-4 py-3 text-sm text-left font-medium leading-snug transition-colors ${
                      form.primaryCondition === c.id
                        ? "border-sky-500 bg-sky-50 text-sky-900"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          disabled={isFirst}
          onClick={onPrev}
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40"
        >
          戻る
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={isLast ? onSubmit : onNext}
          className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-semibold px-6 py-3 rounded-xl"
        >
          {isLast ? "回答を送信" : "次へ"}
        </button>
      </div>
    </div>
  );
}
