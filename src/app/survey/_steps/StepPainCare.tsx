"use client";

import { useMemo } from "react";
import type { StepProps } from "../_types";

/** 学生B 担当: 問12〜14（不調への対処）
 *  全員表示（問6の結果に関わらず）
 *
 * 問12: この1か月で利用した場所（複数選択）          → form.treatmentPlaces[]
 *       選択肢: 病院・クリニック / 整体・マッサージ・接骨院 / 薬局 / その他 / 利用していない
 *       「利用していない」は排他制御
 *       「その他」選択時に自由記述欄表示              → form.treatmentPlacesOther
 * 問13: 月あたり合計利用回数（記入）                 → form.treatmentFrequency
 *       表示条件: 問12で「利用していない」以外を選んだ場合のみ
 * 問14: 日常的に使っているもの（複数選択）            → form.dailyItems[]
 *       選択肢: 湿布 / 飲み薬 / 塗り薬 / コルセット・サポーター / サプリメント / その他 / 使っていない
 *       「使っていない」は排他制御
 *       「その他」選択時に自由記述欄表示              → form.dailyItemsOther
 */

const TREATMENT_PLACES = [
  { id: "hospital", label: "病院・クリニック" },
  { id: "massage", label: "整体・マッサージ・接骨院" },
  { id: "pharmacy", label: "薬局" },
  { id: "other", label: "その他" },
  { id: "none", label: "利用していない" },
];

const DAILY_ITEMS = [
  { id: "patch", label: "湿布" },
  { id: "medicine", label: "飲み薬" },
  { id: "ointment", label: "塗り薬" },
  { id: "support", label: "コルセット・サポーター" },
  { id: "supplement", label: "サプリメント" },
  { id: "other", label: "その他" },
  { id: "none", label: "使っていない" },
];

export function StepPainCare({ form, onChange, onNext, onPrev, isFirst, isLast, onSubmit }: StepProps) {
  const hasUsedTreatment =
    form.treatmentPlaces.length > 0 && !form.treatmentPlaces.includes("none");

  const canNext = useMemo(
    () => form.treatmentPlaces.length > 0 && form.dailyItems.length > 0,
    [form.treatmentPlaces, form.dailyItems],
  );

  const toggleTreatmentPlace = (id: string) => {
    if (id === "none") {
      onChange({ treatmentPlaces: ["none"], treatmentFrequency: null, treatmentPlacesOther: "" });
      return;
    }
    const without = form.treatmentPlaces.filter((p) => p !== "none" && p !== id);
    const next = form.treatmentPlaces.includes(id) ? without : [...without, id];
    onChange({ treatmentPlaces: next });
  };

  const toggleDailyItem = (id: string) => {
    if (id === "none") {
      onChange({ dailyItems: ["none"], dailyItemsOther: "" });
      return;
    }
    const without = form.dailyItems.filter((d) => d !== "none" && d !== id);
    const next = form.dailyItems.includes(id) ? without : [...without, id];
    onChange({ dailyItems: next });
  };

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        不調への対処について教えてください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">

        {/* TODO(#20-学生B): 問12 この1か月で利用した場所 */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            問12. この1か月で、体の不調に対して利用した場所はどこですか？（複数選択可）
          </p>
          <div className="grid grid-cols-1 gap-2">
            {TREATMENT_PLACES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleTreatmentPlace(opt.id)}
                disabled={form.treatmentPlaces.includes("none") && opt.id !== "none"}
                className={`rounded-xl border px-4 py-3 text-sm text-left font-medium transition-colors disabled:opacity-40 ${
                  form.treatmentPlaces.includes(opt.id)
                    ? "border-sky-500 bg-sky-50 text-sky-900"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {form.treatmentPlaces.includes("other") && (
            <input
              type="text"
              value={form.treatmentPlacesOther}
              onChange={(e) => onChange({ treatmentPlacesOther: e.target.value })}
              placeholder="その他の利用場所"
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          )}
        </div>

        {/* TODO(#20-学生B): 問13 月あたり利用回数（問12で利用ありの場合のみ） */}
        {hasUsedTreatment && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">
              問13. 月あたりの合計利用回数はどのくらいですか？
            </p>
            <input
              type="number"
              min={1}
              value={form.treatmentFrequency ?? ""}
              onChange={(e) =>
                onChange({ treatmentFrequency: e.target.value ? Math.max(1, Number(e.target.value)) : null })
              }
              placeholder="例：3"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          </div>
        )}

        {/* TODO(#20-学生B): 問14 日常的に使っているもの */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            問14. 不調に対して日常的に使っているものはありますか？（複数選択可）
          </p>
          <div className="grid grid-cols-1 gap-2">
            {DAILY_ITEMS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleDailyItem(opt.id)}
                disabled={form.dailyItems.includes("none") && opt.id !== "none"}
                className={`rounded-xl border px-4 py-3 text-sm text-left font-medium transition-colors disabled:opacity-40 ${
                  form.dailyItems.includes(opt.id)
                    ? "border-sky-500 bg-sky-50 text-sky-900"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {form.dailyItems.includes("other") && (
            <input
              type="text"
              value={form.dailyItemsOther}
              onChange={(e) => onChange({ dailyItemsOther: e.target.value })}
              placeholder="その他のもの"
              className="mt-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
            />
          )}
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