"use client";

import type { ReactNode } from "react";
import {
  summarizeCompanySupport,
  summarizeConsultation,
  summarizeExercise,
  summarizeMentalHealth,
  summarizePrimaryCondition,
  summarizeQqDetail,
  summarizeSymptoms,
  summarizeTreatment,
  summarizeWorkLife,
} from "@/lib/analytics";
import type { CompanySupportRow, ExerciseRow, MentalHealthRow, SecondPartData, SurveyResponse, WorkLifeRow } from "@/lib/types";

/* ── カラー ── */
const C = {
  base:   "#aab4b7",  // 前回
  brand:  "#1f8a7f",  // 今回
  brand2: "#57b3a8",
  warn:   "#c8694f",
  warn2:  "#e0a184",
  track:  "#eef1f1",
  muted:  "#657279",
};

/* ── フォーマット ── */
const fP = (r: number, d = 1) => `${(r * 100).toFixed(d)}%`;
const fN = (v: number, d = 1) => v.toFixed(d);
const fPct = (n: number, d: number) => n > 0 && d > 0 ? fP(n / d) : "0%";

/* ════════════════════════════════════════════════════════════
 * プリミティブ
 * ════════════════════════════════════════════════════════════ */

/** 大きな前回→今回比較 */
function BigArrow({ label, base, current, unit = "%", goodDir = "decrease" }: {
  label?: string; base?: string; current: string; unit?: string; goodDir?: "decrease" | "increase";
}) {
  const bNum = base !== undefined ? parseFloat(base.replace(/[^0-9.-]/g, "")) : undefined;
  const cNum = parseFloat(current.replace(/[^0-9.-]/g, ""));
  const delta = bNum !== undefined ? cNum - bNum : 0;
  const isGood = goodDir === "decrease" ? delta < 0 : delta > 0;
  const absDelta = Math.abs(delta).toFixed(unit === "%" ? 1 : 2);
  const deltaUnit = unit === "%" ? "pt" : unit;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      {label && <span className="text-[13px] text-slate-500">{label}</span>}
      {base !== undefined && (
        <>
          <span className="text-2xl font-semibold tabular-nums" style={{ color: C.base }}>{base}</span>
          <span className="text-base text-slate-400">→</span>
        </>
      )}
      <span className="text-3xl font-bold tabular-nums" style={{ color: C.brand }}>{current}</span>
      {bNum !== undefined && Math.abs(delta) > 0.001 && (
        <span className="text-sm font-bold tabular-nums" style={{ color: isGood ? C.brand : C.warn }}>
          {delta < 0 ? "▼" : "▲"}{absDelta}{deltaUnit}
        </span>
      )}
    </div>
  );
}

