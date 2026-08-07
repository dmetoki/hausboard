import { NextResponse, type NextRequest } from "next/server";
import { getBrandReputation } from "@/lib/brand-reputation";
import { resolveOrgAndDateRange } from "@/lib/request-org-and-date-range";
import type { MirrorAreaChartSeries } from "@/components/dashboard/charts/mirror-area-chart";

// Sentiment is a fixed, status-style palette (green/red/gray) rather than the
// generic --chart-1..5 categorical ramp — see the dataviz skill notes on
// status colors in app/globals.css.
const SENTIMENT_SERIES: MirrorAreaChartSeries[] = [
  { field: "positive", label: "Positive", color: "var(--chart-positive)" },
  { field: "negative", label: "Negative", color: "var(--chart-negative)" },
  { field: "neutral", label: "Neutral", color: "var(--chart-neutral)" },
];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const resolved = await resolveOrgAndDateRange(body);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { orgId, from, to } = resolved;

  let data;
  try {
    data = await getBrandReputation(orgId, from, to);
  } catch (error) {
    console.error("Failed to load brand reputation data:", error);
    return NextResponse.json(
      { error: "Failed to load brand reputation data" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    by_date: data.byDate,
    series_config: SENTIMENT_SERIES,
    impressions: data.impressions,
    volume: data.volume,
    by_country: data.byCountry,
    by_channel: data.byChannel,
    engagement_rate: data.engagementRate,
    unique_authors: data.uniqueAuthors,
  });
}
