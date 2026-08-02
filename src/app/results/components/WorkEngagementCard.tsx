import { type CompareTone, compareTone, compareLabel, scoreBandColor } from "./designTokens";

export function ScoreFace({ tone }: { tone: CompareTone }) {
  const fill = tone === "good" ? "#a3d37a" : tone === "bad" ? "#ef5350" : "#f2b75b";
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
      <circle cx="32" cy="32" r="28" fill={fill} />
      {tone === "good" ? (
        <>
          <path
            d="M 20 27 Q 24 22 28 27"
            stroke="#3a2f14"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 36 27 Q 40 22 44 27"
            stroke="#3a2f14"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 22 40 Q 32 50 42 40"
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
            d="M 22 44 Q 32 36 42 44"
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
            d="M 22 42 L 42 42"
            stroke="#3a2f14"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

export function WeScoreCard({
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

export function WeCompareColumn({
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

export function ScoreLegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-3 w-6 rounded" style={{ background: color }} />
      {label}
    </span>
  );
}
