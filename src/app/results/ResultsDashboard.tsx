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
import { QQ_CONDITIONS } from "@/lib/constants";
import type { SecondPartData, SummaryAxis, SurveyResponse, SurveyRound } from "@/lib/types";
import { getDepartments, getClients, getResponses, getSecondPartData, getSurveyRounds } from "@/lib/storage";
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
import { StackedDepartmentChart } from "./components/DepartmentLossChart";
import { SurveyResultsSections } from "./components/SurveyResultsSections";

/* 前回/今回の差分バッジ */
function DeltaBadge({
  base,
  current,
  unit = "pt",
  goodDirection = "decrease",
}: {
  base: number;
  current: number;
  unit?: string;
  goodDirection?: "decrease" | "increase";
}) {
  const diff = current - base;
  if (Math.abs(diff) < 0.05) return <span className="text-sm font-semibold text-slate-400">±0{unit}</span>;
  const isGood = goodDirection === "decrease" ? diff < 0 : diff > 0;
  const symbol = diff > 0 ? "▲" : "▼";
  const abs = Math.abs(diff);
  const formatted = unit === "pt" ? `${Math.round(abs)}` : abs.toFixed(1);
  return (
    <span className={`text-sm font-bold ${isGood ? "text-teal-600" : "text-red-500"}`}>
      {symbol}{formatted}{unit}
    </span>
  );
}

/* 比較モード用メトリクス行（%前回→今回） */
function ComparePercentRow({
  accent,
  title,
  basePct,
  baseCount,
  baseDenom,
  currentPct,
  currentCount,
  currentDenom,
  label,
  goodDirection = "decrease",
}: {
  accent: string;
  title: string;
  basePct: number;
  baseCount: number;
  baseDenom: number;
  currentPct: number;
  currentCount: number;
  currentDenom: number;
  label: string;
  goodDirection?: "decrease" | "increase";
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-block h-6 w-[3px] rounded-sm" style={{ background: accent }} />
        <p className="text-sm font-bold text-slate-700">{title}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-400">{basePct}%</span>
        <span className="text-base text-slate-400">→</span>
        <span className="text-3xl font-bold text-slate-800">{currentPct}%</span>
        <DeltaBadge base={basePct} current={currentPct} unit="pt" goodDirection={goodDirection} />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {baseCount}/{baseDenom}人 → {currentCount}/{currentDenom}人（{label}）
      </p>
    </div>
  );
}

/* =============================================================================
 * ページ本体
 * ========================================================================== */

