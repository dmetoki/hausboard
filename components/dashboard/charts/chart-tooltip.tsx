import type { MirrorAreaChartSeries } from "@/components/dashboard/charts/mirror-area-chart";
import { formatCompactNumber } from "@/lib/utils";

export function ChartTooltip({
  active,
  label,
  value,
  color,
  keyShape = "dot",
}: {
  active?: boolean;
  label?: string;
  value?: number;
  color?: string;
  keyShape?: "dot" | "line";
}) {
  if (!active || value === undefined) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      {color && (
        <span
          className={
            keyShape === "line"
              ? "h-0.5 w-3 shrink-0 rounded-full"
              : "size-2 shrink-0"
          }
          style={{ backgroundColor: color }}
        />
      )}
      <span className="font-semibold text-popover-foreground">
        {formatCompactNumber(value)}
      </span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </div>
  );
}

/**
 * One row per series that has a value in `payload`, matched by `dataKey` —
 * the part shared by every multi-series tooltip in the dashboard (mirror
 * area chart, stacked bar chart). Callers own their own wrapper/header, since
 * those differ (e.g. a date + icon header vs. a plain category label).
 */
export function SeriesTooltipRows({
  series,
  payload,
}: {
  series: MirrorAreaChartSeries[];
  payload?: readonly { dataKey?: unknown; value?: unknown }[];
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {series.map(({ field, label, color }) => {
        const entry = payload?.find((item) => item.dataKey === field);
        if (!entry || typeof entry.value !== "number") return null;
        return (
          <div key={field} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 shrink-0" style={{ backgroundColor: color }} />
              {label}
            </span>
            <span className="font-semibold text-popover-foreground">
              {formatCompactNumber(entry.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
