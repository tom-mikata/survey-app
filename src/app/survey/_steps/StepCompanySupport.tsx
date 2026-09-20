"use client";

import { useMemo } from "react";
import type { StepProps } from "../_types";

/** 学生B 担当: 問18（会社のサポートモジュール、18-1〜18-4の4項目、SPOS-J採用）
 *  表示条件: 企業設定で module_company_support = true の場合のみ
 *
 * 問18: 会社の支援の感じ方について（4項目・7段階、0〜6点）
 *   → form.q18_1Score 〜 form.q18_4Score
 *
 * ⚠️ 2026-08-29時点、産業医科大学へのSPOS-J商用利用許可はまだ申請中・未回答。
 *    許可が下りるまでは本番（main）へのリリース不可。許可後は、原文の質問文に加えて
 *    引用表記（クレジット）の表示が必要になる（issue#20参照）。
 */

const SUPPORT_SCALE = [
  { value: 0, label: "まったくそう思わない" },
  { value: 1, label: "そう思わない" },
  { value: 2, label: "あまりそう思わない" },
  { value: 3, label: "どちらともいえない" },
  { value: 4, label: "少しそう思う" },
  { value: 5, label: "そう思う" },
  { value: 6, label: "非常にそう思う" },
];

const QUESTIONS: { key: keyof Pick<import("../_types").FormState, "q18_1Score"|"q18_2Score"|"q18_3Score"|"q18_4Score">; text: string }[] = [
  { key: "q18_1Score", text: "私が所属する組織は、私が自分の能力を最大限に発揮して仕事ができるように積極的に支援をしてくれる。" },
  { key: "q18_2Score", text: "私が所属する組織は、私の意見を大切にしてくれる。" },
  { key: "q18_3Score", text: "私の組織は、私のウェルビーイング（仕事を通じて快適、健康、幸せであると感じている状態）を、本当に大切にしてくれる。" },
  { key: "q18_4Score", text: "私が所属する組織は、私が全般的に仕事に満足しているか、気にかけてくれる。" },
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
          以下には、あなたが所属する組織で働くことについて、あなたが抱いている可能性のある意見が記載されています。各項目に対するあなたの同意または不同意の度合いについて、あなたの見解に最も近い選択肢を選んでください。
        </p>

        {QUESTIONS.map(({ key, text }, i) => (
          <div key={key}>
            <p className="text-sm font-semibold text-slate-700 mb-3">問18-{i + 1}. {text}</p>
            <div className="grid grid-cols-1 gap-2">
              {SUPPORT_SCALE.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ [key]: opt.value })}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors ${
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
