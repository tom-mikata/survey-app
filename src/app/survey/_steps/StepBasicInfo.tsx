"use client";

import { useEffect, useMemo, useState } from "react";
import { GENDERS } from "@/lib/constants";
import type { StepProps } from "../_types";

/** 学生A 担当: 問1〜5（基本属性）
 *
 * 問1: お名前（テキスト入力）                 → form.fullName
 * 問2: 性別（男/女/その他 の3択）              → form.gender
 * 問3: 生年月日（日付入力）                   → form.dateOfBirth
 * 問4: 部署（セレクトボックス）               → form.department
 * 問5: 雇用形態（4択）                       → form.employmentType
 *       選択肢: 正社員 / パート・アルバイト / 派遣・契約・委託 / その他
 *
 * 設問設計書 v1.1 では問1〜5 すべて必須。
 * 氏名・性別・生年月日は再調査時に同じ人の変化を追うために収集する（設計書 p.2）。
 */

/** 問5 雇用形態の選択肢（設問設計書 v1.1） */
const EMPLOYMENT_TYPES = [
  { id: "full_time", label: "正社員" },
  { id: "part_time", label: "パート・アルバイト" },
  { id: "contract", label: "派遣・契約・委託" },
  { id: "other", label: "その他" },
];

/** 部署の読み込みがこの時間を過ぎても空なら、読み込み失敗として案内を出す */
const DEPARTMENTS_LOAD_TIMEOUT_MS = 5000;

/** 生年月日として受け付けられない値の場合にエラー文を返す */
function validateDateOfBirth(value: string): string | null {
  if (value === "") return null;
  const dob = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return "日付の形式が正しくありません。";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dob > today) return "未来の日付は選べません。";
  if (dob.getFullYear() < 1900) return "1900年以降の日付を選んでください。";
  return null;
}

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
  const dateOfBirthError = useMemo(
    () => validateDateOfBirth(form.dateOfBirth),
    [form.dateOfBirth],
  );

  // getDepartments() は接続エラー時も空配列を返すため、読み込み中と失敗を区別できない。
  // 一定時間たっても空のままなら、読み込み中ではなく失敗として扱う。
  const [departmentsTimedOut, setDepartmentsTimedOut] = useState(false);
  useEffect(() => {
    if (departments.length > 0) return;
    const timer = setTimeout(() => setDepartmentsTimedOut(true), DEPARTMENTS_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [departments.length]);

  const canNext = useMemo(
    () =>
      form.fullName.trim().length > 0 &&
      form.fullNameKana.trim().length > 0 &&
      form.gender !== "" &&
      form.dateOfBirth !== "" &&
      dateOfBirthError === null &&
      form.department !== "" &&
      form.employmentType !== "",
    [
      form.fullName,
      form.fullNameKana,
      form.gender,
      form.dateOfBirth,
      dateOfBirthError,
      form.department,
      form.employmentType,
    ],
  );

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-6">
        基本情報を入力してください
      </h1>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">

        {/* 問1 お名前 */}
        <label className="block">
          <span className="text-sm font-medium text-slate-600">
            問1. お名前 <RequiredBadge />
          </span>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="例：山田 太郎"
            maxLength={100}
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
          />
        </label>

        {/* 問1 フリガナ（字種の制限なし） */}
        <label className="block">
          <span className="text-sm font-medium text-slate-600">
            フリガナ <RequiredBadge />
          </span>
          <input
            type="text"
            value={form.fullNameKana}
            onChange={(e) => onChange({ fullNameKana: e.target.value })}
            placeholder="例：ヤマダ タロウ"
            maxLength={100}
            autoComplete="name"
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
          />
        </label>

        {/* 問2 性別（設問設計書は 男/女/その他 の3択。「回答しない」は使わない） */}
        <div>
          <span className="text-sm font-medium text-slate-600">
            問2. 性別 <RequiredBadge />
          </span>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={form.gender === g.id}
                onClick={() => onChange({ gender: g.id })}
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

        {/* 問3 生年月日 */}
        <label className="block">
          <span className="text-sm font-medium text-slate-600">
            問3. 生年月日 <RequiredBadge />
          </span>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            aria-invalid={dateOfBirthError !== null}
            autoComplete="bday"
            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 ${
              dateOfBirthError
                ? "border-rose-400 focus:border-rose-400"
                : "border-slate-200 focus:border-sky-400"
            }`}
          />
          {dateOfBirthError && (
            <span className="mt-1 block text-xs font-medium text-rose-600">
              {dateOfBirthError}
            </span>
          )}
        </label>

        {/* 問4 部署 */}
        <label className="block">
          <span className="text-sm font-medium text-slate-600">
            問4. 部署 <RequiredBadge />
          </span>
          <select
            value={form.department}
            onChange={(e) => onChange({ department: e.target.value })}
            disabled={departments.length === 0}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-white disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">選択してください</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {departments.length === 0 && (
            departmentsTimedOut ? (
              <span className="mt-1 block text-xs font-medium text-rose-600">
                部署を読み込めませんでした。URLの client パラメータ、または .env.local の
                Supabase 接続情報を確認してください。
              </span>
            ) : (
              <span className="mt-1 block text-xs text-slate-400">
                部署を読み込んでいます…
              </span>
            )
          )}
        </label>

        {/* 問5 雇用形態 */}
        <div>
          <span className="text-sm font-medium text-slate-600">
            問5. 雇用形態 <RequiredBadge />
          </span>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EMPLOYMENT_TYPES.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={form.employmentType === opt.id}
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

function RequiredBadge() {
  return (
    <span className="ml-1 align-middle text-[10px] font-bold text-rose-600 bg-rose-50 rounded px-1.5 py-0.5">
      必須
    </span>
  );
}
