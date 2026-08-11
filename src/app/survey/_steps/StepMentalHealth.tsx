"use client";

import { useMemo } from "react";
import type { StepProps } from "../_types";

/** 学生B 担当: 問17〜22（心の健康モジュール）
 *  表示条件: 企業設定で module_mental_health = true の場合のみ
 *
 * 問17〜22: 心の状態について（6問・5段階）
 *   スコア: 0〜4（まったくない / 少しだけ / ときどき / たいてい / いつも）
 *   → form.q17Score 〜 form.q22Score
 *
 * ⚠️  問題文は牧氏から入手後に確定。現在は「問17〜22」のプレースホルダー表示のみ。
 *    問題文が確定したら QUESTION_TEXT 配列を更新すること。
 *
 * 集計ロジック（analytics.ts にて実装）:
 *   合計スコア = q17〜q22 の合計（0〜24点）
 *   5点以上の割合・13点以上の割合を集計（個人フィードバックなし）
 */

const MENTAL_SCALE = [
  { value: 0, label: "まったくない" },
  { value: 1, label: "少しだけ" },
  { value: 2, label: "ときどき" },
  { value: 3, label: "たいてい" },
  { value: 4, label: "いつも" },
];

// TODO(#20-学生B): 牧氏から問題文を入手したらここを更新する
const QUESTIONS: { key: keyof Pick<import("../_types").FormState, "q17Score"|"q18Score"|"q19Score"|"q20Score"|"q21Score"|"q22Score">; placeholder: string }[] = [
  { key: "q17Score", placeholder: "問17の問題文（牧氏から入手後に更新）" },
  { key: "q18Score", placeholder: "問18の問題文（牧氏から入手後に更新）" },
  { key: "q19Score", placeholder: "問19の問題文（牧氏から入手後に更新）" },
  { key: "q20Score", placeholder: "問20の問題文（牧氏から入手後に更新）" },
  { key: "q21Score", placeholder: "問21の問題文（牧氏から入手後に更新）" },
  { key: "q22Score", placeholder: "問22の問題文（牧氏から入手後に更新）" },
];

export function StepMentalHealth({ form, onChange, onNext, onPrev, isFirst, isLast, onSubmit }: StepProps) {
  const canNext = useMemo(
    () => QUESTIONS.every(({ key }) => form[key] !== null),
    [form],
  );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        心の健康について教えてください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        <p className="text-sm text-slate-500">
          最近2週間のあなたの状態についてお答えください。
        </p>

        {QUESTIONS.map(({ key, placeholder }, i) => (
          <div key={key}>
            {/* TODO(#20-学生B): placeholder を実際の問題文に差し替える */}
            <p className="text-sm font-semibold text-slate-700 mb-3">
              問{17 + i}. <span className="text-slate-400 italic">{placeholder}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {MENTAL_SCALE.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ [key]: opt.value })}
                  className={`rounded-xl border px-3 py-3 text-xs font-semibold text-center transition-colors ${
                    form[key] === opt.value
                      ? "border-sky-500 bg-sky-50 text-sky-900"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button type="button" disabled={isFirst} onClick={onPrev} className="text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-40">戻る</button>
        <button type="button" disabled={!canNext} onClick={isLast ? onSubmit : onNext} className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-semibold px-6 py-3 rounded-xl">
          {isLast ? "回答を送信" : "次へ"}
        </button>
      </div>
    </div>
  );
}