"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppChrome } from "@/components/AppChrome";
import { QQ_CONDITIONS } from "@/lib/constants";
import {
  axisTabs,
  filterResponses,
  laborLossByDepartment,
  laborLossSplitForTotal,
  laborLossTotalManYen,
  productivityAndAbsentTotalsManYen,
  segmentLabel,
  summarizeOccupational,
  workEngagementByDepartment,
  workEngagementSummary,
} from "@/lib/analytics";
import type { SummaryAxis } from "@/lib/types";
import { ensureSeedResponses, getDepartments, getResponses } from "@/lib/storage";

/* =============================================================================
 * デザイントークン
 * ========================================================================== */

// 損失カテゴリー（薄→濃の赤系パレット）
const LOSS_LEGEND = [
  { key: "non_pain_disease" as const, label: "痛み以外の疾病", color: "#f6dcdc" },
  { key: "limb_pain" as const, label: "手足の痛み", color: "#e9a8a8" },
  { key: "headache" as const, label: "頭痛", color: "#cf6a6a" },
  { key: "neck_shoulder" as const, label: "首・肩の痛み", color: "#a53f3f" },
  { key: "lower_back" as const, label: "腰痛", color: "#7a1f1f" },
];

const INDUSTRY = { overall: 3.3, vigor: 2.5, dedication: 3.8, absorption: 3.4 };
const INDUSTRY_LABEL = "事務職（一般事務等）";

const PRODUCTIVITY_COLOR = "#eab065"; // 生産性低下：落ち着いたアンバー
const ABSENT_COLOR = "#b04040"; // 欠勤：深みのあるレッド

type CompareTone = "good" | "eq" | "bad";

function compareTone(score: number, industry: number): CompareTone {
  const d = score - industry;
  if (d > 0.15) return "good";
  if (d < -0.15) return "bad";
  return "eq";
}

function compareLabel(score: number, industry: number): string {
  const t = compareTone(score, industry);
  return t === "good" ? "業界平均より高い" : t === "bad" ? "業界平均より低い" : "業界平均と同等";
}

function scoreBandColor(v: number): string {
  if (v >= 4.5) return "#10b981"; // 非常に高い
  if (v >= 3.0) return "#14b8a6"; // やや高い
  if (v >= 1.5) return "#f5a524"; // やや低い
  return "#e4572e"; // 非常に低い
}

