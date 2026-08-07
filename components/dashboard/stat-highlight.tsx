import type { ReactNode } from "react";

/**
 * A hero-number stat tile — for a single headline value with no meaningful
 * shape to plot (per the dataviz skill: sometimes the right chart is not a
 * chart). Self-contained: number and its own legend label, since it doesn't
 * rely on `ChartCard`'s title/description header.
 */
export function StatHighlight({
  value,
  label,
}: {
  /** Usually a plain string, but accepts composed JSX (e.g. a smaller
   * trailing unit/suffix) — see callers that split a compact-formatted
   * value into digits + suffix. */
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
      <span className="text-4xl font-semibold text-foreground">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
