"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { StackedBarChart, type StackedBarChartRow } from "@/components/dashboard/stacked-bar-chart";
import { useBrandReputation } from "@/lib/use-brand-reputation";

export function SentimentByChannelCard({ className }: { className?: string }) {
  const { byChannel, seriesConfig, isLoading, error } = useBrandReputation();

  const data: StackedBarChartRow[] = byChannel.map((row) => ({
    label: row.label,
    ...row.impressions,
  }));

  return (
    <ChartCard
      className={className}
      title="Sentiment by Channel"
      description="Breakdown by channel type"
    >
      {error ? (
        <p className="text-sm text-muted-foreground">Failed to load sentiment data.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <StackedBarChart data={data} series={seriesConfig} />
      )}
    </ChartCard>
  );
}
