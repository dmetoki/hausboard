"use client";

import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";

export type DonutSlice = {
  label: string;
  value: number;
  /** Name of a CSS variable declared in globals.css, e.g. "--chart-1". */
  fill: string;
};

export function DonutChart({ data }: { data: DonutSlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              const slice = payload?.[0];
              const rawFill =
                (slice?.payload as DonutSlice | undefined)?.fill ??
                slice?.fill ??
                slice?.color;
              const color = rawFill?.startsWith("--")
                ? `var(${rawFill})`
                : rawFill;
              return (
                <ChartTooltip
                  active={active}
                  label={typeof slice?.name === "string" ? slice.name : undefined}
                  value={typeof slice?.value === "number" ? slice.value : undefined}
                  color={color}
                />
              );
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="65%"
            outerRadius="100%"
            stroke="none"
          >
            {data.map((slice) => (
              <Cell key={slice.label} fill={`var(${slice.fill})`} />
            ))}
            <Label
              content={({ viewBox }) => {
                if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                  return null;
                }
                const centerY = (viewBox.cy ?? 0) - 8;
                return (
                  <text
                    x={viewBox.cx}
                    y={centerY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={centerY}
                      className="fill-foreground text-[1.7rem] font-semibold"
                    >
                      {total}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={centerY + 24}
                      className="fill-muted-foreground text-xs"
                    >
                      total
                    </tspan>
                  </text>
                );
              }}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
