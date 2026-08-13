"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppChrome } from "@/components/AppChrome";
import {
  axisTabs,
  filterResponses,
  laborLossByDepartment,
  laborLossSplitForTotal,
  laborLossTotalManYen,
  productivityAndAbsentTotalsManYen,
  segmentLabel,
  summarizeOccupational,
} from "@/lib/analytics";
import type { QqConditionItem, SummaryAxis, SurveyResponse, SurveyRound } from "@/lib/types";
import { getDepartments, getClients, getQqConditions, getResponses, getSurveyRounds } from "@/lib/storage";
import { getAuthUser } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import {
  LOSS_LEGEND,
  PRODUCTIVITY_COLOR,
  ABSENT_COLOR,
} from "./components/designTokens";
import { Card, AccentTitle, CardHeader, SelectBox } from "./components/common";
import { MetricRow } from "./components/MetricCard";
import { LegendAmountRow, HorizontalBars } from "./components/DepartmentBarsCard";
import { PainFigure } from "./components/PainFigureCard";
import { StackedDepartmentChart } from "./components/DepartmentLossChart";

/* =============================================================================
 * ページ本体
 * ========================================================================== */

export default function ResultsDashboard() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [clients, setClients] = useState<{ code: string; name: string }[]>([]);
  const [selectedClientCode, setSelectedClientCode] = useState<string | null>(null);
  const [surveyRounds, setSurveyRounds] = useState<SurveyRound[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [rows, setRows] = useState<SurveyResponse[]>([]);
  const [qqConditions, setQqConditions] = useState<QqConditionItem[]>([]);
  const [axis, setAxis] = useState<SummaryAxis>("department");
  const [tab, setTab] = useState<string>("all");
  const [middleView, setMiddleView] = useState<"loss" | "health">("loss");

  // レースコンディション防止: 最新のloadData呼び出しだけが state を更新する
  const loadSeq = useRef(0);

  const loadData = useCallback(async (clientCode: string | null, roundId: number | null) => {
    const seq = ++loadSeq.current;

    const [depts, responses, conditions, rounds] = await Promise.all([
      getDepartments(clientCode),
      getResponses(clientCode, roundId),
      getQqConditions(clientCode),
      clientCode ? getSurveyRounds(clientCode) : Promise.resolve([]),
    ]);

    if (seq !== loadSeq.current) return; // 古い呼び出し結果は破棄

    setDepartments(depts);
    setRows(responses);
    setQqConditions(conditions);
    setSurveyRounds(rounds);
  }, []);

  useEffect(() => {
    (async () => {
      const user = await getAuthUser();
      setAuthUser(user);
      if (!user) return;

      if (user.role === "system_admin") {
        const list = await getClients();
        setClients(list);
        loadData(null, null);
      } else {
        const code = user.clientCode ?? null;
        setSelectedClientCode(code);
        loadData(code, null);
      }
    })();
  }, [loadData]);

  const handleClientFilter = (code: string) => {
    const val = code === "" ? null : code;
    setSelectedClientCode(val);
    setSelectedRoundId(null);
    setAxis("department");
    setTab("all");
    loadData(val, null);
  };

  const handleRoundFilter = (roundIdStr: string) => {
    const val = roundIdStr === "" ? null : Number(roundIdStr);
    setSelectedRoundId(val);
    setTab("all");
    loadData(selectedClientCode, val);
  };

  const tabs = useMemo(() => axisTabs(axis, departments), [axis, departments]);
  const activeTab = useMemo(() => {
    const valid = new Set(tabs.map((t) => t.id));
    return valid.has(tab) ? tab : "all";
  }, [tabs, tab]);

  const filtered = useMemo(() => filterResponses(rows, axis, activeTab), [rows, axis, activeTab]);
  const conditionPainMap = useMemo(
    () => Object.fromEntries(qqConditions.map((c) => [c.id, c.painAreas])),
    [qqConditions],
  );
  const occ = useMemo(() => summarizeOccupational(filtered, conditionPainMap), [filtered, conditionPainMap]);
  const lossTotal = useMemo(() => laborLossTotalManYen(filtered), [filtered]);
  const lossSplit = useMemo(() => laborLossSplitForTotal(filtered), [filtered]);
  const deptLoss = useMemo(() => laborLossByDepartment(filtered, departments), [filtered, departments]);
  const prodAbs = useMemo(() => productivityAndAbsentTotalsManYen(filtered), [filtered]);

  const conditionBars = useMemo(() => {
    const entries = qqConditions
      .filter((c) => c.id !== "none")
      .map((c) => ({
        id: c.id,
        label: c.label,
        count: occ.healthProblems.conditionCounts[c.id] ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...entries.map((e) => e.count));
    return { entries, max };
  }, [qqConditions, occ.healthProblems.conditionCounts]);

  const painHotspots = useMemo(() => {
    const entries = Object.entries(occ.painCounts) as [string, number][];
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([k, v]) => ({ id: k, intensity: v / max, count: v }));
  }, [occ.painCounts]);

  const lossByCategory = useMemo(() => {
    const entries = LOSS_LEGEND.map((L) => ({
      key: L.key,
      label: L.label,
      value: lossSplit.agg[L.key],
    })).sort((a, b) => b.value - a.value);
    const max = Math.max(1, ...entries.map((e) => e.value));
    return { entries, max };
  }, [lossSplit]);

  const presenteeismPct = Math.round(occ.presenteeism.rate * 100);
  const absenteeismPct = Math.round(occ.absenteeismAmongInterference.rate * 100);
  const productivityLoss = prodAbs.productivity;
  const absentDrivenLoss = prodAbs.absent;
  const segment = segmentLabel(axis, activeTab);

  return (
    <AppChrome title="ダッシュボード">
      <div className="min-h-screen bg-[#eef3f3]">
        <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-10">

          {/* ---------------- フィルター行（クライアント・実施回） ---------------- */}
          {(authUser?.role === "system_admin" && clients.length > 0) || surveyRounds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-4">
              {/* クライアントフィルター（system_admin のみ） */}
              {authUser?.role === "system_admin" && clients.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600 shrink-0">クライアント：</span>
                  <select
                    value={selectedClientCode ?? ""}
                    onChange={(e) => handleClientFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                  >
                    <option value="">全クライアント</option>
                    {clients.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 実施回フィルター */}
              {surveyRounds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-600 shrink-0">実施回：</span>
                  <select
                    value={selectedRoundId ?? ""}
                    onChange={(e) => handleRoundFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                  >
                    <option value="">全期間</option>
                    {surveyRounds.map((r) => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ) : null}

          {/* ---------------- 軸・セグメントフィルター行 ---------------- */}
          <section className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="flex shrink-0 items-center gap-3">
              <AccentTitle>職業病サマリー</AccentTitle>
              <SelectBox
                value={axis}
                onChange={(v) => {
                  setAxis(v as SummaryAxis);
                  setTab("all");
                }}
                options={[
                  { value: "department", label: "部署ごと" },
                  { value: "age", label: "年代ごと" },
                  { value: "gender", label: "性別ごと" },
                ]}
              />
            </div>

            <div className="-mx-1 flex gap-1 overflow-x-auto px-1 xl:ml-auto">
              {tabs.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={
                      "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition " +
                      (active
                        ? "bg-white text-teal-700 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ring-1 ring-teal-500/30"
                        : "text-slate-500 hover:bg-white/60 hover:text-slate-700")
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ---------------- 上段 3 カード ---------------- */}
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {/* Card 1 : 損失額が生じている従業員数 */}
            <Card>
              <CardHeader title="損失額が生じている従業員数" />
              <div className="mt-5 divide-y divide-slate-100">
                <MetricRow
                  accent={PRODUCTIVITY_COLOR}
                  ringTrack="#f5ecd8"
                  title="業務に支障がある人"
                  count={occ.presenteeism.count}
                  denom={occ.total}
                  percent={presenteeismPct}
                  percentLabel="Presenteeism"
                  description={`${segment}では、身体的な痛みにより業務に支障がある人が${occ.presenteeism.count}人います。これは${segment}の従業員の${presenteeismPct}%に相当します。`}
                />
                <div className="pt-6" />
                <MetricRow
                  accent={ABSENT_COLOR}
                  ringTrack="#f1dede"
                  title="欠勤したことがある人"
                  count={occ.absenteeismAmongInterference.count}
                  denom={occ.absenteeismAmongInterference.denominator}
                  percent={absenteeismPct}
                  percentLabel="Absenteeism"
                  description={`${segment}では、身体的な痛みにより欠勤したことがある人が${occ.absenteeismAmongInterference.count}人います。これは業務に支障がある人の${absenteeismPct}%に相当します。`}
                />
              </div>
            </Card>

            {/* Card 2 : 損失額 / 健康問題 トグル */}
            <Card>
              <div className="flex items-start justify-between gap-3">
                <CardHeader
                  title={middleView === "loss" ? "職業病起因の労働損失額" : "健康問題を抱える従業員数"}
                />
                <SelectBox
                  size="sm"
                  value={middleView}
                  onChange={(v) => setMiddleView(v as "loss" | "health")}
                  options={[
                    { value: "loss", label: "損失額" },
                    { value: "health", label: "健康問題" },
                  ]}
                />
              </div>

              {middleView === "loss" ? (
                <>
                  <p className="mt-5 text-[40px] font-bold leading-none tracking-tight text-slate-800">
                    {lossTotal.toFixed(1)}
                    <span className="ml-1 text-xl font-bold text-slate-600">万円</span>
                  </p>
                  <div className="mt-5 space-y-2.5">
                    <LegendAmountRow
                      color={PRODUCTIVITY_COLOR}
                      amount={productivityLoss}
                      label="生産性低下による労働損失額"
                    />
                    <LegendAmountRow
                      color={ABSENT_COLOR}
                      amount={absentDrivenLoss}
                      label="欠勤による労働損失額"
                    />
                  </div>
                  <div className="mt-6 pt-5">
                    <HorizontalBars
                      entries={lossByCategory.entries.map((e) => ({
                        id: e.key,
                        label: e.label,
                        value: e.value,
                      }))}
                      max={lossByCategory.max}
                      color={PRODUCTIVITY_COLOR}
                      accent={ABSENT_COLOR}
                      accentRatio={lossTotal > 0 ? absentDrivenLoss / lossTotal : 0}
                      unit="万"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-5 text-[40px] font-bold leading-none tracking-tight text-slate-800">
                    {occ.healthProblems.count}
                    <span className="ml-1 text-xl font-bold text-slate-600">人</span>
                    <span className="ml-2 text-lg font-semibold text-slate-400">
                      / {occ.total}人
                    </span>
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                    <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#f5c56a" }} />
                    <span className="text-base font-bold text-slate-800">
                      {(occ.healthProblems.rate * 100).toFixed(1)}%
                    </span>
                    <span>の従業員に健康に関する問題・不調あり</span>
                  </div>
                  <div className="mt-6 pt-5">
                    <HorizontalBars
                      entries={conditionBars.entries.map((e) => ({
                        id: e.id,
                        label: e.label,
                        value: e.count,
                      }))}
                      max={conditionBars.max}
                      color="#f5c56a"
                      unit="人"
                    />
                  </div>
                </>
              )}
            </Card>

            {/* Card 3 : 痛みの部位 */}
            <Card>
              <CardHeader title="痛みの部位" />
              <PainFigure hotspots={painHotspots} />
            </Card>
          </section>

          {/* ---------------- 部署ごとの労働損失額 ---------------- */}
          <Card>
            <CardHeader title="部署ごとの労働損失額" />
            <p className="mt-2 text-xs text-slate-500">
              現在の表示：
              <span className="mx-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                {segment}
              </span>
              に基づく集計です。
            </p>
            <div className="mt-6 space-y-5">
              <StackedDepartmentChart
                rows={deptLoss.slice().sort((a, b) => b.totalManYen - a.totalManYen)}
              />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
                {LOSS_LEGEND.map((L) => (
                  <span key={L.key} className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ background: L.color }}
                    />
                    {L.label}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <p className="mx-auto max-w-2xl pb-6 text-center text-[11px] leading-relaxed text-slate-400">
            労働損失額は QQメソッドの定義に基づき、プレゼンティーイズム損失（有症状日数 × 12 × パフォーマンス低下度（1 − 量/10 × 質/10）× ¥10,000/日）と欠勤損失（欠勤日数 × ¥10,000/日）の合計により算出しています（
            <a
              href="https://wellaboswp.com/column/qq-method-presenteeism-guide/"
              className="text-teal-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              解説
            </a>
            ）。
          </p>
        </main>
      </div>
    </AppChrome>
  );
}