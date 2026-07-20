import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_18px_rgba(15,23,42,0.04)]">
      {children}
    </section>
  );
}

export function AccentTitle({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="inline-block h-4 w-[3px] rounded-full bg-teal-600" />
      {children}
    </span>
  );
}

export function CardHeader({ title }: { title: string }) {
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

export function SelectBox({
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