/** 単体の横棒 */
function HBar({ tag, rate, display, color }: { tag?: string; rate: number; display: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      {tag !== undefined && <span className="w-9 shrink-0 text-right text-[11px]" style={{ color: C.muted }}>{tag}</span>}
      <div className="flex-1 h-[9px] rounded-full" style={{ background: C.track }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, rate * 100))}%`, background: color }} />
      </div>
      <span className="w-11 shrink-0 text-right text-[12px] tabular-nums" style={{ color: C.muted }}>{display}</span>
    </div>
  );
}

/** 前回/今回の2本横棒（ラベル付き） */
function BeforeAfterBars({ label, baseRate, baseDisplay, currentRate, currentDisplay, color = C.brand }: {
  label?: string; baseRate?: number; baseDisplay?: string; currentRate: number; currentDisplay: string; color?: string;
}) {
  return (
    <div className="space-y-0.5">
      {label && <p className="text-[12.5px] text-slate-600 mb-1">{label}</p>}
      {baseRate !== undefined && baseDisplay !== undefined && (
        <HBar tag="前回" rate={baseRate} display={baseDisplay} color={C.base} />
      )}
      <HBar tag={baseRate !== undefined ? "今回" : undefined} rate={currentRate} display={currentDisplay} color={color} />
    </div>
  );
}

/** ダンベル図 */
function DumbbellRow({ label, basePct, currentPct }: { label: string; basePct?: number; currentPct: number }) {
  const cP = Math.min(100, Math.max(0, currentPct));
  const bP = basePct !== undefined ? Math.min(100, Math.max(0, basePct)) : undefined;
  const minP = bP !== undefined ? Math.min(cP, bP) : cP;
  const maxP = bP !== undefined ? Math.max(cP, bP) : cP;
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="w-36 shrink-0 text-[12.5px] text-slate-600">{label}</span>
      <div className="relative flex-1 h-5">
        {bP !== undefined && (
          <div className="absolute top-1/2 -translate-y-1/2 h-[3px] rounded-full" style={{ left: `${minP}%`, width: `${maxP - minP}%`, background: "#cdd5d6" }} />
        )}
        <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-white" style={{ left: `${cP}%`, top: "50%", transform: "translate(-50%,-50%)", background: C.brand }} />
        {bP !== undefined && (
          <div className="absolute w-3.5 h-3.5 rounded-full border-2 border-white" style={{ left: `${bP}%`, top: "50%", transform: "translate(-50%,-50%)", background: C.base }} />
        )}
      </div>
      <span className="w-28 shrink-0 text-right text-[12px] tabular-nums" style={{ color: C.muted }}>
        {bP !== undefined ? `${bP.toFixed(1)}% → ${cP.toFixed(1)}%` : `${cP.toFixed(1)}%`}
      </span>
    </div>
  );
}

type Segment = { key: string; label: string; color: string };
type StackRow = { tag: string; data: Record<string, number>; total: number };

/** 100%積み上げ横棒 */
function Stacked100({ rows, segments }: { rows: StackRow[]; segments: Segment[] }) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.tag} className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-right text-[11px]" style={{ color: C.muted }}>{row.tag}</span>
          <div className="flex flex-1 h-6 rounded-md overflow-hidden" style={{ background: C.track }}>
            {row.total > 0 && segments.map((seg) => {
              const v = row.data[seg.key] ?? 0;
              const w = (v / row.total) * 100;
              if (w < 0.5) return null;
              return (
                <div key={seg.key} className="flex items-center justify-center text-[10.5px] text-white overflow-hidden shrink-0"
                  style={{ width: `${w}%`, background: seg.color }} title={`${seg.label}: ${w.toFixed(1)}%`}>
                  {w >= 9 ? `${Math.round(w)}` : ""}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11.5px]" style={{ color: C.muted }}>
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** ヒストグラム（縦棒・前回/今回の並び） */
function HistogramBars({ labels, baseCounts, currentCounts, baseTotal, currentTotal, height = 88 }: {
  labels: string[]; baseCounts?: number[]; currentCounts: number[];
  baseTotal?: number; currentTotal: number; height?: number;
}) {
  const cRates = currentCounts.map((c) => currentTotal > 0 ? c / currentTotal : 0);
  const bRates = baseCounts && baseTotal ? baseCounts.map((c) => baseTotal > 0 ? c / baseTotal : 0) : undefined;
  const maxR = Math.max(0.01, ...cRates, ...(bRates ?? []));
  return (
    <div>
      <div className="flex gap-3" style={{ height }}>
        {labels.map((_, i) => (
          <div key={i} className="flex-1 flex items-end justify-center gap-1.5">
            {bRates && <div className="w-5 rounded-t" style={{ height: `${(bRates[i] / maxR) * 100}%`, background: C.base }} />}
            <div className="w-5 rounded-t" style={{ height: `${(cRates[i] / maxR) * 100}%`, background: C.brand }} />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-1.5">
        {labels.map((l, i) => (
          <span key={i} className="flex-1 text-center text-[11px]" style={{ color: C.muted }}>{l}</span>
        ))}
      </div>
    </div>
  );
}

/** セクション見出し */
function SecHead({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-8 mb-3 text-[15px] font-semibold text-slate-700">
      <span className="inline-block w-1 h-[18px] rounded-sm" style={{ background: C.brand }} />
      {children}
    </div>
  );
}

/** 設問カード */
function QCard({ qno, title, children }: { qno: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 mb-3.5">
      <p className="mb-3 text-[15.5px] font-semibold text-slate-800">
        <span className="mr-2 font-semibold" style={{ color: C.brand }}>{qno}</span>{title}
      </p>
      {children}
    </div>
  );
}

function NoData() {
  return <p className="text-[13px] text-slate-400">データなし（回答数 0）</p>;
}

/** 前回/今回の凡例 */
function CompareLegend() {
  return (
    <div className="flex gap-5 text-[12px] mt-3" style={{ color: C.muted }}>
      <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: C.base }} />前回</span>
      <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: C.brand }} />今回</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
 * ラベルマップ
 * ════════════════════════════════════════════════════════════ */

const CONDITION_LABELS: Record<string, string> = {
  allergy: "アレルギー（花粉症など）", skin: "皮膚の不調", infection: "感染症（風邪など）",
  gi: "胃腸の不調", limb_joint: "手足の関節の痛み", lower_back: "腰痛",
  neck_shoulder: "首・肩こり", headache: "頭痛", dental: "歯の不調",
  mental: "心の不調", sleep: "睡眠の不調", fatigue: "全身のだるさ・疲労感",
  eye: "目の不調", womens_health: "女性特有の健康課題", other: "その他",
};
const TREATMENT_LABELS: Record<string, string> = { hospital: "病院・クリニック", massage: "整骨院・鍼灸・マッサージ", other: "その他" };
const DAILY_ITEM_LABELS: Record<string, string> = { patch: "湿布", medicine: "飲み薬", ointment: "塗り薬", support: "コルセット・サポーター", supplement: "サプリメント", other: "その他" };
const EXPERT_LABELS = [
  { key: "want",       label: "利用してみたい",  color: C.brand },
  { key: "interested", label: "興味はある",       color: C.brand2 },
  { key: "no",         label: "思わない",         color: "#cdd5d7" },
] as const;
const ROLE_SEGS = [
  { key: "rarely",     label: "まったくない", color: "#e7edee" },
  { key: "little",     label: "あまりない",   color: "#cddedb" },
  { key: "sometimes",  label: "ときどきある", color: "#e7c6a0" },
  { key: "often",      label: "よくある",     color: C.warn2   },
  { key: "very_often", label: "いつもある",   color: C.warn    },
] as const;
const SUPPORT_SEGS = [
  { key: "want",        label: "希望する",   color: C.brand  },
  { key: "conditional", label: "条件次第",   color: C.brand2 },
  { key: "not_needed",  label: "不要",       color: "#cdd5d7" },
] as const;
const CONSULT_SEGS = [
  { key: "internal", label: "社内",           color: C.brand  },
  { key: "both",     label: "社内・社外の両方", color: C.brand2 },
  { key: "external", label: "社外のみ",       color: "#9fb0b5" },
  { key: "none",     label: "ない",           color: C.warn   },
] as const;
const CONSULT_FIELDS = [
  { key: "consultationHealth"  as const, label: "体調・健康のこと" },
  { key: "consultationWork"    as const, label: "仕事や働き方のこと" },
  { key: "consultationFamily"  as const, label: "家庭・生活の負担のこと" },
  { key: "consultationMental"  as const, label: "気持ちや心の落ち込み" },
];
const DAY_SEGS = [
  { key: "1-5",  label: "1〜5日",  color: "#e7edee" },
  { key: "6-15", label: "6〜15日", color: "#bcd6d1" },
  { key: "16-25",label: "16〜25日",color: C.warn2   },
  { key: "26+",  label: "26日以上",color: C.warn    },
] as const;
const FREQ_SEGS = [
  { key: "0",   label: "0回",     color: "#e7edee" },
  { key: "1-2", label: "1〜2回",  color: "#bcd6d1" },
  { key: "3-4", label: "3〜4回",  color: C.warn2   },
  { key: "5+",  label: "5回以上", color: C.warn    },
] as const;
const K6_SEGS = [
  { key: "0-4",  label: "0〜4点（低リスク）",  color: "#e7edee" },
  { key: "5-9",  label: "5〜9点（中リスク）",  color: "#bcd6d1" },
  { key: "10-12",label: "10〜12点（高リスク）",color: C.warn2   },
  { key: "13+",  label: "13点以上（要支援）",   color: C.warn    },
] as const;

type BRows = SurveyResponse[] | undefined;

/* ════════════════════════════════════════════════════════════
 * 問6: 体の不調（有症状率 + 症状別ダンベル）
 * ════════════════════════════════════════════════════════════ */
function Q6Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizeSymptoms(rows);
  const b = base ? summarizeSymptoms(base) : undefined;
  if (d.total === 0) return <QCard qno="問6" title="この1か月の体の不調"><NoData /></QCard>;

  const top = Object.entries(d.counts)
    .filter(([k]) => k !== "none")
    .sort((a, x) => x[1] - a[1])
    .slice(0, 6);

  return (
    <QCard qno="問6" title="この1か月の体の不調">
      <BigArrow
        label="何らかの不調がある人の割合"
        base={b ? fP(b.withAnyRate) : undefined}
        current={fP(d.withAnyRate)}
        goodDir="decrease"
      />
      <div className="mt-4 space-y-0.5">
        {top.map(([key, count]) => (
          <DumbbellRow
            key={key}
            label={CONDITION_LABELS[key] ?? key}
            basePct={b ? (b.total > 0 ? (b.counts[key] ?? 0) / b.total * 100 : 0) : undefined}
            currentPct={d.total > 0 ? count / d.total * 100 : 0}
          />
        ))}
      </div>
      {b && <CompareLegend />}
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問7: 主な不調（有症状者が母数）
 * ════════════════════════════════════════════════════════════ */
function Q7Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizePrimaryCondition(rows);
  const b = base ? summarizePrimaryCondition(base) : undefined;
  if (d.total === 0) return <QCard qno="問7" title="いちばん仕事に影響している不調"><NoData /></QCard>;

  const top = Object.entries(d.counts).sort((a, x) => x[1] - a[1]).slice(0, 6);

  return (
    <QCard qno="問7" title="いちばん仕事に影響している不調">
      <p className="mb-3 text-[12px] text-slate-400">※有症状者（n={d.total}）が母数</p>
      <div className="space-y-3">
        {top.map(([key, count]) => (
          <BeforeAfterBars
            key={key}
            label={CONDITION_LABELS[key] ?? key}
            baseRate={b && b.total > 0 ? (b.counts[key] ?? 0) / b.total : undefined}
            baseDisplay={b && b.total > 0 ? fPct(b.counts[key] ?? 0, b.total) : undefined}
            currentRate={d.total > 0 ? count / d.total : 0}
            currentDisplay={fPct(count, d.total)}
          />
        ))}
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問8: 症状日数（BigArrow + 100%積み上げ）
 * ════════════════════════════════════════════════════════════ */
function Q8Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizeQqDetail(rows);
  const b = base ? summarizeQqDetail(base) : undefined;
  if (d.total === 0) return <QCard qno="問8" title="症状があった日数"><NoData /></QCard>;

  const stackRows: StackRow[] = [];
  if (b && b.total > 0) stackRows.push({ tag: "前回", data: b.dayBuckets as unknown as Record<string,number>, total: b.total });
  stackRows.push({ tag: b ? "今回" : "", data: d.dayBuckets as unknown as Record<string,number>, total: d.total });

  return (
    <QCard qno="問8" title="症状があった日数">
      <BigArrow
        label="平均日数（直近30日間）"
        base={b ? `${b.avgDays.toFixed(1)}日` : undefined}
        current={`${d.avgDays.toFixed(1)}日`}
        unit="日"
        goodDir="decrease"
      />
      <div className="mt-4">
        <Stacked100 rows={stackRows} segments={DAY_SEGS as unknown as Segment[]} />
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問9: 欠勤（BigArrow × 2）
 * ════════════════════════════════════════════════════════════ */
function Q9Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizeQqDetail(rows);
  const b = base ? summarizeQqDetail(base) : undefined;
  if (d.total === 0) return <QCard qno="問9" title="症状で仕事を休んだ日数"><NoData /></QCard>;

  return (
    <QCard qno="問9" title="症状で仕事を休んだ日数">
      <div className="space-y-3">
        <BigArrow
          label="平均欠勤日数（過去1年）"
          base={b ? `${b.avgAbsent.toFixed(1)}日` : undefined}
          current={`${d.avgAbsent.toFixed(1)}日`}
          unit="日"
          goodDir="decrease"
        />
        <BigArrow
          label="欠勤ゼロ（0日）の人の割合"
          base={b ? fP(b.zeroAbsentRate) : undefined}
          current={fP(d.zeroAbsentRate)}
          goodDir="increase"
        />
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問10・11: 仕事量・質（BeforeAfterBars × 2）
 * ════════════════════════════════════════════════════════════ */
function Q10Q11Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizeQqDetail(rows);
  const b = base ? summarizeQqDetail(base) : undefined;
  if (d.total === 0) return <QCard qno="問10・11" title="症状があるときの仕事量・仕事の質"><NoData /></QCard>;

  return (
    <QCard qno="問10・11" title="症状があるときの仕事量・仕事の質">
      <p className="mb-3 text-[12px] text-slate-400">平均スコア（0〜10点）</p>
      <div className="space-y-4">
        <BeforeAfterBars
          label="問10：仕事量"
          baseRate={b ? b.avgWorkQty / 10 : undefined}
          baseDisplay={b ? `${b.avgWorkQty.toFixed(1)}` : undefined}
          currentRate={d.avgWorkQty / 10}
          currentDisplay={`${d.avgWorkQty.toFixed(1)}`}
        />
        <BeforeAfterBars
          label="問11：仕事の質"
          baseRate={b ? b.avgWorkQual / 10 : undefined}
          baseDisplay={b ? `${b.avgWorkQual.toFixed(1)}` : undefined}
          currentRate={d.avgWorkQual / 10}
          currentDisplay={`${d.avgWorkQual.toFixed(1)}`}
          color={C.brand2}
        />
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問12: 利用した所（BigArrow + BeforeAfterBars）
 * ════════════════════════════════════════════════════════════ */
function Q12Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizeTreatment(rows);
  const b = base ? summarizeTreatment(base) : undefined;
  if (d.total === 0) return <QCard qno="問12" title="利用した所"><NoData /></QCard>;

  return (
    <QCard qno="問12" title="利用した所">
      <BigArrow
        label="医療・施術の利用あり"
        base={b ? fP(b.withTreatmentRate) : undefined}
        current={fP(d.withTreatmentRate)}
        goodDir="decrease"
      />
      <div className="mt-4 space-y-3">
        {Object.entries(TREATMENT_LABELS).map(([key, label]) => (
          <BeforeAfterBars
            key={key}
            label={label}
            baseRate={b ? (b.total > 0 ? (b.treatmentCounts[key] ?? 0) / b.total : 0) : undefined}
            baseDisplay={b ? fPct(b.treatmentCounts[key] ?? 0, b.total) : undefined}
            currentRate={d.total > 0 ? (d.treatmentCounts[key] ?? 0) / d.total : 0}
            currentDisplay={fPct(d.treatmentCounts[key] ?? 0, d.total)}
          />
        ))}
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問13: 利用回数（100%積み上げ）
 * ════════════════════════════════════════════════════════════ */
function Q13Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizeTreatment(rows);
  const b = base ? summarizeTreatment(base) : undefined;
  if (d.total === 0) return <QCard qno="問13" title="利用回数"><NoData /></QCard>;

  const stackRows: StackRow[] = [];
  if (b && b.total > 0) stackRows.push({ tag: "前回", data: b.freqBuckets as unknown as Record<string,number>, total: b.total });
  stackRows.push({ tag: b ? "今回" : "", data: d.freqBuckets as unknown as Record<string,number>, total: d.total });

  return (
    <QCard qno="問13" title="利用回数（月あたり）">
      <Stacked100 rows={stackRows} segments={FREQ_SEGS as unknown as Segment[]} />
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問14: 日常的に使っているもの（ダンベル）
 * ════════════════════════════════════════════════════════════ */
function Q14Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizeTreatment(rows);
  const b = base ? summarizeTreatment(base) : undefined;
  if (d.total === 0) return <QCard qno="問14" title="日常的に使っているもの"><NoData /></QCard>;

  return (
    <QCard qno="問14" title="日常的に使っているもの">
      <div className="space-y-0.5">
        {Object.entries(DAILY_ITEM_LABELS).map(([key, label]) => (
          <DumbbellRow
            key={key}
            label={label}
            basePct={b ? (b.total > 0 ? (b.dailyItemCounts[key] ?? 0) / b.total * 100 : 0) : undefined}
            currentPct={d.total > 0 ? (d.dailyItemCounts[key] ?? 0) / d.total * 100 : 0}
          />
        ))}
      </div>
      {b && <CompareLegend />}
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問15: 相談先（4分野 × 100%積み上げ）
 * ════════════════════════════════════════════════════════════ */
function Q15Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizeConsultation(rows);
  const b = base ? summarizeConsultation(base) : undefined;
  if (d.total === 0) return <QCard qno="問15" title="困ったときの相談先"><NoData /></QCard>;

  return (
    <QCard qno="問15" title="困ったときの相談先">
      <div className="space-y-5">
        {CONSULT_FIELDS.map(({ key, label }) => {
          const stackRows: StackRow[] = [];
          if (b && b.total > 0) stackRows.push({ tag: "前回", data: b.counts[key] as Record<string,number>, total: b.total });
          stackRows.push({ tag: b ? "今回" : "", data: d.counts[key] as Record<string,number>, total: d.total });
          return (
            <div key={key}>
              <p className="text-[12.5px] font-medium text-slate-600 mb-1.5">{label}</p>
              <Stacked100 rows={stackRows} segments={CONSULT_SEGS as unknown as Segment[]} />
            </div>
          );
        })}
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問16: 専門家支援意向（BigArrow + 100%積み上げ）
 * ════════════════════════════════════════════════════════════ */
function Q16Card({ rows, base }: { rows: SurveyResponse[]; base?: SurveyResponse[] }) {
  const d = summarizeConsultation(rows);
  const b = base ? summarizeConsultation(base) : undefined;
  if (d.total === 0) return <QCard qno="問16" title="専門家の支援を利用したいか"><NoData /></QCard>;

  const forwardRate = d.total > 0 ? (d.expertCounts.want + d.expertCounts.interested) / d.total : 0;
  const bForwardRate = b && b.total > 0 ? (b.expertCounts.want + b.expertCounts.interested) / b.total : undefined;

  const stackRows: StackRow[] = [];
  if (b && b.total > 0) stackRows.push({ tag: "前回", data: b.expertCounts as unknown as Record<string,number>, total: b.total });
  stackRows.push({ tag: b ? "今回" : "", data: d.expertCounts as unknown as Record<string,number>, total: d.total });

  return (
    <QCard qno="問16" title="専門家の支援を利用したいか">
      <BigArrow
        label="前向き（利用したい＋興味あり）"
        base={bForwardRate !== undefined ? fP(bForwardRate) : undefined}
        current={fP(forwardRate)}
        goodDir="increase"
      />
      <div className="mt-4">
        <Stacked100 rows={stackRows} segments={EXPERT_LABELS as unknown as Segment[]} />
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問17: 心の健康 K6（BigArrow × 2 + ヒストグラム）
 * ════════════════════════════════════════════════════════════ */
function Q17Card({ mental, baseMental }: { mental: MentalHealthRow[]; baseMental?: MentalHealthRow[] }) {
  const d = summarizeMentalHealth(mental);
  const b = baseMental ? summarizeMentalHealth(baseMental) : undefined;
  if (d.total === 0) return <QCard qno="問17" title="心の健康（K6）"><NoData /></QCard>;

  const labels = ["0〜4点", "5〜9点", "10〜12点", "13点以上"];
  const bucketKeys: Array<keyof typeof d.buckets> = ["0-4", "5-9", "10-12", "13+"];

  return (
    <QCard qno="問17" title="心の健康（K6）">
      <div className="space-y-2">
        <BigArrow
          label="5点以上（軽度以上の可能性）"
          base={b ? fP(b.atLeast5Rate) : undefined}
          current={fP(d.atLeast5Rate)}
          goodDir="decrease"
        />
        <BigArrow
          label="13点以上（強い状態の可能性）"
          base={b ? fP(b.atLeast13Rate) : undefined}
          current={fP(d.atLeast13Rate)}
          goodDir="decrease"
        />
      </div>
      <div className="mt-4">
        <HistogramBars
          labels={labels}
          baseCounts={b ? bucketKeys.map((k) => b.buckets[k]) : undefined}
          currentCounts={bucketKeys.map((k) => d.buckets[k])}
          baseTotal={b?.total}
          currentTotal={d.total}
        />
        {b && <CompareLegend />}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11.5px]" style={{ color: C.muted }}>
          {K6_SEGS.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />{s.label}
            </span>
          ))}
        </div>
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問18: 会社のサポート POS（BigArrow + BeforeAfterBars × 4）
 * ════════════════════════════════════════════════════════════ */
const POS_ITEM_LABELS = [
  "能力を発揮できるよう支援してくれる",
  "意見を大切にしてくれる",
  "ウェルビーイングを大切にしてくれる",
  "仕事への満足を気にかけてくれる",
];

function Q18Card({ support, baseSupport }: { support: CompanySupportRow[]; baseSupport?: CompanySupportRow[] }) {
  const d = summarizeCompanySupport(support);
  const b = baseSupport ? summarizeCompanySupport(baseSupport) : undefined;
  if (d.total === 0) return <QCard qno="問18" title="会社のサポート（POS）"><NoData /></QCard>;

  return (
    <QCard qno="問18" title="会社のサポート（POS）">
      <BigArrow
        label="総合POSスコア（平均、1〜7点）"
        base={b ? `${b.overallAvg.toFixed(2)}点` : undefined}
        current={`${d.overallAvg.toFixed(2)}点`}
        unit="点"
        goodDir="increase"
      />
      <div className="mt-4 space-y-3">
        {POS_ITEM_LABELS.map((label, i) => (
          <BeforeAfterBars
            key={i}
            label={label}
            baseRate={b ? (b.itemAvgs[i] - 1) / 6 : undefined}
            baseDisplay={b ? `${b.itemAvgs[i].toFixed(2)}` : undefined}
            currentRate={(d.itemAvgs[i] - 1) / 6}
            currentDisplay={`${d.itemAvgs[i].toFixed(2)}`}
          />
        ))}
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問19: 役割負担（BigArrow + 100%積み上げ）
 * ════════════════════════════════════════════════════════════ */
function Q19Card({ workLife, baseWorkLife }: { workLife: WorkLifeRow[]; baseWorkLife?: WorkLifeRow[] }) {
  const d = summarizeWorkLife(workLife);
  const b = baseWorkLife ? summarizeWorkLife(baseWorkLife) : undefined;
  if (d.total === 0) return <QCard qno="問19" title="仕事以外の役割による影響"><NoData /></QCard>;

  const stackRows: StackRow[] = [];
  if (b && b.total > 0) stackRows.push({ tag: "前回", data: b.impactCounts as unknown as Record<string,number>, total: b.total });
  stackRows.push({ tag: b ? "今回" : "", data: d.impactCounts as unknown as Record<string,number>, total: d.total });

  return (
    <QCard qno="問19" title="仕事以外の役割による影響">
      <BigArrow
        label="「ときどきある」以上の割合"
        base={b ? fP(b.hasImpactRate) : undefined}
        current={fP(d.hasImpactRate)}
        goodDir="decrease"
      />
      <div className="mt-4">
        <Stacked100 rows={stackRows} segments={ROLE_SEGS as unknown as Segment[]} />
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問20: 支援希望（BigArrow + 100%積み上げ）
 * ════════════════════════════════════════════════════════════ */
function Q20Card({ workLife, baseWorkLife }: { workLife: WorkLifeRow[]; baseWorkLife?: WorkLifeRow[] }) {
  const d = summarizeWorkLife(workLife);
  const b = baseWorkLife ? summarizeWorkLife(baseWorkLife) : undefined;
  const hasDesire = d.supportCounts.want + d.supportCounts.conditional + d.supportCounts.not_needed;
  if (hasDesire === 0) return <QCard qno="問20" title="負担についての支援希望"><NoData /></QCard>;

  const wantRate = hasDesire > 0 ? d.supportCounts.want / hasDesire : 0;
  const bWantRate = b ? (b.supportCounts.want + b.supportCounts.conditional + b.supportCounts.not_needed > 0 ? b.supportCounts.want / (b.supportCounts.want + b.supportCounts.conditional + b.supportCounts.not_needed) : 0) : undefined;

  const toData = (sc: typeof d.supportCounts) => ({ want: sc.want, conditional: sc.conditional, not_needed: sc.not_needed });
  const cTotal = d.supportCounts.want + d.supportCounts.conditional + d.supportCounts.not_needed;
  const bTotal = b ? b.supportCounts.want + b.supportCounts.conditional + b.supportCounts.not_needed : 0;

  const stackRows: StackRow[] = [];
  if (b && bTotal > 0) stackRows.push({ tag: "前回", data: toData(b.supportCounts), total: bTotal });
  stackRows.push({ tag: b ? "今回" : "", data: toData(d.supportCounts), total: cTotal });

  return (
    <QCard qno="問20" title="負担についての支援希望">
      <BigArrow
        label="情報提供・相談を「希望する」"
        base={bWantRate !== undefined ? fP(bWantRate) : undefined}
        current={fP(wantRate)}
        goodDir="increase"
      />
      <div className="mt-4">
        <Stacked100 rows={stackRows} segments={SUPPORT_SEGS as unknown as Segment[]} />
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問21: 運動習慣（BigArrow + BeforeAfterBars）
 * ════════════════════════════════════════════════════════════ */
function Q21Card({ exercise, baseExercise }: { exercise: ExerciseRow[]; baseExercise?: ExerciseRow[] }) {
  const d = summarizeExercise(exercise);
  const b = baseExercise ? summarizeExercise(baseExercise) : undefined;
  if (d.total === 0) return <QCard qno="問21" title="運動の習慣"><NoData /></QCard>;

  return (
    <QCard qno="問21" title="運動の習慣">
      <BigArrow
        label="「運動を習慣的にしている」割合"
        base={b ? fP(b.exerciseRate) : undefined}
        current={fP(d.exerciseRate)}
        goodDir="increase"
      />
      <div className="mt-4">
        <BeforeAfterBars
          label="習慣的に運動している人"
          baseRate={b?.exerciseRate}
          baseDisplay={b ? fP(b.exerciseRate) : undefined}
          currentRate={d.exerciseRate}
          currentDisplay={fP(d.exerciseRate)}
          color={C.brand}
        />
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * 問22: 運動頻度（BigArrow + ヒストグラム）
 * ════════════════════════════════════════════════════════════ */
function Q22Card({ exercise, baseExercise }: { exercise: ExerciseRow[]; baseExercise?: ExerciseRow[] }) {
  const d = summarizeExercise(exercise);
  const b = baseExercise ? summarizeExercise(baseExercise) : undefined;
  if (d.exerciseCount === 0) return <QCard qno="問22" title="運動の頻度"><NoData /></QCard>;

  const dayKeys = ["1", "2", "3", "4", "5+"];
  const dayLabels = ["週1日", "週2日", "週3日", "週4日", "週5日+"];

  return (
    <QCard qno="問22" title="運動の頻度（週あたり日数）">
      <BigArrow
        label="週あたり平均日数"
        base={b && b.exerciseCount > 0 ? `${b.avgDays.toFixed(1)}日` : undefined}
        current={`${d.avgDays.toFixed(1)}日`}
        unit="日"
        goodDir="increase"
      />
      <div className="mt-4">
        <HistogramBars
          labels={dayLabels}
          baseCounts={b && b.exerciseCount > 0 ? dayKeys.map((k) => b.daysBuckets[k] ?? 0) : undefined}
          currentCounts={dayKeys.map((k) => d.daysBuckets[k] ?? 0)}
          baseTotal={b?.exerciseCount}
          currentTotal={d.exerciseCount}
        />
        {b && <CompareLegend />}
      </div>
    </QCard>
  );
}

/* ════════════════════════════════════════════════════════════
 * メインコンポーネント
 * ════════════════════════════════════════════════════════════ */
export function SurveyResultsSections({
  rows, baseRows, secondPart, baseSecondPart,
}: {
  rows: SurveyResponse[];
  baseRows?: SurveyResponse[];
  secondPart: SecondPartData;
  baseSecondPart?: SecondPartData;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-2">
      <SecHead>体の不調について <span className="text-[13px] font-normal text-slate-400 ml-1">── 問6〜11</span></SecHead>
      <Q6Card    rows={rows} base={baseRows} />
      <Q7Card    rows={rows} base={baseRows} />
      <Q8Card    rows={rows} base={baseRows} />
      <Q9Card    rows={rows} base={baseRows} />
      <Q10Q11Card rows={rows} base={baseRows} />

      <SecHead>対処行動 <span className="text-[13px] font-normal text-slate-400 ml-1">── 問12〜14</span></SecHead>
      <Q12Card rows={rows} base={baseRows} />
      <Q13Card rows={rows} base={baseRows} />
      <Q14Card rows={rows} base={baseRows} />

      <SecHead>相談先と専門家 <span className="text-[13px] font-normal text-slate-400 ml-1">── 問15〜16</span></SecHead>
      <Q15Card rows={rows} base={baseRows} />
      <Q16Card rows={rows} base={baseRows} />

      <SecHead>心の健康 <span className="text-[13px] font-normal text-slate-400 ml-1">── 問17（K6）</span></SecHead>
      <Q17Card mental={secondPart.mental} baseMental={baseSecondPart?.mental} />

      <SecHead>会社のサポート <span className="text-[13px] font-normal text-slate-400 ml-1">── 問18（POS）</span></SecHead>
      <Q18Card support={secondPart.support} baseSupport={baseSecondPart?.support} />

      <SecHead>仕事以外の負担・運動 <span className="text-[13px] font-normal text-slate-400 ml-1">── 問19〜22</span></SecHead>
      <Q19Card workLife={secondPart.workLife} baseWorkLife={baseSecondPart?.workLife} />
      <Q20Card workLife={secondPart.workLife} baseWorkLife={baseSecondPart?.workLife} />
      <Q21Card exercise={secondPart.exercise} baseExercise={baseSecondPart?.exercise} />
      <Q22Card exercise={secondPart.exercise} baseExercise={baseSecondPart?.exercise} />
    </div>
  );
}
