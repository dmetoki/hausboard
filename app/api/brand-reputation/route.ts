import { auth } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { getBrandReputation } from "@/lib/brand-reputation";
import type { MirrorAreaChartSeries } from "@/components/dashboard/mirror-area-chart";

// Sentiment is a fixed, status-style palette (green/red/gray) rather than the
// generic --chart-1..5 categorical ramp — see the dataviz skill notes on
// status colors in app/globals.css.
const SENTIMENT_SERIES: MirrorAreaChartSeries[] = [
  { field: "positive", label: "Positive", color: "var(--chart-positive)" },
  { field: "negative", label: "Negative", color: "var(--chart-negative)" },
  { field: "neutral", label: "Neutral", color: "var(--chart-neutral)" },
];

const DATE_PATTERN = /^\d{8}$/;

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && DATE_PATTERN.test(value);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const { orgId: sessionOrgId } = await auth();
  // Dev-only convenience: lets Postman/curl exercise this route without
  // replicating Clerk session cookies. Strictly gated so a client-supplied
  // org_id can never substitute for a real session in production.
  const devOrgId =
    process.env.NODE_ENV !== "production" ? body?.org_id : undefined;
  const orgId = sessionOrgId ?? devOrgId;

  if (!orgId) {
    return NextResponse.json({ error: "No active organization" }, { status: 401 });
  }

  const from = body?.date_range?.from;
  const to = body?.date_range?.to;

  if (!isValidDate(from) || !isValidDate(to) || from > to) {
    return NextResponse.json(
      { error: "date_range.from and date_range.to are required as YYYYMMDD strings, with from <= to" },
      { status: 400 },
    );
  }

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
  });
}
