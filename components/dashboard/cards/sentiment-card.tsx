"use client";

import { useState } from "react";
import { ChartNoAxesColumn, Layers } from "lucide-react";
import { ChartCard } from "@/components/dashboard/chart-card";
import { MirrorAreaChart, type MirrorAreaChartPoint } from "@/components/dashboard/charts/mirror-area-chart";
import { SentimentPointSheet } from "@/components/dashboard/cards/sentiment-point-sheet";
import { useBrandReputation } from "@/lib/use-brand-reputation";

const SENTIMENT_SUBTITLE = "Positive vs. negative mentions";

function toIsoDate(published: string) {
  return `${published.slice(0, 4)}-${published.slice(4, 6)}-${published.slice(6, 8)}`;
}

export function SentimentCard({ className }: { className?: string }) {
  const { byDate, seriesConfig, isLoading, error } = useBrandReputation();
  const [selectedPoint, setSelectedPoint] = useState<MirrorAreaChartPoint | null>(null);

  const top: MirrorAreaChartPoint[] = byDate.map((day) => ({
    date: toIsoDate(day.published),
    ...day.impressions,
  }));
  const bottom: MirrorAreaChartPoint[] = byDate.map((day) => ({
    date: toIsoDate(day.published),
    ...day.volume,
  }));

  return (
    <ChartCard className={className} title="Sentiment" description={SENTIMENT_SUBTITLE}>
      {error ? (
        <p className="text-sm text-muted-foreground">Failed to load sentiment data.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <MirrorAreaChart
          top={top}
          bottom={bottom}
          series={seriesConfig}
          topLabel="Impressions"
          bottomLabel="Volume"
          topIcon={<ChartNoAxesColumn className="size-3" />}
          bottomIcon={<Layers className="size-3" />}
          onPointClick={setSelectedPoint}
        />
      )}
      <SentimentPointSheet
        point={selectedPoint}
        series={seriesConfig}
        onOpenChange={(open) => {
          if (!open) setSelectedPoint(null);
        }}
      />
    </ChartCard>
  );
}
