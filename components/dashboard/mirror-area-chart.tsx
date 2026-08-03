"use client";

import { format, parseISO } from "date-fns";
import { useId, useMemo, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SeriesTooltipRows } from "@/components/dashboard/chart-tooltip";
import { compactNumberFormatter } from "@/lib/utils";

/** One row of data — must include `xKey` plus a numeric value for every
 * `series[].field`. Not typed stricter than this so callers can pass whatever
 * shape their series config expects. */
export type MirrorAreaChartPoint = Record<string, string | number>;

export type MirrorAreaChartSeries = {
  /** Property name to read off each `MirrorAreaChartPoint` for this series. */
  field: string;
  label: string;
  /** Any valid CSS color, e.g. `var(--chart-positive)`. */
  color: string;
};

const Y_AXIS_WIDTH = 44;
const HALF_HEIGHT = 130;
const AXIS_HEIGHT = 28;
const CHART_MARGIN = { top: 4, right: 0, left: 8, bottom: 4 };
const DATE_TICK_STEP = 2;

function defaultFormatXTick(value: string) {
  return format(parseISO(value), "MMM d");
}

/** Non-zero ticks only — the tick at the domain floor sits right at the
 * shared axis seam and would draw a CartesianGrid line on top of it. */
function niceTicksExcludingZero(
  data: MirrorAreaChartPoint[],
  series: MirrorAreaChartSeries[],
) {
  const max = Math.max(
    1,
    ...data.flatMap((point) =>
      series.map(({ field }) => Number(point[field]) || 0),
    ),
  );
  return [0.25, 0.5, 0.75, 1].map((fraction) => Math.round(max * fraction));
}

/** Every 2nd index, never the first (collides with the y-axis label column)
 * or the last (right at the edge, where the label overflows past the chart
 * boundary and reads as misaligned). */
function pickTickIndices(length: number, step = DATE_TICK_STEP) {
  const indices = new Set<number>();
  for (let i = step; i < length - 1; i += step) {
    indices.add(i);
  }
  return indices;
}

/** Renders each x-axis tick vertically centered in the shared axis row
 * (independent of Recharts' own line-relative tick offset), for only the
 * indices in `visibleIndices` (see `pickTickIndices`). */
