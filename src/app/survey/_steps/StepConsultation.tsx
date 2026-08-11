"use client";

import { useMemo } from "react";
import type { StepProps } from "../_types";

/** 学生B 担当: 問15〜16（相談先・専門家支援）
 *  全員表示
 *
 * 問15: 困ったときの相談先（4分野 × 4択のマトリクス）
 *       4分野: 体調・健康 / 仕事や働き方 / 家庭・生活の負担 / 気持ちや心の落ち込み
 *       4択: 社内にある / 社外にある / 社内・社外の両方にある / ない
 *       → form.consultationHealth / consultationWork / consultationFamily / consultationMental
 * 問16: 専門家の支援を利用したいか（3択）
 *       選択肢: 利用してみたい / 興味はある / 思わない
 *       → form.expertSupportIntent
 */

const CONSULTATION_OPTIONS = [
  { id: "both", label: "社内・社外の両方にある" },
  { id: "internal", label: "社内にある" },
  { id: "external", label: "社外にある" },
  { id: "none", label: "ない" },
];

const CONSULTATION_FIELDS: { key: keyof Pick<import("../_types").FormState, "consultationHealth" | "consultationWork" | "consultationFamily" | "consultationMental">; label: string }[] = [
  { key: "consultationHealth", label: "体調・健康" },
  { key: "consultationWork", label: "仕事や働き方" },
  { key: "consultationFamily", label: "家庭・生活の負担" },
  { key: "consultationMental", label: "気持ちや心の落ち込み" },
];

const EXPERT_SUPPORT_OPTIONS = [
  { id: "want", label: "利用してみたい" },
  { id: "interested", label: "興味はある" },
  { id: "no", label: "思わない" },
];

export function StepConsultation({ form, onChange, onNext, onPrev, isFirst, isLast, onSubmit }: StepProps) {
  const canNext = useMemo(
    () =>
      form.consultationHealth !== "" &&
      form.consultationWork !== "" &&
      form.consultationFamily !== "" &&
      form.consultationMental !== "" &&
      form.expertSupportIntent !== "",
    [form.consultationHealth, form.consultationWork, form.consultationFamily, form.consultationMental, form.expertSupportIntent],
  );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        相談先・支援について教えてください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">

        {/* TODO(#20-学生B): 問15 相談先マトリクス（4分野 × 4択） */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-4">
            問15. 困ったとき、相談できる場所・人がありますか？（分野ごとに1つ選択）
          </p>
          <div className="space-y-6">
            {CONSULTATION_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <p className="text-sm font-medium text-slate-600 mb-2">{label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONSULTATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ [key]: opt.id })}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors ${
                        form[key] === opt.id
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
        </div>

        {/* TODO(#20-学生B): 問16 専門家の支援を利用したいか（3択） */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            問16. 専門家（医師・カウンセラーなど）の支援を利用したいと思いますか？
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {EXPERT_SUPPORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ expertSupportIntent: opt.id })}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold text-left transition-colors ${
                  form.expertSupportIntent === opt.id
                    ? "border-sky-500 bg-sky-50 text-sky-900"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
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