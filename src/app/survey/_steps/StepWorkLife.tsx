"use client";

import { useMemo } from "react";
import type { StepProps } from "../_types";

/** 学生B 担当: 問27〜28（仕事以外の負担モジュール）
 *  表示条件: 企業設定で module_work_life = true の場合のみ
 *
 * 問27: 仕事以外の役割（育児・介護・家事など）による仕事への影響（5段階）
 *       選択肢: ほとんどない / あまりない / ときどきある / よくある / 非常によくある
 *       → form.roleImpact
 * 問28: 仕事以外の負担についての支援の希望（3択）
 *       表示条件: 問27で「ときどきある」以上（"sometimes" / "often" / "very_often"）を選んだ人のみ
 *       選択肢: 支援があれば利用したい / 内容によっては利用したい / 必要ない
 *       → form.supportDesire
 */

const ROLE_IMPACT_OPTIONS = [
  { id: "rarely", label: "ほとんどない" },
  { id: "little", label: "あまりない" },
  { id: "sometimes", label: "ときどきある" },
  { id: "often", label: "よくある" },
  { id: "very_often", label: "非常によくある" },
];

const SUPPORT_DESIRE_OPTIONS = [
  { id: "want", label: "支援があれば利用したい" },
  { id: "conditional", label: "内容によっては利用したい" },
  { id: "not_needed", label: "必要ない" },
];

const SHOW_SUPPORT_DESIRE_IDS = new Set(["sometimes", "often", "very_often"]);

export function StepWorkLife({ form, onChange, onNext, onPrev, isFirst, isLast, onSubmit }: StepProps) {
  const showSupportDesire = SHOW_SUPPORT_DESIRE_IDS.has(form.roleImpact);

  const canNext = useMemo(
    () =>
      form.roleImpact !== "" &&
      (!showSupportDesire || form.supportDesire !== ""),
    [form.roleImpact, form.supportDesire, showSupportDesire],
  );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        仕事以外の負担について教えてください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">

        {/* 問27: 役割による影響（5段階） */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            問27. 育児・介護・家事など仕事以外の役割が、仕事にどの程度影響していますか？
          </p>
          <div className="grid grid-cols-1 gap-2">
            {ROLE_IMPACT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const newImpact = opt.id;
                  onChange({
                    roleImpact: newImpact,
                    supportDesire: SHOW_SUPPORT_DESIRE_IDS.has(newImpact) ? form.supportDesire : "",
                  });
                }}
                className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors ${
                  form.roleImpact === opt.id
                    ? "border-sky-500 bg-sky-50 text-sky-900"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 問28: 支援の希望（問27でときどきある以上の場合のみ表示） */}
        {showSupportDesire && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              問28. 仕事以外の負担への支援（相談窓口・情報提供など）があれば利用したいですか？
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SUPPORT_DESIRE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ supportDesire: opt.id })}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors ${
                    form.supportDesire === opt.id
                      ? "border-sky-500 bg-sky-50 text-sky-900"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
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