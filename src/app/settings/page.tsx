"use client";

import { useCallback, useEffect, useState } from "react";
import { AppChrome } from "@/components/AppChrome";
import { getDepartments, setDepartments } from "@/lib/storage";

export default function SettingsPage() {
  const [rows, setRows] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const load = useCallback(() => {
    setRows(getDepartments());
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const save = () => {
    const cleaned = rows.map((s) => s.trim()).filter(Boolean);
    setDepartments(cleaned);
    setRows(cleaned);
  };

  const addRow = () => {
    const t = draft.trim();
    if (!t) return;
    if (rows.includes(t)) {
      setDraft("");
      return;
    }
    setRows([...rows, t]);
    setDraft("");
  };

  const removeAt = (i: number) => {
    setRows(rows.filter((_, idx) => idx !== i));
  };

  return (
    <AppChrome title="部署の登録">
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">部署の事前登録</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          アンケート実施前に、選択肢として表示する部署名を登録してください。分析結果の「社内全体」横のタブにも同じ部署が並びます。
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <ul className="space-y-2 mb-6">
            {rows.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <span className="text-sm text-slate-700 font-medium flex-1">{name}</span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-md hover:bg-red-50"
                >
                  削除
                </button>
              </li>
            ))}
            {rows.length === 0 ? (
              <li className="text-sm text-slate-400 py-2">部署がまだありません。下の欄から追加してください。</li>
            ) : null}
          </ul>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRow())}
              placeholder="例：営業部"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
            />
            <button
              type="button"
              onClick={addRow}
              className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold px-5 py-2.5"
            >
              追加
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-6 py-3 rounded-xl"
            >
              保存する
            </button>
            <p className="text-xs text-slate-400 self-center">保存後、アンケート画面に反映されます。</p>
          </div>
        </div>
      </main>
    </AppChrome>
  );
}
