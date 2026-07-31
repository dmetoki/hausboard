"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MetricPoint } from "@/lib/mock-metrics";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";

export function MiniChart({
  data,
  variant,
  color,
}: {
  data: MetricPoint[];
  variant: "compact" | "full";
  /** Name of a CSS variable declared in globals.css, e.g. "--chart-1". */
  color: string;
}) {
  const height = variant === "full" ? 220 : 96;
  const resolvedColor = `var(${color})`;
  const gradientId = `mini-chart-gradient-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={
            variant === "full"
              ? { top: 8, right: 0, left: 8, bottom: 8 }
              : { top: 4, right: 4, left: 4, bottom: 12 }
          }
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={resolvedColor} stopOpacity={0.1} />
              <stop offset="100%" stopColor={resolvedColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {variant === "full" && (
            <>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeOpacity={0.5}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                orientation="right"
                tickLine={false}
                axisLine={false}
                width={32}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
            </>
          )}
          <Tooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={(props) => {
              const value = props.payload?.[0]?.value;
              return (
                <ChartTooltip
                  active={props.active}
                  label={typeof props.label === "string" ? props.label : undefined}
                  value={typeof value === "number" ? value : undefined}
                  color={resolvedColor}
                  keyShape="line"
                />
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={resolvedColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, stroke: "none" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
