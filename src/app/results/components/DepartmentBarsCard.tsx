import { niceCeil } from "./designTokens";

export function LegendAmountRow({
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

export function HorizontalBars({
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
