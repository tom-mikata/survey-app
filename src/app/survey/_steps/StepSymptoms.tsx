"use client";

import { useMemo } from "react";
import type { StepProps } from "../_types";

/** 学生A 担当: 問6〜7（体の不調）
 *
 * 問6: この1か月の体の不調（複数選択・16選択肢）    → form.symptomConditions[]
 *       「不調はない」を選んだ場合は他の選択肢を選べないようにする（排他制御）
 *       「その他の不調」を選んだ場合は自由記述欄を表示  → form.symptomConditionsOther
 * 問7: 最も仕事に影響している不調（問6の回答から1つ）→ form.primaryCondition
 *       表示条件: 問6で「不調はない」以外を選んだ場合のみ
 *
 * 問6の16選択肢（設問設計書 v1.1）は qqConditions として渡される。
 * DB上の選択肢ID は qq_conditions テーブルで管理（"none" が「不調はない」に相当）。
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
  const showPrimaryCondition =
    form.symptomConditions.length > 0 && !hasNoCondition;

  const canNext = useMemo(() => {
    if (form.symptomConditions.length === 0) return false;
    if (showPrimaryCondition && form.primaryCondition === "") return false;
    return true;
  }, [form.symptomConditions, form.primaryCondition, showPrimaryCondition]);

  const toggleSymptom = (id: string) => {
    if (id === "none") {
      onChange({ symptomConditions: ["none"], primaryCondition: "", symptomConditionsOther: "" });
      return;
    }
    const without = form.symptomConditions.filter((s) => s !== "none" && s !== id);
    const next = form.symptomConditions.includes(id) ? without : [...without, id];
    onChange({ symptomConditions: next, primaryCondition: "" });
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        問6. この1か月の体の不調を教えてください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <p className="text-sm text-slate-500">当てはまるものをすべて選んでください。</p>

        {/* TODO(#20-学生A): 問6 複数選択UI（排他制御込み） */}
        <div className="grid grid-cols-1 gap-2 max-h-[28rem] overflow-y-auto pr-1">
          {qqConditions.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleSymptom(c.id)}
              disabled={hasNoCondition && c.id !== "none"}
              className={`rounded-xl border px-4 py-3 text-sm text-left font-medium leading-snug transition-colors disabled:opacity-40 ${
                form.symptomConditions.includes(c.id)
                  ? "border-sky-500 bg-sky-50 text-sky-900"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* TODO(#20-学生A): 「その他の不調」選択時の自由記述欄 */}
        {form.symptomConditions.includes("other") && (
          <label className="block">
            <span className="text-sm font-medium text-slate-600">その他の不調（自由記述）</span>
            <input
              type="text"
              value={form.symptomConditionsOther}
              onChange={(e) => onChange({ symptomConditionsOther: e.target.value })}
              placeholder="具体的にご記入ください"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </label>
        )}

        {/* TODO(#20-学生A): 問7 最も影響している不調（問6で症状ありの場合のみ表示） */}
        {showPrimaryCondition && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              問7. そのうち、最も仕事に影響している不調を1つ選んでください
            </p>
            <div className="grid grid-cols-1 gap-2">
              {qqConditions
                .filter((c) => form.symptomConditions.includes(c.id))
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
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