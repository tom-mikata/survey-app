"use client";

import { useCallback, useEffect, useState } from "react";
import { AppChrome } from "@/components/AppChrome";
import {
  createClientRecord,
  getDepartments,
  getClients,
  getQqConditions,
  setDepartments,
  setQqConditions,
} from "@/lib/storage";
import { getAuthUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import type { PainAreaCode, QqConditionItem } from "@/lib/types";

type Tab = "clients" | "departments" | "questions";

const PAIN_AREA_LABELS: { code: PainAreaCode; label: string }[] = [
  { code: "face", label: "顔" },
  { code: "head", label: "頭" },
  { code: "neck", label: "首" },
  { code: "shoulder", label: "肩" },
  { code: "lower_back", label: "腰" },
  { code: "arm", label: "腕" },
  { code: "wrist", label: "手首" },
  { code: "hip", label: "股" },
  { code: "knee", label: "膝" },
  { code: "ankle", label: "足首" },
];

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function SettingsPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [tab, setTab] = useState<Tab>("departments");

  // --- クライアント ---
  const [clients, setClients] = useState<{ code: string; name: string }[]>([]);
  const [selectedClientCode, setSelectedClientCode] = useState<string>("");
  const [newClientCode, setNewClientCode] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [clientSaved, setClientSaved] = useState(false);
  const [clientError, setClientError] = useState("");

  // --- 部署 ---
  const [deptRows, setDeptRows] = useState<string[]>([]);
  const [deptDraft, setDeptDraft] = useState("");
  const [deptSaved, setDeptSaved] = useState(false);

  // --- 設問 (QQ条件) ---
  const [qqRows, setQqRows] = useState<QqConditionItem[]>([]);
  const [qqDraft, setQqDraft] = useState("");
  const [qqSaved, setQqSaved] = useState(false);

  const loadClients = useCallback(async () => {
    const list = await getClients();
    setClients(list);
    return list;
  }, []);

  const load = useCallback(async (user: AuthUser, clientCode: string) => {
    const [depts, conditions] = await Promise.all([
      getDepartments(clientCode || null),
      getQqConditions(clientCode || null),
    ]);
    setDeptRows(depts);
    setQqRows(conditions);
  }, []);

  useEffect(() => {
    (async () => {
      const user = await getAuthUser();
      setAuthUser(user);
      if (!user) return;

      if (user.role === "system_admin") {
        const list = await loadClients();
        if (list.length > 0) {
          setSelectedClientCode(list[0].code);
          load(user, list[0].code);
        }
      } else {
        const code = user.clientCode ?? "";
        setSelectedClientCode(code);
        load(user, code);
      }
    })();
  }, [load, loadClients]);

  const handleClientSelect = (code: string) => {
    setSelectedClientCode(code);
    if (authUser) load(authUser, code);
  };

  // ---- クライアントの操作 ----
  const addClient = async () => {
    setClientError("");
    const code = newClientCode.trim();
    const name = newClientName.trim();
    if (!code || !name) return;
    const { error } = await createClientRecord(code, name);
    if (error) {
      setClientError(error);
      return;
    }
    setNewClientCode("");
    setNewClientName("");
    setClientSaved(true);
    setTimeout(() => setClientSaved(false), 2000);
    loadClients();
  };

  // ---- 部署の操作 ----
  const saveDepts = async () => {
    const cleaned = deptRows.map((s) => s.trim()).filter(Boolean);
    await setDepartments(selectedClientCode, cleaned);
    setDeptRows(cleaned);
    setDeptSaved(true);
    setTimeout(() => setDeptSaved(false), 2000);
  };

  const addDept = () => {
    const t = deptDraft.trim();
    if (!t || deptRows.includes(t)) { setDeptDraft(""); return; }
    setDeptRows([...deptRows, t]);
    setDeptDraft("");
  };

  const removeDept = (i: number) => setDeptRows(deptRows.filter((_, idx) => idx !== i));
  const moveDept = (i: number, dir: -1 | 1) => setDeptRows(moveItem(deptRows, i, i + dir));

  // ---- 設問の操作 ----
  const saveQq = async () => {
    const cleaned = qqRows.filter((r) => r.label.trim());
    await setQqConditions(selectedClientCode, cleaned);
    setQqRows(cleaned);
    setQqSaved(true);
    setTimeout(() => setQqSaved(false), 2000);
  };

  const addQq = () => {
    const t = qqDraft.trim();
    if (!t) return;
    const id = `custom_${Date.now()}`;
    setQqRows([...qqRows, { id, label: t, painAreas: [] }]);
    setQqDraft("");
  };

  const removeQq = (i: number) => setQqRows(qqRows.filter((_, idx) => idx !== i));
  const moveQq = (i: number, dir: -1 | 1) => setQqRows(moveItem(qqRows, i, i + dir));

  const updateQqLabel = (i: number, label: string) => {
    setQqRows(qqRows.map((r, idx) => (idx === i ? { ...r, label } : r)));
  };

  const togglePainArea = (i: number, area: PainAreaCode) => {
    setQqRows(qqRows.map((r, idx) => {
      if (idx !== i) return r;
      const has = r.painAreas.includes(area);
      return { ...r, painAreas: has ? r.painAreas.filter((a) => a !== area) : [...r.painAreas, area] };
    }));
  };

  const isAdmin = authUser?.role === "system_admin";
  const tabs: Tab[] = isAdmin ? ["clients", "departments", "questions"] : ["departments", "questions"];
  const tabLabel: Record<Tab, string> = { clients: "クライアント", departments: "部署", questions: "健康問題の選択肢" };

  return (
    <AppChrome title="設定">
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">設定</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          アンケートで使用する部署名や設問の選択肢を管理します。
        </p>

        {/* クライアント選択（system_admin のみ・departments/questions タブ表示中） */}
        {isAdmin && tab !== "clients" && (
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-600 shrink-0">クライアント：</label>
            <select
              value={selectedClientCode}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 bg-white"
            >
              {clients.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* タブ */}
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                tab === t
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tabLabel[t]}
            </button>
          ))}
        </div>

        {/* クライアントタブ（system_admin のみ） */}
        {tab === "clients" && isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              クライアント企業を登録します。コードはURLや内部識別子として使用されます。
            </p>
            <ul className="space-y-2 mb-6">
              {clients.map((c) => (
                <li key={c.code} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5">
                  <span className="text-xs font-mono text-slate-400 w-32 shrink-0">{c.code}</span>
                  <span className="text-sm text-slate-700 font-medium">{c.name}</span>
                </li>
              ))}
              {clients.length === 0 && (
                <li className="text-sm text-slate-400 py-2">クライアントがまだありません。</li>
              )}
            </ul>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                value={newClientCode}
                onChange={(e) => setNewClientCode(e.target.value)}
                placeholder="コード（例：acme）"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 font-mono"
              />
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="企業名（例：ACME株式会社）"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
              <button
                type="button"
                onClick={addClient}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold px-5 py-2.5"
              >
                追加
              </button>
            </div>
            {clientError && <p className="text-sm text-red-600 mt-1">{clientError}</p>}
            {clientSaved && <p className="text-sm text-emerald-600 font-semibold mt-1">追加しました</p>}
          </div>
        )}

        {/* 部署タブ */}
        {tab === "departments" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              選択肢として表示する部署名を登録してください。
            </p>
            <ul className="space-y-2 mb-6">
              {deptRows.map((name, i) => (
                <li
                  key={`${name}-${i}`}
                  className="flex items-center gap-1 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                >
                  <div className="flex flex-col gap-0.5 mr-1">
                    <button type="button" disabled={i === 0} onClick={() => moveDept(i, -1)} className="text-slate-400 hover:text-slate-700 disabled:opacity-20 leading-none px-1" aria-label="上へ">▲</button>
                    <button type="button" disabled={i === deptRows.length - 1} onClick={() => moveDept(i, 1)} className="text-slate-400 hover:text-slate-700 disabled:opacity-20 leading-none px-1" aria-label="下へ">▼</button>
                  </div>
                  <span className="text-sm text-slate-700 font-medium flex-1">{name}</span>
                  <button type="button" onClick={() => removeDept(i)} className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-md hover:bg-red-50">削除</button>
                </li>
              ))}
              {deptRows.length === 0 && <li className="text-sm text-slate-400 py-2">部署がまだありません。下の欄から追加してください。</li>}
            </ul>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={deptDraft}
                onChange={(e) => setDeptDraft(e.target.value)}
                onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === "Enter") { e.preventDefault(); addDept(); } }}
                placeholder="例：営業部"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
              <button type="button" onClick={addDept} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold px-5 py-2.5">追加</button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={saveDepts} className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-6 py-3 rounded-xl">保存する</button>
              {deptSaved && <span className="text-sm text-emerald-600 font-semibold">保存しました</span>}
            </div>
          </div>
        )}

        {/* 設問タブ */}
        {tab === "questions" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              アンケートのステップ4「健康上の問題」に表示する選択肢を管理します。ラベルの編集・並び順の変更・削除が可能です（
              <span className="font-semibold text-slate-600">「健康問題なし」は削除できません</span>
              ）。
            </p>
            <ul className="space-y-3 mb-6 max-h-[36rem] overflow-y-auto pr-1">
              {qqRows.map((item, i) => (
                <li key={item.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 space-y-2">
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col gap-0.5 mr-1 shrink-0">
                      <button type="button" disabled={i === 0} onClick={() => moveQq(i, -1)} className="text-slate-400 hover:text-slate-700 disabled:opacity-20 leading-none px-1" aria-label="上へ">▲</button>
                      <button type="button" disabled={i === qqRows.length - 1} onClick={() => moveQq(i, 1)} className="text-slate-400 hover:text-slate-700 disabled:opacity-20 leading-none px-1" aria-label="下へ">▼</button>
                    </div>
                    <input
                      value={item.label}
                      onChange={(e) => updateQqLabel(i, e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                    />
                    {item.id !== "none" ? (
                      <button type="button" onClick={() => removeQq(i)} className="shrink-0 text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-md hover:bg-red-50">削除</button>
                    ) : (
                      <span className="shrink-0 w-[2.75rem]" />
                    )}
                  </div>
                  {item.id !== "none" && (
                    <div className="flex flex-wrap gap-1.5 pl-8">
                      {PAIN_AREA_LABELS.map(({ code, label }) => {
                        const active = item.painAreas.includes(code);
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => togglePainArea(i, code)}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors ${
                              active ? "bg-sky-600 text-white border-sky-600" : "bg-white text-slate-500 border-slate-200 hover:border-sky-400 hover:text-sky-600"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>
              ))}
              {qqRows.length === 0 && <li className="text-sm text-slate-400 py-2">選択肢がありません。</li>}
            </ul>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={qqDraft}
                onChange={(e) => setQqDraft(e.target.value)}
                onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === "Enter") { e.preventDefault(); addQq(); } }}
                placeholder="例：慢性疲労"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
              <button type="button" onClick={addQq} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold px-5 py-2.5">追加</button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="button" onClick={saveQq} className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-6 py-3 rounded-xl">保存する</button>
              {qqSaved && <span className="text-sm text-emerald-600 font-semibold">保存しました</span>}
            </div>
          </div>
        )}
      </main>
    </AppChrome>
  );
}
