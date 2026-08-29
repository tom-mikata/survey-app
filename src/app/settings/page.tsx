"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { AppChrome } from "@/components/AppChrome";
import {
  createClientRecord,
  createSurveyRound,
  deleteClientRecord,
  deleteSurveyRound,
  getDepartments,
  getClients,
  getQqConditions,
  getSurveyRounds,
  setDepartments,
  setQqConditions,
  updateClientRecord,
  updateSurveyRound,
} from "@/lib/storage";
import { getAuthUser } from "@/lib/auth";
import type { AuthUser, UserRole } from "@/lib/auth";
import type { PainAreaCode, QqConditionItem, SurveyRound } from "@/lib/types";
import type { AdminAccount } from "@/app/api/admin/accounts/route";

type Tab = "clients" | "departments" | "questions" | "rounds" | "accounts";

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
  const [editingClientCode, setEditingClientCode] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientError, setEditClientError] = useState("");
  const [deletingClientCode, setDeletingClientCode] = useState<string | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deleteClientError, setDeleteClientError] = useState("");
  const [deletingInProgress, setDeletingInProgress] = useState(false);

  // --- 管理者アカウント ---
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("client_admin");
  const [inviteClientCode, setInviteClientCode] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSaved, setInviteSaved] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editAccountRole, setEditAccountRole] = useState<UserRole>("client_admin");
  const [editAccountClientCode, setEditAccountClientCode] = useState("");
  const [editAccountError, setEditAccountError] = useState("");

  // --- 部署 ---
  const [deptRows, setDeptRows] = useState<string[]>([]);
  const [deptDraft, setDeptDraft] = useState("");
  const [deptSaved, setDeptSaved] = useState(false);

  // --- 設問 (QQ条件) ---
  const [qqRows, setQqRows] = useState<QqConditionItem[]>([]);
  const [qqDraft, setQqDraft] = useState("");
  const [qqSaved, setQqSaved] = useState(false);

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
    const [depts, conditions, roundList] = await Promise.all([
      getDepartments(clientCode || null),
      getQqConditions(clientCode || null),
      getSurveyRounds(clientCode),
    ]);
    setDeptRows(depts);
    setQqRows(conditions);
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

  const startEditingClient = (c: { code: string; name: string }) => {
    setEditingClientCode(c.code);
    setEditClientName(c.name);
    setEditClientError("");
  };

  const cancelEditingClient = () => {
    setEditingClientCode(null);
    setEditClientError("");
  };

  const saveClientEdit = async (code: string) => {
    setEditClientError("");
    const name = editClientName.trim();
    if (!name) { setEditClientError("企業名を入力してください"); return; }
    const { error } = await updateClientRecord(code, name);
    if (error) { setEditClientError(error); return; }
    setEditingClientCode(null);
    loadClients();
  };

  const startDeletingClient = (code: string) => {
    setDeletingClientCode(code);
    setDeleteConfirmInput("");
    setDeleteClientError("");
  };

  const cancelDeletingClient = () => {
    setDeletingClientCode(null);
    setDeleteConfirmInput("");
    setDeleteClientError("");
  };

  const confirmDeleteClient = async () => {
    if (!deletingClientCode || deleteConfirmInput !== deletingClientCode) return;
    setDeletingInProgress(true);
    setDeleteClientError("");
    const { error } = await deleteClientRecord(deletingClientCode);
    setDeletingInProgress(false);
    if (error) { setDeleteClientError(error); return; }
    setDeletingClientCode(null);
    setDeleteConfirmInput("");
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

  // ---- 管理者アカウントの操作 ----
  const loadAccounts = useCallback(async () => {
    setAccountsLoading(true);
    setAccountsError("");
    try {
      const res = await fetch("/api/admin/accounts");
      const body = await res.json();
      if (!res.ok) { setAccountsError(body.error ?? "取得に失敗しました"); return; }
      setAccounts(body.accounts);
    } catch {
      setAccountsError("取得に失敗しました");
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "accounts") loadAccounts();
  }, [tab, loadAccounts]);

  const sendInvite = async () => {
    setInviteError("");
    const email = inviteEmail.trim();
    if (!email) { setInviteError("メールアドレスを入力してください"); return; }
    if (inviteRole === "client_admin" && !inviteClientCode) {
      setInviteError("所属クライアントを選択してください");
      return;
    }
    setInviteSending(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole, clientCode: inviteRole === "client_admin" ? inviteClientCode : null }),
      });
      const body = await res.json();
      if (!res.ok) { setInviteError(body.error ?? "招待の送信に失敗しました"); return; }
      setInviteEmail("");
      setInviteSaved(true);
      setTimeout(() => setInviteSaved(false), 2000);
      loadAccounts();
    } catch {
      setInviteError("招待の送信に失敗しました");
    } finally {
      setInviteSending(false);
    }
  };

  const startEditingAccount = (a: AdminAccount) => {
    setEditingAccountId(a.id);
    setEditAccountRole(a.role ?? "client_admin");
    setEditAccountClientCode(a.clientCode ?? "");
    setEditAccountError("");
  };

  const cancelEditingAccount = () => {
    setEditingAccountId(null);
    setEditAccountError("");
  };

  const saveAccountEdit = async (id: string) => {
    setEditAccountError("");
    if (editAccountRole === "client_admin" && !editAccountClientCode) {
      setEditAccountError("所属クライアントを選択してください");
      return;
    }
    try {
      const res = await fetch(`/api/admin/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editAccountRole,
          clientCode: editAccountRole === "client_admin" ? editAccountClientCode : null,
        }),
      });
      const body = await res.json();
      if (!res.ok) { setEditAccountError(body.error ?? "更新に失敗しました"); return; }
      setEditingAccountId(null);
      loadAccounts();
    } catch {
      setEditAccountError("更新に失敗しました");
    }
  };

  const removeAccount = async (id: string) => {
    const res = await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    if (res.ok) loadAccounts();
  };

  const isAdmin = authUser?.role === "system_admin";
  const tabs: Tab[] = isAdmin
    ? ["clients", "departments", "questions", "rounds", "accounts"]
    : ["departments", "questions"];
  const tabLabel: Record<Tab, string> = { clients: "クライアント", departments: "部署", questions: "健康問題の選択肢", rounds: "実施回", accounts: "管理者アカウント" };

  return (
    <AppChrome title="設定">
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">設定</h1>
        <p className="text-slate-500 text-sm leading-relaxed mb-6">
          アンケートで使用する部署名や設問の選択肢を管理します。
        </p>

        {/* クライアント選択（system_admin のみ・departments/questions/rounds タブ表示中） */}
        {isAdmin && tab !== "clients" && tab !== "accounts" && (
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
                <li key={c.code} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 space-y-2">
                  {editingClientCode === c.code ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400 w-32 shrink-0">{c.code}</span>
                        <input
                          value={editClientName}
                          onChange={(e) => setEditClientName(e.target.value)}
                          className="flex-1 rounded-xl border border-sky-300 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30"
                        />
                      </div>
                      {editClientError && <p className="text-xs text-red-600">{editClientError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveClientEdit(c.code)} className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-1.5 rounded-lg">保存</button>
                        <button type="button" onClick={cancelEditingClient} className="text-xs text-slate-500 hover:text-slate-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-100">キャンセル</button>
                      </div>
                    </div>
                  ) : deletingClientCode === c.code ? (
                    <div className="space-y-2">
                      <p className="text-xs text-red-700 font-semibold">
                        「{c.code}」を削除すると、紐づく回答データ・部署・実施回もすべて削除されます。元に戻せません。
                      </p>
                      <p className="text-xs text-slate-600">確認のため、クライアントコード「{c.code}」を入力してください。</p>
                      <input
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        placeholder={c.code}
                        className="w-full rounded-xl border border-red-300 bg-white px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-red-500/30"
                      />
                      {deleteClientError && <p className="text-xs text-red-600">{deleteClientError}</p>}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={deleteConfirmInput !== c.code || deletingInProgress}
                          onClick={confirmDeleteClient}
                          className="text-xs bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold px-4 py-1.5 rounded-lg"
                        >
                          {deletingInProgress ? "削除中…" : "完全に削除する"}
                        </button>
                        <button type="button" onClick={cancelDeletingClient} className="text-xs text-slate-500 hover:text-slate-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-100">キャンセル</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 w-32 shrink-0">{c.code}</span>
                      <span className="text-sm text-slate-700 font-medium flex-1">{c.name}</span>
                      <button type="button" onClick={() => startEditingClient(c)} className="text-xs text-sky-600 hover:text-sky-700 font-semibold px-2 py-1 rounded-md hover:bg-sky-50">編集</button>
                      <button type="button" onClick={() => startDeletingClient(c.code)} className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-md hover:bg-red-50">削除</button>
                    </div>
                  )}
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

        {/* 管理者アカウントタブ（system_admin のみ） */}
        {tab === "accounts" && isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              管理者アカウント（system_admin・client_admin）を招待・管理します。
            </p>

            {accountsLoading && <p className="text-sm text-slate-400 py-2">読み込み中…</p>}
            {accountsError && <p className="text-sm text-red-600 py-2">{accountsError}</p>}

            <ul className="space-y-2 mb-8">
              {accounts.map((a) => (
                <li key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 space-y-2">
                  {editingAccountId === a.id ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-700 font-medium">{a.email}</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={editAccountRole}
                          onChange={(e) => setEditAccountRole(e.target.value as UserRole)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 bg-white"
                        >
                          <option value="client_admin">client_admin</option>
                          <option value="system_admin">system_admin</option>
                        </select>
                        {editAccountRole === "client_admin" && (
                          <select
                            value={editAccountClientCode}
                            onChange={(e) => setEditAccountClientCode(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 bg-white"
                          >
                            <option value="">クライアントを選択</option>
                            {clients.map((c) => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      {editAccountError && <p className="text-xs text-red-600">{editAccountError}</p>}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveAccountEdit(a.id)} className="text-xs bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-1.5 rounded-lg">保存</button>
                        <button type="button" onClick={cancelEditingAccount} className="text-xs text-slate-500 hover:text-slate-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-100">キャンセル</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium truncate">{a.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {a.role ?? "未設定"}{a.role === "client_admin" && a.clientCode ? `（${a.clientCode}）` : ""}
                        </p>
                      </div>
                      <button type="button" onClick={() => startEditingAccount(a)} className="shrink-0 text-xs text-sky-600 hover:text-sky-700 font-semibold px-2 py-1 rounded-md hover:bg-sky-50">編集</button>
                      <button type="button" onClick={() => removeAccount(a.id)} className="shrink-0 text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded-md hover:bg-red-50">削除</button>
                    </div>
                  )}
                </li>
              ))}
              {!accountsLoading && accounts.length === 0 && (
                <li className="text-sm text-slate-400 py-2">アカウントがまだありません。</li>
              )}
            </ul>

            <p className="text-sm font-semibold text-slate-700 mb-3">招待メールを送信</p>
            <div className="space-y-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="メールアドレス"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 bg-white"
                >
                  <option value="client_admin">client_admin</option>
                  <option value="system_admin">system_admin</option>
                </select>
                {inviteRole === "client_admin" && (
                  <select
                    value={inviteClientCode}
                    onChange={(e) => setInviteClientCode(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 bg-white"
                  >
                    <option value="">クライアントを選択</option>
                    {clients.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={inviteSending}
                  onClick={sendInvite}
                  className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white text-sm font-semibold px-6 py-3 rounded-xl"
                >
                  {inviteSending ? "送信中…" : "招待を送信"}
                </button>
                {inviteSaved && <span className="text-sm text-emerald-600 font-semibold">送信しました</span>}
                {inviteError && <span className="text-sm text-red-600">{inviteError}</span>}
              </div>
            </div>
          </div>
        )}
      </main>
    </AppChrome>
  );
}
