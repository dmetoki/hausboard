"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { DonutChart, type DonutSlice } from "@/components/dashboard/donut-chart";
import { useBrandReputation } from "@/lib/use-brand-reputation";
import type { SentimentCounts } from "@/lib/brand-reputation";
import type { MirrorAreaChartSeries } from "@/components/dashboard/mirror-area-chart";

function toDonutSlices(
  counts: SentimentCounts | undefined,
  seriesConfig: MirrorAreaChartSeries[],
): DonutSlice[] {
  if (!counts) return [];
  return seriesConfig.map(({ field, label, color }) => ({
    label,
    value: counts[field as keyof SentimentCounts] ?? 0,
    fill: color.replace(/^var\((.*)\)$/, "$1"),
  }));
}

export function SentimentDonutCard({
  field,
  title,
  description,
  className,
}: {
  field: "impressions" | "volume";
  title: string;
  description: string;
  className?: string;
}) {
  const { seriesConfig, impressions, volume, isLoading, error } = useBrandReputation();
  const counts = field === "impressions" ? impressions : volume;
  const slices = toDonutSlices(counts, seriesConfig);

  return (
    <ChartCard
      className={className}
      title={title}
      description={description}
      centerTitle
      centerContent
    >
      {error ? (
        <p className="text-sm text-muted-foreground">Failed to load sentiment data.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <DonutChart data={slices} />
      )}
    </ChartCard>
  );
}
