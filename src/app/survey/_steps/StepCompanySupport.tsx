"use client";

import { useMemo } from "react";
import type { StepProps } from "../_types";

/** 学生B 担当: 問23〜26（会社のサポートモジュール）
 *  表示条件: 企業設定で module_company_support = true の場合のみ
 *
 * 問23〜26: 会社の支援の感じ方（4問・7段階）
 *   スコア: 1〜7（まったくそう思わない〜非常にそう思う）
 *   → form.q23Score 〜 form.q26Score
 *
 * ⚠️  問題文は牧氏から入手後に確定。現在はプレースホルダー表示のみ。
 *    問題文が確定したら QUESTIONS 配列を更新すること。
 */

const SUPPORT_SCALE = [1, 2, 3, 4, 5, 6, 7];

// TODO(#20-学生B): 牧氏から問題文を入手したらここを更新する
const QUESTIONS: { key: keyof Pick<import("../_types").FormState, "q23Score"|"q24Score"|"q25Score"|"q26Score">; placeholder: string }[] = [
  { key: "q23Score", placeholder: "問23の問題文（牧氏から入手後に更新）" },
  { key: "q24Score", placeholder: "問24の問題文（牧氏から入手後に更新）" },
  { key: "q25Score", placeholder: "問25の問題文（牧氏から入手後に更新）" },
  { key: "q26Score", placeholder: "問26の問題文（牧氏から入手後に更新）" },
];

export function StepCompanySupport({ form, onChange, onNext, onPrev, isFirst, isLast, onSubmit }: StepProps) {
  const canNext = useMemo(
    () => QUESTIONS.every(({ key }) => form[key] !== null),
    [form],
  );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        会社のサポートについて教えてください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        <p className="text-sm text-slate-500">
          1（まったくそう思わない）〜 7（非常にそう思う）で評価してください。
        </p>

        {QUESTIONS.map(({ key, placeholder }, i) => (
          <div key={key}>
            {/* TODO(#20-学生B): placeholder を実際の問題文に差し替える */}
            <p className="text-sm font-semibold text-slate-700 mb-3">
              問{23 + i}. <span className="text-slate-400 italic">{placeholder}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SUPPORT_SCALE.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onChange({ [key]: n })}
                  className={`w-10 h-10 rounded-lg text-sm font-bold border ${
                    form[key] === n
                      ? "border-sky-600 bg-sky-600 text-white"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-slate-400">まったくそう思わない</span>
              <span className="text-xs text-slate-400">非常にそう思う</span>
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