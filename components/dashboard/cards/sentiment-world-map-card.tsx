"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { WorldMap, type CountryValue } from "@/components/dashboard/charts/world-map";
import { useBrandReputation } from "@/lib/use-brand-reputation";
import { countryNameFromCode, numericIdFromCountryCode } from "@/lib/utils";

export function SentimentWorldMapCard({ className }: { className?: string }) {
  const { byCountry, isLoading, error } = useBrandReputation();

  // Color comes from the sentiment average, not the volume — `mentions` only
  // drives the hover tooltip's count, per the same split `WorldMap` already
  // documents on `CountryValue`.
  const data: CountryValue[] = byCountry.flatMap((row) => {
    const id = numericIdFromCountryCode(row.label);
    if (!id) return [];

    const mentions = row.volume.positive + row.volume.negative + row.volume.neutral;
    return [
      {
        id,
        countryCode: row.label,
        label: countryNameFromCode(row.label),
        score: row.avg_sentiment,
        mentions,
      },
    ];
  });

  return (
    <ChartCard
      className={className}
      title="Posts by Country"
      description="Where this period's posts came from"
    >
      {error ? (
        <p className="text-sm text-muted-foreground">Failed to load sentiment data.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <WorldMap data={data} />
      )}
    </ChartCard>
  );
}
