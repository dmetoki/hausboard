"use client";

import ReactCountryFlag from "react-country-flag";
import { ChartCard } from "@/components/dashboard/chart-card";
import { StackedBarChart, type StackedBarChartRow } from "@/components/dashboard/charts/stacked-bar-chart";
import { useBrandReputation } from "@/lib/use-brand-reputation";
import { countryNameFromCode } from "@/lib/utils";

const TOP_COUNTRIES = 5;

function totalOf(counts: { positive: number; negative: number; neutral: number }) {
  return counts.positive + counts.negative + counts.neutral;
}

function renderCountryLabel(row: StackedBarChartRow) {
  const countryCode = String(row.countryCode);
  return (
    <>
      <ReactCountryFlag
        countryCode={countryCode}
        svg
        style={{ width: "1em", height: "1em" }}
        aria-label={String(row.label)}
      />
      {row.label}
    </>
  );
}

export function SentimentByCountryCard({ className }: { className?: string }) {
  const { byCountry, seriesConfig, isLoading, error } = useBrandReputation();

  const data: StackedBarChartRow[] = [...byCountry]
    .sort((a, b) => totalOf(b.impressions) - totalOf(a.impressions))
    .slice(0, TOP_COUNTRIES)
    .map((row) => ({
      label: countryNameFromCode(row.label),
      countryCode: row.label,
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
        <StackedBarChart data={data} series={seriesConfig} renderLabel={renderCountryLabel} />
      )}
    </ChartCard>
  );
}
