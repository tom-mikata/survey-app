"use client";

import { useMemo } from "react";
import type { StepProps } from "../_types";

/** 学生B 担当: 問29〜30（運動習慣モジュール）
 *  表示条件: 企業設定で module_exercise = true の場合のみ
 *
 * 問29: 運動の習慣があるか（2択）    → form.hasExerciseHabit
 *       選択肢: している / していない
 * 問30: 週あたり運動日数（1〜7）     → form.exerciseDays
 *       表示条件: 問29で「している」を選んだ場合のみ
 */

export function StepExercise({ form, onChange, onNext, onPrev, isFirst, isLast, onSubmit }: StepProps) {
  const showExerciseDays = form.hasExerciseHabit === true;

  const canNext = useMemo(
    () =>
      form.hasExerciseHabit !== null &&
      (!showExerciseDays || (form.exerciseDays !== null && form.exerciseDays >= 1 && form.exerciseDays <= 7)),
    [form.hasExerciseHabit, form.exerciseDays, showExerciseDays],
  );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        運動の習慣について教えてください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">

        {/* 問29: 運動の習慣があるか */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            問29. 健康のために、体を動かすこと（運動・スポーツ・ウォーキングなど）を習慣的に行っていますか。
          </p>
          <div className="flex gap-2">
            {[
              { value: true, label: "している" },
              { value: false, label: "していない" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() =>
                  onChange({
                    hasExerciseHabit: opt.value,
                    exerciseDays: opt.value ? form.exerciseDays : null,
                  })
                }
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  form.hasExerciseHabit === opt.value
                    ? "border-sky-500 bg-sky-50 text-sky-900"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 問30: 週あたり運動日数（問29で「している」の場合のみ） */}
        {showExerciseDays && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              問30. 平均すると、週に何日くらい行っていますか。あてはまりそうな日数に迷う場合は、少ない方をお選びください。
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ exerciseDays: n })}
                  className={`w-10 h-10 rounded-lg text-sm font-bold border ${
                    form.exerciseDays === n
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button type="button" disabled={isFirst} onClick={onPrev} className="text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40">戻る</button>
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