// 軸目盛りを切りのいい上限にスナップ
function niceCeil(x: number): number {
  if (x <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const m = x / p;
  const nm = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nm * p;
}

/* =============================================================================
 * ページ本体
 * ========================================================================== */

export default function ResultsDashboard() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [rows, setRows] = useState<ReturnType<typeof getResponses>>([]);
  const [axis, setAxis] = useState<SummaryAxis>("department");
  const [tab, setTab] = useState<string>("all");
  const [middleView, setMiddleView] = useState<"loss" | "health">("loss");

  const load = useCallback(() => {
    ensureSeedResponses();
    setDepartments(getDepartments());
    setRows(getResponses());
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const tabs = useMemo(() => axisTabs(axis, departments), [axis, departments]);
  const activeTab = useMemo(() => {
    const valid = new Set(tabs.map((t) => t.id));
    return valid.has(tab) ? tab : "all";
  }, [tabs, tab]);

  const filtered = useMemo(() => filterResponses(rows, axis, activeTab), [rows, axis, activeTab]);
  const occ = useMemo(() => summarizeOccupational(filtered), [filtered]);
  const lossTotal = useMemo(() => laborLossTotalManYen(filtered), [filtered]);
  const lossSplit = useMemo(() => laborLossSplitForTotal(filtered), [filtered]);
  const deptLoss = useMemo(() => laborLossByDepartment(filtered, departments), [filtered, departments]);
  const we = useMemo(() => workEngagementSummary(filtered), [filtered]);
  const weByDept = useMemo(() => workEngagementByDepartment(filtered, departments), [filtered, departments]);
  const companyAvg = useMemo(() => workEngagementSummary(rows), [rows]);
  const prodAbs = useMemo(() => productivityAndAbsentTotalsManYen(filtered), [filtered]);

  const conditionBars = useMemo(() => {
    const entries = QQ_CONDITIONS.filter((c) => c.id !== "none")
      .map((c) => ({
        id: c.id,
        label: c.label,
        count: occ.healthProblems.conditionCounts[c.id] ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...entries.map((e) => e.count));
    return { entries, max };
  }, [occ.healthProblems.conditionCounts]);

  const painHotspots = useMemo(() => {
    const entries = Object.entries(occ.painCounts) as [string, number][];
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([k, v]) => ({ id: k, intensity: v / max, count: v }));
  }, [occ.painCounts]);

  // 症状カテゴリ別の損失額バー
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
          {/* ---------------- フィルター行 ---------------- */}
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

          {/* ---------------- ワークエンゲージメント スコア ---------------- */}
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardHeader title="ワークエンゲージメントスコア" />
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500">
                <span>
                  現在の表示：
                  <span className="mx-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                    {segment}
                  </span>
                </span>
                <span>
                  比較対象業界：
                  <span className="mx-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                    {INDUSTRY_LABEL}
                  </span>
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
              <WeScoreCard title="総合スコア" score={we.overall} industry={INDUSTRY.overall} />
              <WeScoreCard title="活力" score={we.vigor} industry={INDUSTRY.vigor} />
              <WeScoreCard title="熱意" score={we.dedication} industry={INDUSTRY.dedication} />
              <WeScoreCard title="没頭" score={we.absorption} industry={INDUSTRY.absorption} />
            </div>
          </Card>

          {/* ---------------- ワークエンゲージメント 属性別比較 ---------------- */}
          <Card>
            <CardHeader title="ワークエンゲージメント属性別比較" />
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <WeCompareColumn
                label="エンゲージメントスコア"
                rows={weByDept}
                field="overall"
                companyAvg={companyAvg.overall}
              />
              <WeCompareColumn
                label="活力"
                rows={weByDept}
                field="vigor"
                companyAvg={companyAvg.vigor}
              />
              <WeCompareColumn
                label="熱意"
                rows={weByDept}
                field="dedication"
                companyAvg={companyAvg.dedication}
              />
              <WeCompareColumn
                label="没頭"
                rows={weByDept}
                field="absorption"
                companyAvg={companyAvg.absorption}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500">
              <span className="mr-1 inline-flex items-center gap-1.5 font-semibold text-slate-600">
                評価基準
              </span>
              <ScoreLegendChip color="#10b981" label="4.5-6.0：非常に高い" />
              <ScoreLegendChip color="#14b8a6" label="3.0-4.4：やや高い" />
              <ScoreLegendChip color="#f5a524" label="1.5-2.9：やや低い" />
              <ScoreLegendChip color="#e4572e" label="0.1-1.4：非常に低い" />
            </div>
          </Card>

          <p className="mx-auto max-w-2xl pb-6 text-center text-[11px] leading-relaxed text-slate-400">
            労働損失額は QQメソッドの定義に基づき、パフォーマンス低下度（1 − 量/10 × 質/10）と年間損失（有症状日数 / 30 × 低下度 × 月給 × 12）により算出しています（
            <a
              href="https://wellaboswp.com/column/qq-method-presenteeism-guide/"
              className="text-teal-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              解説
            </a>
            ）。数値はローカル保存の回答によるデモ集計です。
          </p>
        </main>
      </div>
    </AppChrome>
  );
}

/* =============================================================================
 * 共通 UI
 * ========================================================================== */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_18px_rgba(15,23,42,0.04)]">
      {children}
    </section>
  );
}

function AccentTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="inline-block h-4 w-[3px] rounded-full bg-teal-600" />
      {children}
    </span>
  );
}

function CardHeader({ title }: { title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
      <span className="inline-block h-4 w-[3px] rounded-full bg-teal-600" />
      <span>{title}</span>
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-50 text-[10px] font-bold text-teal-600 ring-1 ring-teal-200"
        aria-hidden
      >
        ?
      </span>
    </h3>
  );
}