function makeAxisTick(
  visibleIndices: Set<number>,
  formatXTick: (value: string) => string,
) {
  return function AxisTick({
    x,
    payload,
    index,
  }: {
    x?: string | number;
    payload?: { value: string };
    index?: number;
  }) {
    if (x === undefined || !payload || index === undefined || !visibleIndices.has(index)) {
      return null;
    }
    return (
      <text
        x={x}
        y={AXIS_HEIGHT / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fill="var(--muted-foreground)"
      >
        {formatXTick(payload.value)}
      </text>
    );
  };
}

function MirrorTooltip({
  active,
  label,
  series,
  seriesName,
  seriesIcon,
  formatXTick,
  payload,
}: {
  active?: boolean;
  label?: string;
  series: MirrorAreaChartSeries[];
  seriesName?: string;
  seriesIcon?: ReactNode;
  formatXTick: (value: string) => string;
  payload?: readonly { dataKey?: unknown; value?: unknown }[];
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[180px] rounded-md border border-border bg-popover px-2.5 pt-3 pb-1.5 text-[11px] shadow-md">
      <div className="mb-2.5 flex items-center gap-1.5">
        {seriesIcon}
        {seriesName && (
          <span className="font-medium text-popover-foreground">
            {seriesName}
          </span>
        )}
        <span className="font-normal text-muted-foreground">
          · {label ? formatXTick(label) : label}
        </span>
      </div>
      <SeriesTooltipRows series={series} payload={payload} />
    </div>
  );
}

function MirrorHalf({
  data,
  series,
  xKey,
  formatXTick,
  reversed,
  seriesName,
  seriesIcon,
  syncId,
}: {
  data: MirrorAreaChartPoint[];
  series: MirrorAreaChartSeries[];
  xKey: string;
  formatXTick: (value: string) => string;
  reversed?: boolean;
  seriesName?: string;
  seriesIcon?: ReactNode;
  syncId: string;
}) {
  const gradientSuffix = reversed ? "bottom" : "top";
  const ticks = useMemo(
    () => niceTicksExcludingZero(data, series),
    [data, series],
  );

  return (
    <div style={{ height: HALF_HEIGHT }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN} syncId={syncId}>
          <defs>
            {series.map(({ field, color }) => (
              <linearGradient
                key={field}
                id={`mirror-${field}-${gradientSuffix}`}
                x1="0"
                y1={reversed ? "1" : "0"}
                x2="0"
                y2={reversed ? "0" : "1"}
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.1} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            vertical={false}
            horizontalValues={ticks}
            stroke="var(--border)"
            strokeOpacity={0.5}
          />
          <XAxis dataKey={xKey} hide />
          <YAxis
            orientation="right"
            reversed={reversed}
            width={Y_AXIS_WIDTH}
            ticks={ticks}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => compactNumberFormatter.format(value)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={(props) => (
              <MirrorTooltip
                active={props.active}
                label={typeof props.label === "string" ? props.label : undefined}
                series={series}
                seriesName={seriesName}
                seriesIcon={seriesIcon}
                formatXTick={formatXTick}
                payload={props.payload}
              />
            )}
          />
          {series.map(({ field, color }) => (
            <Area
              key={field}
              type="monotone"
              dataKey={field}
              stroke={color}
              strokeWidth={2}
              fill={`url(#mirror-${field}-${gradientSuffix})`}
              dot={false}
              activeDot={{ r: 3, stroke: "none" }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * The shared x-axis row between the two mirrored halves. A separate mini
 * chart (same data/margins/y-axis width as the two real charts, so its tick
 * positions land exactly where the real data points do) with no series of
 * its own — just the x-axis. Framed by CSS borders instead of Recharts'
 * axis line so the gap above and below the tick text is identical by
 * construction (equal padding), not dependent on Recharts' own tick-margin
 * math duplicated across two independent chart instances.
 */
function MirrorAxis({
  data,
  series,
  xKey,
  formatXTick,
}: {
  data: MirrorAreaChartPoint[];
  series: MirrorAreaChartSeries[];
  xKey: string;
  formatXTick: (value: string) => string;
}) {
  // Recharts keys custom tick rendering by component identity — a factory
  // called inline in JSX would create a new component (and force a full
  // remount of every tick) on every render, so it's memoized here instead.
  const AxisTick = useMemo(
    () => makeAxisTick(pickTickIndices(data.length), formatXTick),
    [data.length, formatXTick],
  );

  return (
    <div className="border-y border-border" style={{ height: AXIS_HEIGHT }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ ...CHART_MARGIN, top: 0, bottom: 0 }}>
          <XAxis
            dataKey={xKey}
            height={AXIS_HEIGHT}
            interval={0}
            tickLine={false}
            axisLine={false}
            tick={AxisTick}
          />
          {/* Not `hide` — Recharts excludes a hidden axis from the plot-offset
              calculation entirely, which would shift this chart's plot area
              (and every tick x-position) left relative to the two real
              charts' non-hidden y-axis. Same reserved width, just no visible
              line/ticks. */}
          <YAxis
            orientation="right"
            width={Y_AXIS_WIDTH}
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          {/* Invisible — present only so this chart's category scale gets the
              same point padding the two real charts get from their Area
              series, keeping tick x-positions aligned with the real data. */}
          <Area dataKey={series[0]?.field} stroke="none" fill="none" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Two area charts sharing an x-axis, the bottom mirrored vertically
 * (reversed y-axis) so it grows downward from the seam. `top` and `bottom`
 * must cover the same x sequence. `topLabel`/`bottomLabel` identify each
 * half in its tooltip (next to the x value) rather than as a visible chart
 * title. `series` describes every line drawn in *both* halves (field, label,
 * color) — the component itself carries no domain-specific knowledge (no
 * fixed field names, colors, or labels), so it can plot any pair of
 * multi-series time-indexed datasets.
 */
export function MirrorAreaChart({
  top,
  bottom,
  series,
  xKey = "date",
  formatXTick = defaultFormatXTick,
  topLabel,
  bottomLabel,
  topIcon,
  bottomIcon,
}: {
  top: MirrorAreaChartPoint[];
  bottom: MirrorAreaChartPoint[];
  series: MirrorAreaChartSeries[];
  /** Field name shared by every data point for the x-axis. */
  xKey?: string;
  /** Formats a raw x value for display on the axis and in tooltips. */
  formatXTick?: (value: string) => string;
  topLabel?: string;
  bottomLabel?: string;
  topIcon?: ReactNode;
  bottomIcon?: ReactNode;
}) {
  const syncId = useId();

  return (
    <div className="flex flex-col">
      <MirrorHalf
        data={top}
        series={series}
        xKey={xKey}
        formatXTick={formatXTick}
        seriesName={topLabel}
        seriesIcon={topIcon}
        syncId={syncId}
      />
      <MirrorAxis data={top} series={series} xKey={xKey} formatXTick={formatXTick} />
      <MirrorHalf
        data={bottom}
        series={series}
        xKey={xKey}
        formatXTick={formatXTick}
        reversed
        seriesName={bottomLabel}
        seriesIcon={bottomIcon}
        syncId={syncId}
      />
    </div>
  );
}
