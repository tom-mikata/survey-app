import { LOSS_LEGEND, niceCeil } from "./designTokens";

type DeptRow = { department: string; totalManYen: number; stack: Record<string, number> };

export function StackedDepartmentChart({
  rows,
  baseTotals,
}: {
  rows: DeptRow[];
  baseTotals?: DeptRow[];
}) {
  const allTotals = baseTotals
    ? [...rows.map((r) => r.totalManYen), ...baseTotals.map((r) => r.totalManYen)]
    : rows.map((r) => r.totalManYen);
  const max = Math.max(1, ...allTotals);
  const niceMax = niceCeil(max);
  const ticks = 4;
  const LABEL_W = "7rem";
  const VALUE_W = "5.5rem";

  const axisLabels = (
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
  );

  if (baseTotals) {
    const baseMap = Object.fromEntries(baseTotals.map((r) => [r.department, r]));
    return (
      <div>
        <div className="space-y-4">
          {rows.map((d) => {
            const base = baseMap[d.department];
            const wCurrent = niceMax > 0 ? (d.totalManYen / niceMax) * 100 : 0;
            const wBase = base && niceMax > 0 ? (base.totalManYen / niceMax) * 100 : 0;
            return (
              <div
                key={d.department}
                className="grid items-center gap-3"
                style={{ gridTemplateColumns: `${LABEL_W} 1fr ${VALUE_W}` }}
              >
                <span className="truncate text-sm text-slate-600" title={d.department}>
                  {d.department}
                </span>
                {/* 2本のバーをまとめたコンテナ（グリッド線を共有） */}
                <div className="relative space-y-1 py-0.5">
                  <div className="pointer-events-none absolute inset-0">
                    {Array.from({ length: ticks }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute top-0 bottom-0 border-r border-dashed border-slate-200"
                        style={{ left: `${((i + 1) / ticks) * 100}%` }}
                      />
                    ))}
                  </div>
                  {/* 前回バー（薄い） */}
                  <div className="relative h-3">
                    {wBase > 0 && base && (
                      <div
                        className="absolute inset-y-0 left-0 flex overflow-hidden rounded-[3px]"
                        style={{ width: `${wBase}%` }}
                      >
                        {LOSS_LEGEND.map((L) => {
                          const part = base.stack[L.key] ?? 0;
                          const pw = base.totalManYen > 0 ? (part / base.totalManYen) * 100 : 0;
                          if (pw <= 0) return null;
                          return (
                            <span
                              key={L.key}
                              title={`前回 ${L.label}: ${part.toFixed(1)}万円`}
                              className="h-full opacity-40"
                              style={{ width: `${pw}%`, background: L.color }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* 今回バー */}
                  <div className="relative h-3">
                    {wCurrent > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 flex overflow-hidden rounded-[3px]"
                        style={{ width: `${wCurrent}%` }}
                      >
                        {LOSS_LEGEND.map((L) => {
                          const part = d.stack[L.key] ?? 0;
                          const pw = d.totalManYen > 0 ? (part / d.totalManYen) * 100 : 0;
                          if (pw <= 0) return null;
                          return (
                            <span
                              key={L.key}
                              title={`今回 ${L.label}: ${part.toFixed(1)}万円`}
                              className="h-full"
                              style={{ width: `${pw}%`, background: L.color }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-0.5 text-right">
                  {base && (
                    <p className="text-xs text-slate-400 tabular-nums">
                      {base.totalManYen.toFixed(1)}万円
                    </p>
                  )}
                  <p className="text-sm font-bold text-slate-800 tabular-nums">
                    {d.totalManYen.toFixed(1)}万円
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {axisLabels}
        {/* 前回/今回の凡例 */}
        <div className="mt-2 flex items-center gap-5 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-sm bg-slate-300 opacity-60" />
            前回
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-sm bg-slate-500" />
            今回
          </span>
        </div>
      </div>
    );
  }

  /* シングルモード（比較なし） */
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
      {axisLabels}
    </div>
  );
}