function SelectBox({
  value,
  onChange,
  options,
  size = "md",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  size?: "sm" | "md";
}) {
  const sz =
    size === "sm"
      ? "pl-3 pr-8 py-1.5 text-xs"
      : "pl-4 pr-9 py-2 text-sm";
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:ring-2 focus:ring-teal-500/30 ${sz}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${
          size === "sm" ? "right-2.5 h-3.5 w-3.5" : "right-3 h-4 w-4"
        }`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
      </svg>
    </div>
  );
}

/* =============================================================================
 * Card 1 : MetricRow + HalfDonut
 * ========================================================================== */

function MetricRow({
  accent,
  ringTrack,
  title,
  count,
  denom,
  percent,
  percentLabel,
  description,
}: {
  accent: string;
  ringTrack: string;
  title: string;
  count: number;
  denom: number;
  percent: number;
  percentLabel: string;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="inline-block h-6 w-[3px] rounded-sm" style={{ background: accent }} />
        <p className="text-sm font-bold text-slate-700">{title}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-4xl font-bold leading-none text-slate-800">
          {count}
          <span className="ml-0.5 text-lg font-bold text-slate-500">人</span>
          <span className="ml-1 text-lg font-semibold text-slate-400">
            /{denom === 0 ? " —" : `${denom}人`}
          </span>
        </p>
        <HalfDonut percent={percent} color={accent} track={ringTrack} label={percentLabel} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function HalfDonut({
  percent,
  color,
  track,
  label,
}: {
  percent: number;
  color: string;
  track: string;
  label: string;
}) {
  const p = Math.max(0, Math.min(100, percent));
  const size = 104;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const arcLength = Math.PI * r; // 半円
  const offset = arcLength * (1 - p / 100);

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 28 }}>
      <svg
        width={size}
        height={size / 2 + 6}
        viewBox={`0 0 ${size} ${size / 2 + 6}`}
        aria-hidden
      >
        <path
          d={`M ${stroke / 2},${cy} A ${r},${r} 0 0 1 ${size - stroke / 2},${cy}`}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2},${cy} A ${r},${r} 0 0 1 ${size - stroke / 2},${cy}`}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center leading-none">
        <p className="text-2xl font-bold text-slate-800">
          {p}
          <span className="ml-0.5 text-xs font-bold text-slate-500">%</span>
        </p>
        <p className="mt-1 text-[10px] font-semibold tracking-wider text-slate-400">
          {label}
        </p>
      </div>
    </div>
  );
}

/* =============================================================================
 * Card 2 : Legend row + horizontal bars
 * ========================================================================== */

