"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { CountryScoreList, type CountryScore } from "@/components/dashboard/country-score-list";
import { useBrandReputation } from "@/lib/use-brand-reputation";
import { countryNameFromCode, sentimentLabelFromScore } from "@/lib/utils";

export function SentimentCountryScoreCard({ className }: { className?: string }) {
  const { byCountry, isLoading, error } = useBrandReputation();

  const countries: CountryScore[] = byCountry.map((row) => ({
    countryCode: row.label,
    countryName: countryNameFromCode(row.label),
    score: row.avg_sentiment,
    scoreLabel: sentimentLabelFromScore(row.avg_sentiment),
  }));

  return (
    <ChartCard
      className={className}
      title="All Countries"
      description="Sentiment across every monitored country"
    >
      {error ? (
        <p className="text-sm text-muted-foreground">Failed to load sentiment data.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <CountryScoreList countries={countries} />
      )}
    </ChartCard>
  );
}
