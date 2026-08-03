"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MirrorAreaChartSeries } from "@/components/dashboard/mirror-area-chart";
import { SeriesTooltipRows } from "@/components/dashboard/chart-tooltip";
import { compactNumberFormatter } from "@/lib/utils";

/** One row — must include `labelKey` plus a numeric value for every
 * `series[].field`. Same shape convention as `MirrorAreaChart`. */
export type StackedBarChartRow = Record<string, string | number>;

const BAR_THICKNESS = 18;
const ROW_GAP = 18;
const AXIS_HEIGHT = 20;

function StackedBarTooltip({
  active,
  label,
  series,
  payload,
}: {
  active?: boolean;
  label?: string;
  series: MirrorAreaChartSeries[];
  payload?: readonly { dataKey?: unknown; value?: unknown }[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[160px] rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] shadow-md">
      <div className="mb-1.5 font-medium text-popover-foreground capitalize">
        {label}
      </div>
      <SeriesTooltipRows series={series} payload={payload} />
    </div>
  );
}

function StackedBarRow({
  row,
  series,
  labelKey,
  domainMax,
}: {
  row: StackedBarChartRow;
  series: MirrorAreaChartSeries[];
  labelKey: string;
  domainMax: number;
}) {
  return (
    <div className="relative hover:z-10">
      <div className="mb-1 text-xs text-muted-foreground capitalize">
        {row[labelKey]}
      </div>
      <div style={{ height: BAR_THICKNESS }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[row]}
            layout="vertical"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            barSize={BAR_THICKNESS}
          >
            <XAxis type="number" domain={[0, domainMax]} hide />
            {/* `hide` (unlike `MirrorAreaChart`'s axis-alignment fix) is safe
                here: every instance below — each row and the shared axis —
                hides this same category axis identically, so there's no
                offset mismatch between instances to create. */}
            <YAxis type="category" dataKey={labelKey} hide />
            <Tooltip
              cursor={false}
              content={(props) => (
                <StackedBarTooltip
                  active={props.active}
                  label={typeof props.label === "string" ? props.label : undefined}
                  series={series}
                  payload={props.payload}
                />
              )}
            />
            {series.map(({ field, color }) => (
              <Bar key={field} dataKey={field} stackId="stack" fill={color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** A shared numeric scale reference below all rows — one axis, same domain
 * every row's bar was scaled against, so widths stay directly comparable. */
function StackedBarAxis({ domainMax }: { domainMax: number }) {
  return (
    <div style={{ height: AXIS_HEIGHT }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={[{ x: 0 }]}
          layout="vertical"
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, domainMax]}
            orientation="top"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => compactNumberFormatter.format(value)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis type="category" dataKey="x" hide />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * A horizontal stacked bar per category, label above its own bar (not a
 * shared left-hand axis column) with a shared numeric scale reference below
 * all rows. Domain-agnostic like `MirrorAreaChart`: no fixed field names,
 * colors, or labels baked in, so it can plot any labeled rows against any
 * series.
 */
export function StackedBarChart({
  data,
  series,
  labelKey = "label",
}: {
  data: StackedBarChartRow[];
  series: MirrorAreaChartSeries[];
  labelKey?: string;
}) {
  const domainMax = Math.max(
    1,
    ...data.map((row) =>
      series.reduce((sum, { field }) => sum + (Number(row[field]) || 0), 0),
    ),
  );

  return (
    <div
      className="flex h-full flex-col justify-between"
      style={{ gap: ROW_GAP }}
    >
      {data.map((row) => (
        <StackedBarRow
          key={String(row[labelKey])}
          row={row}
          series={series}
          labelKey={labelKey}
          domainMax={domainMax}
        />
      ))}
      <StackedBarAxis domainMax={domainMax} />
    </div>
  );
}