function LegendAmountRow({
  color,
  amount,
  label,
}: {
  color: string;
  amount: number;
  label: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className="inline-block h-3 w-3 shrink-0 translate-y-[1px] rounded-sm"
        style={{ background: color }}
      />
      <span className="text-lg font-bold text-slate-800">
        {amount.toFixed(1)}
        <span className="ml-0.5 text-xs font-bold text-slate-500">万円</span>
      </span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function HorizontalBars({
  entries,
  max,
  color,
  accent,
  accentRatio = 0,
  unit,
  ticks = 4,
}: {
  entries: { id: string; label: string; value: number }[];
  max: number;
  color: string;
  accent?: string;
  accentRatio?: number;
  unit: string;
  ticks?: number;
}) {
  const niceMax = niceCeil(max);
  const tickValues = Array.from({ length: ticks + 1 }, (_, i) => (niceMax * i) / ticks);
  const LABEL_W = "7rem";

  return (
    <div className="space-y-2">
      {entries.map((e) => {
        const w = niceMax > 0 ? (e.value / niceMax) * 100 : 0;
        const accentW = accent ? accentRatio * w : 0;
        return (
          <div
            key={e.id}
            className="grid items-center gap-2"
            style={{ gridTemplateColumns: `${LABEL_W} 1fr` }}
          >
            <span
              className="truncate text-[11px] leading-tight text-slate-600"
              title={e.label}
            >
              {e.label}
            </span>
            <div className="relative h-5">
              <div className="absolute inset-0">
                {tickValues.slice(1).map((_, i) => (
                  <span
                    key={i}
                    className="absolute top-0 bottom-0 border-r border-dashed border-slate-200"
                    style={{ left: `${((i + 1) / ticks) * 100}%` }}
                  />
                ))}
              </div>
              {w > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-sm"
                  style={{ width: `${w}%`, background: color }}
                />
              )}
              {accent && accentW > 0 ? (
                <div
                  className="absolute inset-y-0 rounded-r-sm"
                  style={{
                    left: `${Math.max(0, w - accentW)}%`,
                    width: `${accentW}%`,
                    background: accent,
                  }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
      <div
        className="grid gap-2 pt-1"
        style={{ gridTemplateColumns: `${LABEL_W} 1fr` }}
      >
        <span />
        <div className="relative h-4 text-[10px] text-slate-400">
          {tickValues.map((v, i) => (
            <span
              key={i}
              className="absolute top-0 whitespace-nowrap"
              style={{
                left: `${(i / ticks) * 100}%`,
                transform: i === 0 ? "translateX(0)" : i === ticks ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              {Math.round(v)}
              {unit}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
 * Card 3 : PainFigure
 * ========================================================================== */

function PainFigure({
  hotspots,
}: {
  hotspots: { id: string; intensity: number; count: number }[];
}) {
  // viewBox 160 × 400 に合わせた痛み部位の座標（背面観）
  const painMap: Record<string, Array<{ x: number; y: number; r: number }>> = {
    head: [{ x: 96, y: 24, r: 14 }], // 後頭部やや右寄り
    neck: [{ x: 80, y: 66, r: 10 }],
    shoulder: [{ x: 80, y: 104, r: 30 }], // 僧帽筋〜肩甲骨
    lower_back: [{ x: 80, y: 238, r: 32 }], // 腰椎まわり
    hip: [{ x: 80, y: 268, r: 20 }],
    wrist: [
      { x: 26, y: 268, r: 12 },
      { x: 134, y: 268, r: 12 },
    ],
    hand: [
      { x: 38, y: 298, r: 13 },
      { x: 122, y: 298, r: 13 },
    ],
    knee: [
      { x: 54, y: 334, r: 14 },
      { x: 106, y: 334, r: 14 },
    ],
    ankle: [
      { x: 52, y: 382, r: 14 },
      { x: 108, y: 382, r: 14 },
    ],
  };

  const hasAny = hotspots.some((h) => h.count > 0);

  return (
    <div className="mt-4 flex items-center justify-center">
      <svg
        viewBox="0 0 160 400"
        className="h-[19rem] w-auto"
        aria-label="身体の痛み部位を示す後面図"
      >
        <defs>
          <linearGradient id="pf-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6ebf1" />
            <stop offset="60%" stopColor="#d6dde6" />
            <stop offset="100%" stopColor="#c2ccd8" />
          </linearGradient>
          <radialGradient id="pf-spot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 身体シルエット（背面観） */}
        <g
          fill="url(#pf-body)"
          stroke="#93a0b2"
          strokeWidth={0.9}
          strokeLinejoin="round"
        >
          {/* 頭 */}
          <ellipse cx={80} cy={36} rx={22} ry={27} />
          {/* 耳 */}
          <ellipse cx={57} cy={38} rx={3.5} ry={7} />
          <ellipse cx={103} cy={38} rx={3.5} ry={7} />

          {/* 首（僧帽筋の付け根に向けてテーパー） */}
          <path d="M 70 60 C 71 66 72 70 72 76 L 88 76 C 88 70 89 66 90 60 Z" />

          {/* 胴体：僧帽筋→三角筋→広背筋→ウエスト→大臀筋 */}
          <path
            d="M 72 76
               C 60 80 44 86 34 96
               C 22 106 18 120 20 132
               C 22 146 28 160 36 170
               C 44 180 50 186 52 194
               L 54 206
               C 54 216 52 222 48 234
               C 44 246 40 258 42 270
               C 44 278 48 282 54 284
               L 106 284
               C 112 282 116 278 118 270
               C 120 258 116 246 112 234
               C 108 222 106 216 106 206
               L 108 194
               C 110 186 116 180 124 170
               C 132 160 138 146 140 132
               C 142 120 138 106 126 96
               C 116 86 100 80 88 76 Z"
          />

          {/* 左腕 */}
          <path
            d="M 34 120
               C 20 134 12 158 12 184
               C 12 210 16 236 22 258
               C 26 270 32 276 38 278
               L 44 278
               C 48 276 50 270 50 262
               C 48 242 46 220 46 198
               C 48 174 50 154 52 136
               C 50 126 42 120 34 120 Z"
          />

          {/* 右腕 */}
          <path
            d="M 126 120
               C 140 134 148 158 148 184
               C 148 210 144 236 138 258
               C 134 270 128 276 122 278
               L 116 278
               C 112 276 110 270 110 262
               C 112 242 114 220 114 198
               C 112 174 110 154 108 136
               C 110 126 118 120 126 120 Z"
          />

          {/* 手（拳） */}
          <ellipse cx={38} cy={290} rx={11} ry={13} />
          <ellipse cx={122} cy={290} rx={11} ry={13} />

          {/* 左脚：大腿→膝→下腿→踝 */}
          <path
            d="M 54 282
               C 52 308 48 332 44 358
               C 42 370 42 380 46 382
               L 60 382
               C 62 380 62 370 62 360
               C 64 336 66 308 68 282 Z"
          />

          {/* 右脚 */}
          <path
            d="M 106 282
               C 108 308 112 332 116 358
               C 118 370 118 380 114 382
               L 100 382
               C 98 380 98 370 98 360
               C 96 336 94 308 92 282 Z"
          />

          {/* 足 */}
          <ellipse cx={52} cy={390} rx={12} ry={5.5} />
          <ellipse cx={108} cy={390} rx={12} ry={5.5} />
        </g>

        {/* 細部（脊柱・肩甲骨・腰のディンプルなどの示唆線） */}
        <g
          fill="none"
          stroke="#64748b"
          strokeLinecap="round"
          strokeWidth={0.6}
          opacity={0.28}
        >
          {/* 脊柱 */}
          <path d="M 80 82 L 80 282" strokeDasharray="2 3" />
          {/* 左肩甲骨 */}
          <path d="M 52 94 Q 60 112 66 128" />
          {/* 右肩甲骨 */}
          <path d="M 108 94 Q 100 112 94 128" />
          {/* 腸骨稜（腰ライン） */}
          <path d="M 54 214 Q 80 222 106 214" />
          {/* ヒップの境界 */}
          <path d="M 80 258 L 80 282" />
        </g>
        {/* 腰のディンプル（Venus のえくぼ） */}
        <g fill="#64748b" opacity={0.22}>
          <circle cx={70} cy={234} r={1.1} />
          <circle cx={90} cy={234} r={1.1} />
        </g>

        {/* 痛みのホットスポット */}
        {hotspots.map((h) => {
          const positions = painMap[h.id];
          if (!positions || h.count === 0) return null;
          const opacity = 0.45 + h.intensity * 0.45;
          return positions.map((pos, idx) => (
            <g key={`${h.id}-${idx}`}>
              {/* 外側の柔らかいグロー */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={pos.r * 1.55}
                fill="url(#pf-spot)"
                opacity={opacity * 0.75}
                style={{ filter: "blur(6px)" }}
              />
              {/* 中心のコア */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={pos.r * 0.85}
                fill="rgb(239 68 68)"
                opacity={opacity}
                style={{ filter: "blur(2.5px)" }}
              />
            </g>
          ));
        })}
      </svg>
      {!hasAny && (
        <p className="ml-4 max-w-[10rem] text-xs text-slate-400">
          該当する痛み部位のデータがありません。
        </p>
      )}
    </div>
  );
}

/* =============================================================================
 * 部署ごとの労働損失額
 * ========================================================================== */

function StackedDepartmentChart({
  rows,
}: {
  rows: { department: string; totalManYen: number; stack: Record<string, number> }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.totalManYen));
  const niceMax = niceCeil(max);
  const ticks = 4;
  const LABEL_W = "7rem";
  const VALUE_W = "5.5rem";

  return (
    <div>
      <div className="space-y-3">
        {rows.map((d) => {
          const w = niceMax > 0 ? (d.totalManYen / niceMax) * 100 : 0;
          return (
            <div
              key={d.department}
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: `${LABEL_W} 1fr ${VALUE_W}` }}
            >
              <span className="truncate text-sm text-slate-600" title={d.department}>
                {d.department}
              </span>
              <div className="relative h-6">
                <div className="absolute inset-0">
                  {Array.from({ length: ticks }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute top-0 bottom-0 border-r border-dashed border-slate-200"
                      style={{ left: `${((i + 1) / ticks) * 100}%` }}
                    />
                  ))}
                </div>
                {d.totalManYen > 0 ? (
                  <div
                    className="absolute inset-y-0 left-0 flex overflow-hidden rounded-[3px]"
                    style={{ width: `${w}%` }}
                  >
                    {LOSS_LEGEND.map((L) => {
                      const part = d.stack[L.key] ?? 0;
                      const pw = d.totalManYen > 0 ? (part / d.totalManYen) * 100 : 0;
                      if (pw <= 0) return null;
                      return (
                        <span
                          key={L.key}
                          title={`${L.label}: ${part.toFixed(1)}万円`}
                          className="h-full"
                          style={{ width: `${pw}%`, background: L.color }}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <span className="text-right text-sm font-bold text-slate-800">
                {d.totalManYen.toFixed(1)}万円
              </span>
            </div>
          );
        })}
      </div>
      <div
        className="mt-2 grid gap-3"
        style={{ gridTemplateColumns: `${LABEL_W} 1fr ${VALUE_W}` }}
      >
        <span />
        <div className="relative h-4 text-[10px] text-slate-400">
          {Array.from({ length: ticks + 1 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 whitespace-nowrap"
              style={{
                left: `${(i / ticks) * 100}%`,
                transform:
                  i === 0
                    ? "translateX(0)"
                    : i === ticks
                    ? "translateX(-100%)"
                    : "translateX(-50%)",
              }}
            >
              {((niceMax * i) / ticks).toFixed(1)}万円
            </span>
          ))}
        </div>
        <span />
      </div>
    </div>
  );
}

/* =============================================================================
 * ワークエンゲージメント
 * ========================================================================== */

function ScoreFace({ tone }: { tone: CompareTone }) {
  const fill = tone === "good" ? "#a3d37a" : tone === "bad" ? "#ef5350" : "#f2b75b";
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
      <circle cx="32" cy="32" r="28" fill={fill} />
      {tone === "good" ? (
        <>
          {/* ^_^ 目 */}
          <path
            d="M20 27 Q24 22 28 27"
            stroke="#3a2f14"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M36 27 Q40 22 44 27"
            stroke="#3a2f14"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M22 40 Q32 50 42 40"
            stroke="#3a2f14"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : tone === "bad" ? (
        <>
          <circle cx="24" cy="27" r="2.2" fill="#3a2f14" />
          <circle cx="40" cy="27" r="2.2" fill="#3a2f14" />
          <path
            d="M22 44 Q32 36 42 44"
            stroke="#3a2f14"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <>
          <circle cx="24" cy="27" r="2.2" fill="#3a2f14" />
          <circle cx="40" cy="27" r="2.2" fill="#3a2f14" />
          <path
            d="M22 42 L42 42"
            stroke="#3a2f14"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function WeScoreCard({
  title,
  score,
  industry,
}: {
  title: string;
  score: number;
  industry: number;
}) {
  const tone = compareTone(score, industry);
  const chip =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "bad"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-amber-50 text-amber-700 ring-amber-200";
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-[#f8fbfb] p-5 text-center">
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      <div className="mt-3 flex justify-center">
        <ScoreFace tone={tone} />
      </div>
      <p className="mt-3 text-3xl font-bold leading-none tracking-tight text-slate-800">
        {score.toFixed(1)}
        <span className="ml-0.5 text-sm font-bold text-slate-400">/6.0</span>
      </p>
      <span
        className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${chip}`}
      >
        {compareLabel(score, industry)}
      </span>
      <p className="mt-2 text-[11px] text-slate-400">業界平均：{industry.toFixed(1)}</p>
    </div>
  );
}

function WeCompareColumn({
  label,
  rows,
  field,
  companyAvg,
}: {
  label: string;
  rows: {
    department: string;
    overall: number;
    vigor: number;
    dedication: number;
    absorption: number;
  }[];
  field: "overall" | "vigor" | "dedication" | "absorption";
  companyAvg: number;
}) {
  const max = 6;
  const avgLeft = (companyAvg / max) * 100;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-[#f8fbfb] p-4">
      <div className="flex items-center justify-between gap-2 pb-3">
        <p className="text-sm font-bold text-slate-700">{label}</p>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          <span className="inline-block h-3 w-0 border-r border-dashed border-slate-400/80" />
          社内平均
        </span>
      </div>
      <div className="space-y-3">
        {rows.map((r) => {
          const v = r[field];
          const w = (v / max) * 100;
          const bg = scoreBandColor(v);
          return (
            <div key={r.department}>
              <p className="mb-1 text-[11px] text-slate-500">{r.department}</p>
              <div className="relative h-5 rounded bg-slate-100">
                <div
                  className="absolute inset-y-0 left-0 flex items-center rounded px-2 text-[11px] font-bold text-white"
                  style={{
                    width: `${Math.max(w, 0.5)}%`,
                    background: bg,
                    minWidth: v > 0 ? "2.2rem" : 0,
                  }}
                >
                  {v > 0 ? v.toFixed(1) : "0.0"}
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 border-r border-dashed border-slate-500/70"
                  style={{ left: `${avgLeft}%` }}
                  title={`社内平均 ${companyAvg.toFixed(1)}`}
                />
              </div>
              <div className="relative h-3">
                <span
                  className="absolute top-0 text-[10px] text-slate-400"
                  style={{ left: `${avgLeft}%`, transform: "translateX(-50%)" }}
                >
                  {companyAvg.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreLegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-3 w-6 rounded" style={{ background: color }} />
      {label}
    </span>
  );
}