export default function ResultsDashboard() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [clients, setClients] = useState<{ code: string; name: string }[]>([]);
  const [selectedClientCode, setSelectedClientCode] = useState<string | null>(null);
  const [surveyRounds, setSurveyRounds] = useState<SurveyRound[]>([]);
  const [displayRoundId, setDisplayRoundId] = useState<number | null>(null);
  const [compareRoundId, setCompareRoundId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [rows, setRows] = useState<SurveyResponse[]>([]);
  const [baseRows, setBaseRows] = useState<SurveyResponse[]>([]);
  const [secondPart, setSecondPart] = useState<SecondPartData>({ mental: [], support: [], workLife: [], exercise: [] });
  const [baseSecondPart, setBaseSecondPart] = useState<SecondPartData>({ mental: [], support: [], workLife: [], exercise: [] });
  const [axis, setAxis] = useState<SummaryAxis>("department");
  const [tab, setTab] = useState<string>("all");
  const [middleView, setMiddleView] = useState<"loss" | "health">("loss");

  // レースコンディション防止
  const loadSeq = useRef(0);

  const loadData = useCallback(async (
    clientCode: string | null,
    displayId: number | null,
    compareId: number | null,
  ) => {
    const seq = ++loadSeq.current;

    const [depts, responses, baseResponses, rounds] = await Promise.all([
      clientCode ? getDepartments(clientCode) : Promise.resolve([]),
      getResponses(clientCode, displayId),
      compareId !== null ? getResponses(clientCode, compareId) : Promise.resolve([]),
      clientCode ? getSurveyRounds(clientCode) : Promise.resolve([]),
    ]);

    if (seq !== loadSeq.current) return;

    const [sp, baseSp] = await Promise.all([
      getSecondPartData(responses.map((r) => r.id)),
      compareId !== null ? getSecondPartData(baseResponses.map((r) => r.id)) : Promise.resolve({ mental: [], support: [], workLife: [], exercise: [] }),
    ]);

    if (seq !== loadSeq.current) return;

    setDepartments(depts);
    setRows(responses);
    setBaseRows(baseResponses);
    setSecondPart(sp);
    setBaseSecondPart(baseSp);
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
        setAxis("age");
        loadData(null, null, null);
      } else {
        const code = user.clientCode ?? null;
        setSelectedClientCode(code);
        loadData(code, null, null);
      }
    })();
  }, [loadData]);

  const handleClientFilter = (code: string) => {
    const val = code === "" ? null : code;
    setSelectedClientCode(val);
    setDisplayRoundId(null);
    setCompareRoundId(null);
    if (val === null && axis === "department") setAxis("age");
    setTab("all");
    loadData(val, null, null);
  };

  const handleDisplayRoundFilter = (roundIdStr: string) => {
    const val = roundIdStr === "" ? null : Number(roundIdStr);
    setDisplayRoundId(val);
    setTab("all");
    loadData(selectedClientCode, val, compareRoundId);
  };

  const handleCompareRoundFilter = (roundIdStr: string) => {
    const val = roundIdStr === "" ? null : Number(roundIdStr);
    setCompareRoundId(val);
    setTab("all");
    loadData(selectedClientCode, displayRoundId, val);
  };

  const isComparing = compareRoundId !== null;

  const tabs = useMemo(() => axisTabs(axis, departments), [axis, departments]);
  const activeTab = useMemo(() => {
    const valid = new Set(tabs.map((t) => t.id));
    return valid.has(tab) ? tab : "all";
  }, [tabs, tab]);

  const filtered = useMemo(() => filterResponses(rows, axis, activeTab), [rows, axis, activeTab]);
  const filteredBase = useMemo(() => filterResponses(baseRows, axis, activeTab), [baseRows, axis, activeTab]);

  const occ = useMemo(() => summarizeOccupational(filtered), [filtered]);
  const occBase = useMemo(() => summarizeOccupational(filteredBase), [filteredBase]);


  const lossTotal = useMemo(() => laborLossTotalManYen(filtered), [filtered]);
  const lossTotalBase = useMemo(() => laborLossTotalManYen(filteredBase), [filteredBase]);
  const lossSplit = useMemo(() => laborLossSplitForTotal(filtered), [filtered]);
  const deptLoss = useMemo(() => laborLossByDepartment(filtered, departments), [filtered, departments]);
  const deptLossBase = useMemo(() => laborLossByDepartment(filteredBase, departments), [filteredBase, departments]);
  const prodAbs = useMemo(() => productivityAndAbsentTotalsManYen(filtered), [filtered]);
  const prodAbsBase = useMemo(() => productivityAndAbsentTotalsManYen(filteredBase), [filteredBase]);

  const conditionBars = useMemo(() => {
    const entries = QQ_CONDITIONS
      .filter((c) => c.id !== "none")
      .map((c) => ({
        id: c.id,
        label: c.label,
        count: occ.healthProblems.conditionCounts[c.id] ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...entries.map((e) => e.count));
    return { entries, max };
  }, [occ.healthProblems.conditionCounts]);

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
  const presenteeismPctBase = Math.round(occBase.presenteeism.rate * 100);
  const absenteeismPctBase = Math.round(occBase.absenteeismAmongInterference.rate * 100);
  const productivityLoss = prodAbs.productivity;
  const absentDrivenLoss = prodAbs.absent;
  const segment = segmentLabel(axis, activeTab);

  return (
    <AppChrome title="ダッシュボード">
      <div className="min-h-screen bg-[#eef3f3]">
        <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-10">

          {/* ---------------- フィルター行 ---------------- */}
          {(authUser?.role === "system_admin" && clients.length > 0) || surveyRounds.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
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

              {/* 2つの実施回セレクター */}
              {surveyRounds.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600 shrink-0">比較実施回（前回）：</span>
                    <select
                      value={compareRoundId ?? ""}
                      onChange={(e) => handleCompareRoundFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                    >
                      <option value="">比較なし</option>
                      {surveyRounds.map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-slate-400 text-sm">→</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600 shrink-0">表示実施回（今回）：</span>
                    <select
                      value={displayRoundId ?? ""}
                      onChange={(e) => handleDisplayRoundFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
                    >
                      <option value="">全期間</option>
                      {surveyRounds.map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                </>
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
                  ...(selectedClientCode !== null
                    ? [{ value: "department", label: "部署ごと" }]
                    : []),
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

          {/* ---------------- 上段 2カード ---------------- */}
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {/* Card 1 : 損失額が生じている従業員数 */}
            <Card>
              <CardHeader title="損失額が生じている従業員数" />
              <div className="mt-5 divide-y divide-slate-100">
                {isComparing ? (
                  <>
                    <ComparePercentRow
                      accent={PRODUCTIVITY_COLOR}
                      title="業務に支障がある人"
                      basePct={presenteeismPctBase}
                      baseCount={occBase.presenteeism.count}
                      baseDenom={occBase.total}
                      currentPct={presenteeismPct}
                      currentCount={occ.presenteeism.count}
                      currentDenom={occ.total}
                      label="Presenteeism"
                      goodDirection="decrease"
                    />
                    <div className="pt-6" />
                    <ComparePercentRow
                      accent={ABSENT_COLOR}
                      title="欠勤したことがある人"
                      basePct={absenteeismPctBase}
                      baseCount={occBase.absenteeismAmongInterference.count}
                      baseDenom={occBase.absenteeismAmongInterference.denominator}
                      currentPct={absenteeismPct}
                      currentCount={occ.absenteeismAmongInterference.count}
                      currentDenom={occ.absenteeismAmongInterference.denominator}
                      label="Absenteeism"
                      goodDirection="decrease"
                    />
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
                isComparing ? (
                  <div className="mt-5">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-400">{lossTotalBase.toFixed(1)}</span>
                      <span className="text-lg text-slate-400">万円 →</span>
                      <span className="text-[40px] font-bold leading-none tracking-tight text-slate-800">
                        {lossTotal.toFixed(1)}
                      </span>
                      <span className="text-xl font-bold text-slate-600">万円</span>
                    </div>
                    <div className="mt-1">
                      <DeltaBadge base={lossTotalBase} current={lossTotal} unit="万円" goodDirection="decrease" />
                    </div>
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: PRODUCTIVITY_COLOR }} />
                        <span className="text-xs text-slate-500 flex-1">生産性低下による損失額</span>
                        <span className="text-sm font-bold text-slate-700 tabular-nums">
                          {prodAbsBase.productivity.toFixed(1)}
                          <span className="text-xs font-normal text-slate-500"> → </span>
                          {productivityLoss.toFixed(1)}
                          <span className="ml-0.5 text-xs font-normal text-slate-500">万円</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: ABSENT_COLOR }} />
                        <span className="text-xs text-slate-500 flex-1">欠勤による損失額</span>
                        <span className="text-sm font-bold text-slate-700 tabular-nums">
                          {prodAbsBase.absent.toFixed(1)}
                          <span className="text-xs font-normal text-slate-500"> → </span>
                          {absentDrivenLoss.toFixed(1)}
                          <span className="ml-0.5 text-xs font-normal text-slate-500">万円</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )
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
                baseTotals={isComparing ? deptLossBase : undefined}
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

          {/* ---------------- アンケート設問別結果（問6-22） ---------------- */}
          <SurveyResultsSections
            rows={filtered}
            baseRows={isComparing ? filteredBase : undefined}
            secondPart={secondPart}
            baseSecondPart={isComparing ? baseSecondPart : undefined}
          />

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
