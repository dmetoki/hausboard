"use client";

import { useState } from "react";
import useSWR from "swr";
import type { MirrorAreaChartSeries } from "@/components/dashboard/charts/mirror-area-chart";
import type {
  BreakdownTotal,
  CountryBreakdownTotal,
  DailyPoint,
  SentimentCounts,
} from "@/lib/brand-reputation";
import { useFilters } from "@/context/filters-context";

type BrandReputationResponse = {
  by_date: DailyPoint[];
  series_config: MirrorAreaChartSeries[];
  impressions: SentimentCounts;
  volume: SentimentCounts;
  by_country: CountryBreakdownTotal[];
  by_channel: BreakdownTotal[];
  engagement_rate: number;
  unique_authors: number;
};

function toCompactDate(isoDate: string) {
  return isoDate.replaceAll("-", "");
}

async function fetcher([, from, to]: [string, string, string]) {
  const res = await fetch("/api/brand-reputation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date_range: { from, to } }),
  });
  if (!res.ok) throw new Error(`Failed to load brand reputation data (${res.status})`);
  return res.json() as Promise<BrandReputationResponse>;
}

export function useBrandReputation() {
  const { filters } = useFilters();

  // The date range picker sets `from` alone while a selection is in
  // progress (before the user has clicked an end date) — during that
  // window `filters.to` is undefined. Querying on that partial state
  // would null out the SWR key and drop the chart back to its loading
  // placeholder, so the last *complete* range is held onto until a new
  // complete one is picked.
  const completeRange =
    filters?.from && filters?.to
      ? { from: filters.from, to: filters.to }
      : undefined;
  const [range, setRange] = useState(completeRange);
  // Adjusting state during render (React's sanctioned pattern for "derive
  // from props, but skip stale intermediate values") instead of an effect —
  // this updates before paint, so there's no extra render with the old range.
  if (
    completeRange &&
    (completeRange.from !== range?.from || completeRange.to !== range?.to)
  ) {
    setRange(completeRange);
  }

  const from = range ? toCompactDate(range.from) : undefined;
  const to = range ? toCompactDate(range.to) : undefined;

  const { data, error, isLoading } = useSWR(
    from && to ? ["/api/brand-reputation", from, to] : null,
    fetcher,
    // Keeps the previous range's data on screen while the new one loads,
    // instead of unmounting the chart to a loading placeholder on every
    // filter change (which was the source of the layout jump).
    { keepPreviousData: true },
  );

  return {
    byDate: data?.by_date ?? [],
    seriesConfig: data?.series_config ?? [],
    impressions: data?.impressions,
    volume: data?.volume,
    byCountry: data?.by_country ?? [],
    byChannel: data?.by_channel ?? [],
    engagementRate: data?.engagement_rate,
    uniqueAuthors: data?.unique_authors,
    // SWR's own `isLoading` isn't patched by `keepPreviousData` — it flips
    // true on every new key (i.e. every date range change) regardless of
    // whether `data` still holds the previous range's result. Gate on `data`
    // being present too, so a range change with stale-but-valid data on
    // screen doesn't get swapped out for a loading placeholder.
    isLoading: isLoading && data === undefined,
    error,
  };
}
