export function MetricRow({
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

export function HalfDonut({
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
