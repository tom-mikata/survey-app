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

const LOSS_LEGEND = [
  { key: "non_pain_disease" as const, label: "痛み以外の疾病", color: "#fce7f3" },
  { key: "lower_back" as const, label: "腰痛", color: "#881337" },
  { key: "limb_pain" as const, label: "手足の痛み", color: "#fb7185" },
  { key: "headache" as const, label: "頭痛", color: "#92400e" },
  { key: "neck_shoulder" as const, label: "首・肩の痛み", color: "#f43f5e" },
];

const INDUSTRY = { overall: 3.3, vigor: 2.5, dedication: 3.8, absorption: 3.4 };
const INDUSTRY_LABEL = "事務職（一般事務など）";

function scoreBandColor(v: number): string {
  if (v >= 4.5) return "#16a34a";
  if (v >= 3.0) return "#0d9488";
  if (v >= 1.5) return "#fb923c";
  return "#dc2626";
}

function compareLabel(score: number, industry: number): { text: string; tone: "good" | "eq" | "bad" } {
  const d = score - industry;
  if (d > 0.15) return { text: "業界平均より高い", tone: "good" };
  if (d < -0.15) return { text: "業界平均より低い", tone: "bad" };
  return { text: "業界平均と同程度", tone: "eq" };
}

export default function ResultsDashboard() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [rows, setRows] = useState<ReturnType<typeof getResponses>>([]);
  const [axis, setAxis] = useState<SummaryAxis>("department");
  const [tab, setTab] = useState<string>("all");

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

  const conditionBars = useMemo(() => {
    const entries = QQ_CONDITIONS.filter((c) => c.id !== "none")
      .map((c) => ({
        id: c.id,
        label: c.label,
        count: occ.healthProblems.conditionCounts[c.id] ?? 0,
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...entries.map((e) => e.count));
    return { entries, max };
  }, [occ.healthProblems.conditionCounts]);

  const painHotspots = useMemo(() => {
    const entries = Object.entries(occ.painCounts) as [string, number][];
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return entries.map(([k, v]) => ({ id: k, intensity: v / max, count: v }));
  }, [occ.painCounts]);

  const presenteeismPct = Math.round(occ.presenteeism.rate * 100);
  const absenteeismPct = Math.round(occ.absenteeismAmongInterference.rate * 100);

  const prodAbs = useMemo(() => productivityAndAbsentTotalsManYen(filtered), [filtered]);
  const productivityLoss = prodAbs.productivity;
  const absentDrivenLoss = prodAbs.absent;

  return (
    <AppChrome title="分析結果">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">職業病サマリー</h1>
            <p className="text-sm text-slate-500 mt-1">
              現在の表示: <span className="font-semibold text-slate-700">{segmentLabel(axis, activeTab)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">分類</span>
            <select
              value={axis}
              onChange={(e) => {
                setAxis(e.target.value as SummaryAxis);
                setTab("all");
              }}
              className="rounded-lg border border-slate-200 bg-white text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500/30"
            >
              <option value="department">部署ごと</option>
              <option value="age">年代ごと</option>
              <option value="gender">性別ごと</option>
            </select>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${
                activeTab === t.id
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 上段3カード */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
            <h2 className="text-sm font-bold text-slate-800">損失額が生じている従業員数</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">業務に支障がある人</p>
                <p className="text-lg font-bold text-slate-800">
                  {occ.presenteeism.count}人 / {occ.total}人
                </p>
                <Donut percent={presenteeismPct} color="#0ea5e9" track="#e2e8f0" />
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  身体的な不調で業務に支障を感じている回答の割合は {presenteeismPct}% です。
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">欠勤したことがある人</p>
                <p className="text-lg font-bold text-slate-800">
                  {occ.absenteeismAmongInterference.denominator === 0
                    ? "—"
                    : `${occ.absenteeismAmongInterference.count}人 / ${occ.absenteeismAmongInterference.denominator}人`}
                </p>
                <Donut percent={absenteeismPct} color="#f97316" track="#e2e8f0" />
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  業務支障ありの回答者のうち、欠勤経験がある割合は {absenteeismPct}% です。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-1">職業病起因の労働損失額（目安）</h2>
            <p className="text-2xl font-bold text-slate-900">{lossTotal.toFixed(1)}万円</p>
            <p className="text-xs text-slate-500 mt-1 mb-3">
              内訳（可視化用）: プレゼンティーイズム相当 {productivityLoss.toFixed(1)}万円 / 欠勤関連の目安{" "}
              {absentDrivenLoss.toFixed(1)}万円
            </p>
            <div className="h-3 w-full rounded-full overflow-hidden flex">
              <div className="h-full bg-amber-400" style={{ width: `${(productivityLoss / (lossTotal || 1)) * 100}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${(absentDrivenLoss / (lossTotal || 1)) * 100}%` }} />
            </div>
            <div className="mt-4 space-y-2">
              {LOSS_LEGEND.map((L) => {
                const v = lossSplit.agg[L.key];
                const w = lossSplit.total > 0 ? (v / lossSplit.total) * 100 : 0;
                return (
                  <div key={L.key}>
                    <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                      <span>{L.label}</span>
                      <span>{v.toFixed(1)}万円</span>
                    </div>
                    <div className="h-2 rounded bg-slate-100 overflow-hidden">
                      <div className="h-full" style={{ width: `${w}%`, background: L.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-3">痛みの部位</h2>
            <PainFigure hotspots={painHotspots} />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">健康上の不調（QQ 質問1・件数）</h2>
              <p className="text-sm text-slate-500">
                健康上の問題を抱える回答: {occ.healthProblems.count}人 / {occ.total}人（
                {(occ.healthProblems.rate * 100).toFixed(1)}%）
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {conditionBars.entries.length === 0 ? (
              <p className="text-sm text-slate-400">該当データがありません。</p>
            ) : (
              conditionBars.entries.map((e) => (
                <div key={e.id}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1 gap-2">
                    <span className="leading-snug">{e.label}</span>
                    <span className="flex-shrink-0">{e.count}件</span>
                  </div>
                  <div className="h-2.5 rounded bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-rose-500/90"
                      style={{ width: `${(e.count / conditionBars.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 部署ごとの労働損失額 */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-2">部署ごとの労働損失額一覧</h2>
          <p className="text-sm text-slate-500 mb-6">
            選択中のセグメント（{segmentLabel(axis, activeTab)}）に基づく集計です。積み上げは症状カテゴリ別の配分（目安）です。
          </p>
          <div className="space-y-4">
            {deptLoss
              .slice()
              .sort((a, b) => b.totalManYen - a.totalManYen)
              .map((d) => {
                const t = d.totalManYen || 1;
                return (
                  <div key={d.department}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-700">{d.department}</span>
                      <span className="text-slate-600">{d.totalManYen.toFixed(1)}万円</span>
                    </div>
                    <div className="h-4 rounded-md overflow-hidden flex">
                      {LOSS_LEGEND.map((L) => {
                        const part = d.stack[L.key];
                        const w = (part / t) * 100;
                        return (
                          <div
                            key={L.key}
                            title={`${L.label}: ${part.toFixed(1)}万円`}
                            className="h-full"
                            style={{ width: `${w}%`, background: L.color }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-600">
            {LOSS_LEGEND.map((L) => (
              <span key={L.key} className="inline-flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: L.color }} />
                {L.label}
              </span>
            ))}
          </div>
        </section>

        {/* ワークエンゲージメント */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-800">ワークエンゲージメントデータ</h2>
            <div className="text-sm text-slate-500">
              比較対象業界: <span className="font-semibold text-slate-700">{INDUSTRY_LABEL}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <WeCard
              title="総合スコア"
              score={we.overall}
              industry={INDUSTRY.overall}
              subtitle="（活力・熱意・没頭の平均）"
            />
            <WeCard title="活力" score={we.vigor} industry={INDUSTRY.vigor} />
            <WeCard title="熱意" score={we.dedication} industry={INDUSTRY.dedication} />
            <WeCard title="没頭" score={we.absorption} industry={INDUSTRY.absorption} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">ワークエンゲージメント属性別比較（部署）</h3>
            <WeCompareBars
              label="総合スコア"
              rows={weByDept}
              field="overall"
              companyAvg={companyAvg.overall}
            />
            <WeCompareBars label="活力" rows={weByDept} field="vigor" companyAvg={companyAvg.vigor} />
            <WeCompareBars
              label="熱意"
              rows={weByDept}
              field="dedication"
              companyAvg={companyAvg.dedication}
            />
            <WeCompareBars
              label="没頭"
              rows={weByDept}
              field="absorption"
              companyAvg={companyAvg.absorption}
            />
            <div className="mt-6 flex flex-wrap gap-3 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#16a34a" }} />
                4.5–6.0 非常に高い
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#0d9488" }} />
                3.0–4.4 やや高い
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#fb923c" }} />
                1.5–2.9 やや低い
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: "#dc2626" }} />
                0.1–1.4 非常に低い
              </span>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-slate-400 pb-8 max-w-2xl mx-auto leading-relaxed">
          労働損失額は QQメソッドの定義に基づき、パフォーマンス低下度（1−量/10×質/10）と年間損失（有症状日数/30×低下度×月給×12）を用いて算出しています（
          <a
            href="https://wellaboswp.com/column/qq-method-presenteeism-guide/"
            className="text-sky-600 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            解説
          </a>
          ）。数値はローカル保存の回答によるデモ集計です。
        </p>
      </main>
    </AppChrome>
  );
}

function Donut({ percent, color, track }: { percent: number; color: string; track: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-3 mt-2">
      <div
        className="w-16 h-16 rounded-full"
        style={{
          background: `conic-gradient(${color} ${p}%, ${track} 0)`,
        }}
      />
      <p className="text-sm font-bold text-slate-700">{p}%</p>
    </div>
  );
}

function PainFigure({ hotspots }: { hotspots: { id: string; intensity: number; count: number }[] }) {
  const map: Record<string, { x: number; y: number; r: number }> = {
    head: { x: 50, y: 12, r: 14 },
    neck: { x: 50, y: 22, r: 10 },
    shoulder: { x: 50, y: 28, r: 18 },
    lower_back: { x: 50, y: 48, r: 22 },
    wrist: { x: 22, y: 42, r: 9 },
    hand: { x: 18, y: 48, r: 9 },
    hip: { x: 50, y: 58, r: 12 },
    knee: { x: 42, y: 72, r: 10 },
    ankle: { x: 46, y: 88, r: 10 },
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-44 h-52 text-slate-300">
        {/* 簡易シルエット */}
        <ellipse cx="50" cy="14" rx="10" ry="12" fill="currentColor" opacity="0.35" />
        <path
          d="M38 26 Q50 24 62 26 L68 44 Q70 52 62 56 L58 90 Q56 96 50 96 Q44 96 42 90 L38 56 Q30 52 32 44 Z"
          fill="currentColor"
          opacity="0.25"
        />
        {hotspots.map((h) => {
          const pos = map[h.id];
          if (!pos || h.count === 0) return null;
          const o = 0.25 + h.intensity * 0.65;
          return (
            <circle
              key={h.id}
              cx={pos.x}
              cy={pos.y}
              r={pos.r}
              fill="rgb(239 68 68)"
              opacity={o}
              style={{ filter: "blur(2px)" }}
            />
          );
        })}
      </svg>
      <div className="text-xs text-slate-500 max-w-xs">
        回答で選択された部位の集計を強度で表示しています（同一回答の複数部位を含みます）。
      </div>
    </div>
  );
}

function WeCard({
  title,
  score,
  industry,
  subtitle,
}: {
  title: string;
  score: number;
  industry: number;
  subtitle?: string;
}) {
  const cmp = compareLabel(score, industry);
  const tone =
    cmp.tone === "good" ? "text-emerald-700" : cmp.tone === "bad" ? "text-rose-700" : "text-amber-700";
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      {subtitle ? <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p> : null}
      <p className="text-3xl font-bold text-slate-900 mt-2">
        {score.toFixed(1)}
        <span className="text-base font-semibold text-slate-400"> / 6.0</span>
      </p>
      <p className={`text-xs font-semibold mt-2 ${tone}`}>{cmp.text}</p>
      <p className="text-xs text-slate-500 mt-1">業界平均: {industry.toFixed(1)}</p>
    </div>
  );
}

function WeCompareBars({
  label,
  rows,
  field,
  companyAvg,
}: {
  label: string;
  rows: { department: string; overall: number; vigor: number; dedication: number; absorption: number }[];
  field: "overall" | "vigor" | "dedication" | "absorption";
  companyAvg: number;
}) {
  const max = 6;
  return (
    <div className="mb-8 last:mb-0">
      <p className="text-sm font-bold text-slate-700 mb-2">{label}</p>
      <div className="space-y-2">
        {rows.map((r) => {
          const v = r[field];
          const w = (v / max) * 100;
          const bg = scoreBandColor(v);
          return (
            <div key={r.department} className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr] gap-2 items-center">
              <p className="text-xs text-slate-600 truncate">{r.department}</p>
              <div className="relative h-7 rounded-md bg-slate-100 overflow-hidden">
                <div
                  className="h-full flex items-center justify-end pr-2 text-xs font-bold text-white"
                  style={{ width: `${w}%`, background: bg, minWidth: v > 0 ? "2.5rem" : 0 }}
                >
                  {v > 0 ? v.toFixed(1) : ""}
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 border-l border-dashed border-slate-400/80"
                  style={{ left: `${(companyAvg / max) * 100}%` }}
                  title={`社内平均 ${companyAvg.toFixed(1)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-1">破線は全回答を対象とした社内平均（{companyAvg.toFixed(1)}）です。</p>
    </div>
  );
}
