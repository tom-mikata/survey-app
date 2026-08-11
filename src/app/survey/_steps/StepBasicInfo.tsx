"use client";

import { useMemo } from "react";
import { GENDERS } from "@/lib/constants";
import type { Gender } from "@/lib/types";
import type { StepProps } from "../_types";

/** 学生A 担当: 問1〜5（基本属性）
 *
 * 問1: お名前（テキスト入力）                 → form.fullName
 * 問2: 性別（男/女/その他 の3択）              → form.gender
 * 問3: 生年月日（日付入力）                   → form.dateOfBirth
 * 問4: 部署（セレクトボックス）               → form.department
 * 問5: 雇用形態（4択）                       → form.employmentType
 *       選択肢: 正社員 / パート・アルバイト / 派遣・契約・委託 / その他
 */
export function StepBasicInfo({
  form,
  onChange,
  onNext,
  onPrev,
  isFirst,
  isLast,
  onSubmit,
  departments,
}: StepProps & { departments: string[] }) {
  const canNext = useMemo(
    () =>
      form.fullName.trim().length > 0 &&
      form.gender !== "" &&
      form.dateOfBirth !== "" &&
      form.department !== "" &&
      form.employmentType !== "",
    [form.fullName, form.gender, form.dateOfBirth, form.department, form.employmentType],
  );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        基本情報を入力してください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">

        {/* TODO(#20-学生A): 問1 お名前 */}
        <label className="block">
          <span className="text-sm font-medium text-slate-600">問1. お名前</span>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="例：山田 太郎"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
          />
        </label>

        {/* TODO(#20-学生A): 問2 性別（設問設計書は 男/女/その他 の3択） */}
        <div>
          <span className="text-sm font-medium text-slate-600">問2. 性別</span>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {GENDERS.filter((g) => g.id !== "prefer_not").map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onChange({ gender: g.id as Gender })}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold text-left transition-colors ${
                  form.gender === g.id
                    ? "border-sky-500 bg-sky-50 text-sky-900"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* TODO(#20-学生A): 問3 生年月日 */}
        <label className="block">
          <span className="text-sm font-medium text-slate-600">問3. 生年月日</span>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
          />
        </label>

        {/* TODO(#20-学生A): 問4 部署 */}
        <label className="block">
          <span className="text-sm font-medium text-slate-600">問4. 部署</span>
          <select
            value={form.department}
            onChange={(e) => onChange({ department: e.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-white"
          >
            <option value="">選択してください</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        {/* TODO(#20-学生A): 問5 雇用形態 */}
        <div>
          <span className="text-sm font-medium text-slate-600">問5. 雇用形態</span>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { id: "full_time", label: "正社員" },
              { id: "part_time", label: "パート・アルバイト" },
              { id: "contract", label: "派遣・契約・委託" },
              { id: "other", label: "その他" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange({ employmentType: opt.id })}
                className={`rounded-xl border px-4 py-3 text-sm font-semibold text-left transition-colors ${
                  form.employmentType === opt.id
                    ? "border-sky-500 bg-sky-50 text-sky-900"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
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