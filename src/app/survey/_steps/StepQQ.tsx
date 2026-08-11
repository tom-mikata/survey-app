"use client";

import { useMemo } from "react";
import type { StepProps } from "../_types";

/** 学生A 担当: 問8〜11（QQメソッド）
 *  表示条件: 問6で「不調はない」以外を選んだ人のみ（page.tsx のスクリーンリストで制御済み）
 *
 * 問8: 問7の症状があった日数（直近30日間、0〜30）    → form.symptomDaysPast30
 * 問9: 問7の症状で仕事を休んだ日数（直近1年間）      → form.absenteeDaysPastYear
 * 問10: 症状がある日の仕事量（0〜10）               → form.workQuantity
 * 問11: 症状がある日の仕事の質（0〜10）             → form.workQuality
 *
 * 入力UIのヒント:
 * - 問8・9 はテキスト入力（数値）+ スライダーの組み合わせ
 * - 問10・11 は 0〜10 の選択ボタン
 * - 問8・9 は日本語IME対策が必要（現行の symptomDaysInput パターンを参照）
 */
export function StepQQ({ form, onChange, onNext, onPrev, isFirst, isLast, onSubmit }: StepProps) {
  const canNext = useMemo(
    () =>
      form.symptomDaysPast30 >= 0 &&
      form.symptomDaysPast30 <= 30 &&
      form.absenteeDaysPastYear >= 0 &&
      form.workQuantity >= 0 &&
      form.workQuantity <= 10 &&
      form.workQuality >= 0 &&
      form.workQuality <= 10,
    [form.symptomDaysPast30, form.absenteeDaysPastYear, form.workQuantity, form.workQuality],
  );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        症状の状況を教えてください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">

        {/* TODO(#20-学生A): 問8 直近30日間の有症状日数（0〜30） */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            問8. 問7の不調があった日数（直近30日間）
          </p>
          <input
            type="number"
            min={0}
            max={30}
            value={form.symptomDaysPast30}
            onChange={(e) => onChange({ symptomDaysPast30: Math.min(30, Math.max(0, Number(e.target.value))) })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-sky-500/30"
          />
          <p className="mt-1 text-xs text-slate-400">※ 0〜30の整数で入力してください</p>
          {/* TODO(#20-学生A): スライダーを追加（現行 StepQQ 旧実装の symptomDaysInput パターンを参照） */}
        </div>

        {/* TODO(#20-学生A): 問9 直近1年間の欠勤日数 */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            問9. 問7の症状で仕事を休んだ日数（直近1年間）
          </p>
          <input
            type="number"
            min={0}
            value={form.absenteeDaysPastYear}
            onChange={(e) => onChange({ absenteeDaysPastYear: Math.max(0, Number(e.target.value)) })}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:ring-2 focus:ring-sky-500/30"
          />
          <p className="mt-1 text-xs text-slate-400">※ 0以上の整数で入力してください</p>
        </div>

        {/* TODO(#20-学生A): 問10 症状がある日の仕事量（0〜10） */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-1">問10. 症状がある日の仕事量（0〜10）</p>
          <p className="text-xs text-slate-400 mb-3">10：不調がない日と同じ量 / 0：全くできなかった</p>
          <Scale0to10 value={form.workQuantity} onChange={(n) => onChange({ workQuantity: n })} />
        </div>

        {/* TODO(#20-学生A): 問11 症状がある日の仕事の質（0〜10） */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-1">問11. 症状がある日の仕事の質（0〜10）</p>
          <p className="text-xs text-slate-400 mb-3">10：不調がない日と同じ質 / 0：全く保てなかった</p>
          <Scale0to10 value={form.workQuality} onChange={(n) => onChange({ workQuality: n })} />
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

function Scale0to10({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 11 }).map((_, n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`min-w-[2.25rem] h-10 px-2 rounded-lg text-sm font-bold border ${
            value === n ? "border-sky-600 bg-sky-600 text-white" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}