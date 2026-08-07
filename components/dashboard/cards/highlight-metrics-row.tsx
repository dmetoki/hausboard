"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { StatHighlight } from "@/components/dashboard/stat-highlight";
import { useBrandReputation } from "@/lib/use-brand-reputation";
import { formatCompactNumber, formatCompactNumberParts } from "@/lib/utils";
import type { SentimentCounts } from "@/lib/brand-reputation";

function sumCounts(counts?: SentimentCounts) {
  if (!counts) return 0;
  return counts.positive + counts.negative + counts.neutral;
}

/** The dashboard's fixed final row of hero-number tiles — every value comes
 * from `useBrandReputation`'s totals (same data every other card on this
 * page already fetches). */
export function HighlightMetricsRow() {
  const { impressions, volume, engagementRate, uniqueAuthors, isLoading, error } =
    useBrandReputation();

  const placeholder = error || isLoading;
  const impressionsParts = formatCompactNumberParts(sumCounts(impressions));

  const highlights = [
    {
      label: "Impressions",
      value: placeholder ? (
        "—"
      ) : (
        <>
          {impressionsParts.number}
          <span className="text-2xl">{impressionsParts.suffix}</span>
        </>
      ),
    },
    { label: "Volume", value: placeholder ? "—" : formatCompactNumber(sumCounts(volume)) },
    {
      label: "Engaged Posts",
      value: placeholder ? (
        "—"
      ) : (
        <>
          {(engagementRate ?? 0).toFixed(1)}
          <span className="text-2xl">%</span>
        </>
      ),
    },
    {
      label: "Avg Unique Authors",
      value: placeholder ? "—" : formatCompactNumber(Math.round(uniqueAuthors ?? 0)),
    },
  ];

  return (
    <>
      {highlights.map((highlight) => (
        <ChartCard key={highlight.label} className="col-span-1" centerContent>
          <StatHighlight value={highlight.value} label={highlight.label} />
        </ChartCard>
      ))}
    </>
  );
}
