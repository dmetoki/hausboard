"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { StackedBarChart, type StackedBarChartRow } from "@/components/dashboard/stacked-bar-chart";
import { useBrandReputation } from "@/lib/use-brand-reputation";

const TOP_COUNTRIES = 5;

function totalOf(counts: { positive: number; negative: number; neutral: number }) {
  return counts.positive + counts.negative + counts.neutral;
}

export function SentimentByCountryCard({ className }: { className?: string }) {
  const { byCountry, seriesConfig, isLoading, error } = useBrandReputation();

  const data: StackedBarChartRow[] = [...byCountry]
    .sort((a, b) => totalOf(b.impressions) - totalOf(a.impressions))
    .slice(0, TOP_COUNTRIES)
    .map((row) => ({
      label: row.label,
      ...row.impressions,
    }));

  return (
    <ChartCard
      className={className}
      title="Sentiment by Country"
      description="Breakdown by top 5 countries"
      stretch
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
