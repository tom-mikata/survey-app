"use client";

import { useMemo, useState } from "react";
import type { StepProps } from "../_types";

/** 学生A 担当: 問8〜11（QQメソッド）
 *  表示条件: 問6で「不調はない」以外を選んだ人のみ（page.tsx のスクリーンリストで制御済み）
 *
 * 「問7で選んだ〜についてお答えください」の文言は、問6で症状を複数選択し
 * 実際に問7で選択が発生した場合のみ表示する（1つだけ選んだ場合は問7が
 * 自動選択されスキップされるため、藤田さん確認済み仕様、2026-08-19）
 *
 * 問8: 問7の症状があった日数（直近30日間、0〜30）    → form.symptomDaysPast30
 * 問9: 問7の症状で仕事を休んだ日数（直近1年間）      → form.absenteeDaysPastYear
 * 問10: 症状がある日の仕事量（0〜10）               → form.workQuantity
 * 問11: 症状がある日の仕事の質（0〜10）             → form.workQuality
 *
 * 問8・9 は数値入力 + スライダーの組み合わせ。
 * 数値入力は全角数字（日本語IME）を半角に変換し、数字以外を弾く。
 */

/** 問9 の上限。設問設計書に明記はないが「直近1年間」なので365日を上限とする */
const MAX_ABSENTEE_DAYS = 365;

export function StepQQ({ form, onChange, onNext, onPrev, isFirst, isLast, onSubmit }: StepProps) {
  const canNext = useMemo(
    () =>
      form.symptomDaysPast30 >= 0 &&
      form.symptomDaysPast30 <= 30 &&
      form.absenteeDaysPastYear >= 0 &&
      form.absenteeDaysPastYear <= MAX_ABSENTEE_DAYS &&
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
        {/* 問6で複数選択した場合のみ「問7で選んだ」という文脈を表示する。
            1つだけ選んだ場合は問7自体が表示されず自動選択されているため文言を出さない */}
        {form.symptomConditions.length > 1 && (
          <p className="text-sm text-slate-500">
            問7で選んだ「いちばん仕事に影響している不調」についてお答えください。
          </p>
        )}

        {/* 問8 直近30日間の有症状日数（0〜30） */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-1">問8. その症状があった日数</p>
          <p className="text-sm text-slate-600 mb-3">
            直近30日間で、その症状は何日ありましたか。
          </p>
          <DaysField
            value={form.symptomDaysPast30}
            max={30}
            ariaLabel="問8 直近30日間で症状があった日数"
            onCommit={(n) => onChange({ symptomDaysPast30: n })}
          />
          <p className="mt-2 text-xs text-slate-400">※ 0〜30日の範囲で入力してください</p>
        </div>

        {/* 問9 直近1年間の欠勤日数 */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            問9. その症状で仕事を休んだ日数
          </p>
          <p className="text-sm text-slate-600 mb-3">
            直近1年間で、その症状で何日仕事を休みましたか。
          </p>
          <DaysField
            value={form.absenteeDaysPastYear}
            max={MAX_ABSENTEE_DAYS}
            ariaLabel="問9 直近1年間で症状のために休んだ日数"
            onCommit={(n) => onChange({ absenteeDaysPastYear: n })}
          />
          <p className="mt-2 text-xs text-slate-400">
            ※ 休んでいない場合は 0 を入力してください（0〜{MAX_ABSENTEE_DAYS}日）
          </p>
        </div>

        {/* 問10 症状があるときの仕事量（0〜10） */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-1">問10. 症状があるときの仕事量</p>
          <p className="text-sm text-slate-600 mb-3">
            症状がないときを「10」とすると、症状があるときはどのくらいの仕事量ですか
            （0＝全くできない 〜 10＝いつも通り）。
          </p>
          <Scale0to10
            value={form.workQuantity}
            ariaLabel="問10 症状があるときの仕事量"
            onChange={(n) => onChange({ workQuantity: n })}
          />
        </div>

        {/* 問11 症状があるときの仕事の質（0〜10） */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-1">問11. 症状があるときの仕事の質</p>
          <p className="text-sm text-slate-600 mb-3">
            症状がないときを「10」とすると、症状があるときはどのくらいの仕事の質ですか
            （0＝ほとんど保てない 〜 10＝いつも通り）。
          </p>
          <Scale0to10
            value={form.workQuality}
            ariaLabel="問11 症状があるときの仕事の質"
            onChange={(n) => onChange({ workQuality: n })}
          />
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

/** 全角数字を半角に直し、数字以外を除去する（日本語IMEで入力された値の対策） */
function toHalfWidthDigits(raw: string): string {
  return raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, "");
}

/** 日数入力（数値入力 + スライダー）。入力中は空欄を許容し、確定値は 0〜max に収める */
function DaysField({
  value,
  max,
  ariaLabel,
  onCommit,
}: {
  value: number;
  max: number;
  ariaLabel: string;
  onCommit: (n: number) => void;
}) {
  // input の表示は文字列で保持する。数値に直接バインドすると
  // 全角入力や一時的な空欄で値が 0 に飛んでしまうため。
  const [text, setText] = useState(() => String(value));

  const handleText = (raw: string) => {
    const digits = toHalfWidthDigits(raw);
    if (digits === "") {
      setText("");
      onCommit(0);
      return;
    }
    const clamped = Math.min(max, Number(digits));
    setText(String(clamped));
    onCommit(clamped);
  };

  const handleSlider = (n: number) => {
    setText(String(n));
    onCommit(n);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="numeric"
          value={text}
          onChange={(e) => handleText(e.target.value)}
          onBlur={() => { if (text === "") setText("0"); }}
          aria-label={ariaLabel}
          className="w-28 rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold text-right outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
        />
        <span className="text-sm text-slate-500">日</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => handleSlider(Number(e.target.value))}
        aria-label={`${ariaLabel}（スライダー）`}
        className="w-full accent-sky-600"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>0日</span>
        <span>{max}日</span>
      </div>
    </div>
  );
}

function Scale0to10({
  value,
  ariaLabel,
  onChange,
}: {
  value: number;
  ariaLabel: string;
  onChange: (n: number) => void;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {Array.from({ length: 11 }).map((_, n) => (
        <button
          key={n}
          type="button"
          aria-pressed={value === n}
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
