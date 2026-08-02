import { LOSS_LEGEND, niceCeil } from "./designTokens";

export function StackedDepartmentChart({
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
