"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { AppChrome } from "@/components/AppChrome";
import {
  createClientRecord,
  createSurveyRound,
  deleteSurveyRound,
  getDepartments,
  getClients,
  getSurveyRounds,
  setDepartments,
  updateSurveyRound,
} from "@/lib/storage";
import { getAuthUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import type { SurveyRound } from "@/lib/types";

type Tab = "clients" | "departments" | "rounds";

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

  // --- 実施回 ---
  const [rounds, setRounds] = useState<SurveyRound[]>([]);
  const [roundTitle, setRoundTitle] = useState("");
  const [roundStartedAt, setRoundStartedAt] = useState("");
  const [roundEndedAt, setRoundEndedAt] = useState("");
  const [roundSaved, setRoundSaved] = useState(false);
  const [roundError, setRoundError] = useState("");
  const [editingRoundId, setEditingRoundId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStartedAt, setEditStartedAt] = useState("");
  const [editEndedAt, setEditEndedAt] = useState("");
  const [editError, setEditError] = useState("");

  const loadClients = useCallback(async () => {
    const list = await getClients();
    setClients(list);
    return list;
  }, []);

  const load = useCallback(async (user: AuthUser, clientCode: string) => {
    const [depts, roundList] = await Promise.all([
      getDepartments(clientCode || null),
      getSurveyRounds(clientCode),
    ]);
    setDeptRows(depts);
    setRounds(roundList);
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

  // ---- 実施回の操作 ----
  const validateDates = (start: string, end: string): string => {
    if (start && end && end <= start) return "終了日は開始日より後の日付を指定してください";
    return "";
  };

  const addRound = async () => {
    setRoundError("");
    const title = roundTitle.trim();
    if (!title) { setRoundError("タイトルを入力してください"); return; }
    const dateErr = validateDates(roundStartedAt, roundEndedAt);
    if (dateErr) { setRoundError(dateErr); return; }
    const { error } = await createSurveyRound(
      selectedClientCode,
      title,
      roundStartedAt || undefined,
      roundEndedAt || undefined,
    );
    if (error) { setRoundError(error); return; }
    setRoundTitle("");
    setRoundStartedAt("");
    setRoundEndedAt("");
    setRoundSaved(true);
    setTimeout(() => setRoundSaved(false), 2000);
    setRounds(await getSurveyRounds(selectedClientCode));
  };

  const removeRound = async (id: number) => {
    await deleteSurveyRound(id);
    setRounds(await getSurveyRounds(selectedClientCode));
  };

  const startEditing = (r: SurveyRound) => {
    setEditingRoundId(r.id);
    setEditTitle(r.title);
    setEditStartedAt(r.startedAt?.slice(0, 10) ?? "");
    setEditEndedAt(r.endedAt?.slice(0, 10) ?? "");
    setEditError("");
  };

  const cancelEditing = () => {
    setEditingRoundId(null);
    setEditError("");
  };

  const saveRound = async (id: number) => {
    setEditError("");
    const title = editTitle.trim();
    if (!title) { setEditError("タイトルを入力してください"); return; }
    const dateErr = validateDates(editStartedAt, editEndedAt);
    if (dateErr) { setEditError(dateErr); return; }
    const { error } = await updateSurveyRound(id, title, editStartedAt || undefined, editEndedAt || undefined);
    if (error) { setEditError(error); return; }
    setEditingRoundId(null);
    setRounds(await getSurveyRounds(selectedClientCode));
  };

  const surveyUrl = (roundId: number) => {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}/survey?client=${selectedClientCode}&round=${roundId}`;
  };

  const isAdmin = authUser?.role === "system_admin";
  const tabs: Tab[] = isAdmin ? ["clients", "departments", "rounds"] : ["departments"];
  const tabLabel: Record<Tab, string> = { clients: "クライアント", departments: "部署", rounds: "実施回" };

  return (
    <AppChrome title="設定">
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">設定</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          アンケートで使用する部署名を管理します。
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

        {/* 実施回タブ（system_admin のみ） */}
        {tab === "rounds" && isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              アンケートの実施回を登録します。各実施回のURLを回答者に共有してください。
            </p>
            <ul className="space-y-3 mb-8">
              {rounds.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 space-y-2">
                  {editingRoundId === r.id ? (
                    <div className="space-y-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-sky-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 mb-1 block">開始日</label>
                          <input
                            type="date"
                            value={editStartedAt}
                            onChange={(e) => setEditStartedAt(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 mb-1 block">終了日</label>
                          <input
                            type="date"
                            value={editEndedAt}
                            onChange={(e) => setEditEndedAt(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                          />
                        </div>
                      </div>
                      {editError && <p className="text-xs text-red-600">{editError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveRound(r.id)} className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-1.5 rounded-lg">保存</button>
                        <button type="button" onClick={cancelEditing} className="text-xs text-slate-500 hover:text-slate-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-100">キャンセル</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{r.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {r.startedAt ? r.startedAt.slice(0, 10) : "開始日未設定"} 〜 {r.endedAt ? r.endedAt.slice(0, 10) : "終了日未設定"}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button type="button" onClick={() => startEditing(r)} className="text-xs text-sky-600 hover:text-sky-700 font-semibold px-2 py-1 rounded-md hover:bg-sky-50">編集</button>
                          <button type="button" onClick={() => removeRound(r.id)} className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-md hover:bg-red-50">削除</button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          readOnly
                          value={surveyUrl(r.id)}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-600 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(surveyUrl(r.id))}
                          className="shrink-0 text-xs text-sky-600 hover:text-sky-700 font-semibold px-2 py-1.5 rounded-md hover:bg-sky-50"
                        >
                          コピー
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
              {rounds.length === 0 && (
                <li className="text-sm text-slate-400 py-2">実施回がまだありません。下の欄から追加してください。</li>
              )}
            </ul>

            <div className="space-y-2">
              <input
                value={roundTitle}
                onChange={(e) => setRoundTitle(e.target.value)}
                placeholder="実施回名（例：第1回 2026年9月）"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">開始日（任意）</label>
                  <input
                    type="date"
                    value={roundStartedAt}
                    onChange={(e) => setRoundStartedAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">終了日（任意）</label>
                  <input
                    type="date"
                    value={roundEndedAt}
                    onChange={(e) => setRoundEndedAt(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                  />
                </div>
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button type="button" onClick={addRound} className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-6 py-3 rounded-xl">追加する</button>
                {roundSaved && <span className="text-sm text-emerald-600 font-semibold">追加しました</span>}
                {roundError && <span className="text-sm text-red-600">{roundError}</span>}
              </div>
            </div>
          </div>
        )}
      </main>
    </AppChrome>
  );
}
