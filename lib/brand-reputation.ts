import "server-only";
import clientPromise from "@/lib/mongodb";

export type SentimentCounts = {
  positive: number;
  negative: number;
  neutral: number;
};

export type DailyPoint = {
  published: string;
  impressions: SentimentCounts;
  volume: SentimentCounts;
};

export type BreakdownTotal = {
  label: string;
  impressions: SentimentCounts;
  volume: SentimentCounts;
};

/** `avg_sentiment` ranges -5..5 (negative..positive) — average of each
 * matched day's per-country score across the date range. */
export type CountryBreakdownTotal = BreakdownTotal & { avg_sentiment: number };

export type BrandReputationData = {
  byDate: DailyPoint[];
  impressions: SentimentCounts;
  volume: SentimentCounts;
  byCountry: CountryBreakdownTotal[];
  byChannel: BreakdownTotal[];
};

const ZERO_COUNTS: SentimentCounts = { positive: 0, negative: 0, neutral: 0 };

type RawTotalsGroup = {
  impressions_positive: number;
  impressions_negative: number;
  impressions_neutral: number;
  volume_positive: number;
  volume_negative: number;
  volume_neutral: number;
};

type RawBreakdownGroup = RawTotalsGroup & { _id: string; avg_sentiment?: number | null };

type FacetResult = {
  by_date: DailyPoint[];
  totals: RawTotalsGroup[];
  by_country: RawBreakdownGroup[];
  by_channel: RawBreakdownGroup[];
};

function countsFromRawGroup(
  row: RawTotalsGroup,
  metric: "impressions" | "volume",
): SentimentCounts {
  return metric === "impressions"
    ? {
        positive: row.impressions_positive,
        negative: row.impressions_negative,
        neutral: row.impressions_neutral,
      }
    : {
        positive: row.volume_positive,
        negative: row.volume_negative,
        neutral: row.volume_neutral,
      };
}

function breakdownTotalFromRawGroup(row: RawBreakdownGroup): BreakdownTotal {
  return {
    label: row._id,
    impressions: countsFromRawGroup(row, "impressions"),
    volume: countsFromRawGroup(row, "volume"),
  };
}

function countryBreakdownFromRawGroup(row: RawBreakdownGroup): CountryBreakdownTotal {
  return {
    ...breakdownTotalFromRawGroup(row),
    avg_sentiment: row.avg_sentiment ?? 0,
  };
}

/** `$unwind` + `$group`, summing both metrics' positive/negative/neutral per
 * dimension value (country/channel) — shared shape for both breakdowns, both
 * keyed by the same `label` field. A day with no entries for the array field
 * is dropped from that facet branch by `$unwind`'s default behavior, not
 * thrown on. `extraAccumulators` lets the country branch also average
 * `avg_sentiment` without forcing that (channel-less) field onto the channel
 * branch. */
function breakdownFacetStages(
  arrayField: "by_country" | "by_channel",
  extraAccumulators: Record<string, unknown> = {},
) {
  return [
    { $unwind: `$${arrayField}` },
    {
      $group: {
        _id: `$${arrayField}.label`,
        impressions_positive: { $sum: `$${arrayField}.impressions.positive` },
        impressions_negative: { $sum: `$${arrayField}.impressions.negative` },
        impressions_neutral: { $sum: `$${arrayField}.impressions.neutral` },
        volume_positive: { $sum: `$${arrayField}.volume.positive` },
        volume_negative: { $sum: `$${arrayField}.volume.negative` },
        volume_neutral: { $sum: `$${arrayField}.volume.neutral` },
        ...extraAccumulators,
      },
    },
  ];
}

/**
 * Reads `{from}`–`{to}` (inclusive, `YYYYMMDD` strings) from the org's daily
 * signal collection and returns everything the brand-reputation API needs in
 * one round trip: the raw per-day series (for the mirror chart) plus the
 * range's totals and by-country/by-channel breakdowns, all summed inside a
 * single `$facet` aggregation rather than pulled into Node and reduced there
 * — Mongo only ever ships the small, already-aggregated results.
 *
 * `published` sorts correctly as a plain string index scan because it's a
 * fixed-width, zero-padded `YYYYMMDD` value. Collection is per-org
 * (`{org_id}_daily` inside the `signal` database, same db `lib/settings.ts`
 * already reads from) — requires a `{ published: 1 }` index for this range
 * scan to stay efficient.
 */
export async function getBrandReputation(
  orgId: string,
  from: string,
  to: string,
): Promise<BrandReputationData> {
  const client = await clientPromise;
  const collection = client.db("signal").collection(`${orgId}_daily`);

  const [result] = await collection
    .aggregate<FacetResult>(
      [
        { $match: { published: { $gte: from, $lte: to } } },
        {
          $facet: {
            // Only this branch's output is order-sensitive (the mirror
            // chart plots it as a series) — sorting before the `$facet`
            // would sort the other three branches' input for no reason.
            by_date: [
              { $sort: { published: 1 } },
              { $project: { _id: 0, published: 1, impressions: 1, volume: 1 } },
            ],
            totals: [
              {
                $group: {
                  _id: null,
                  impressions_positive: { $sum: "$impressions.positive" },
                  impressions_negative: { $sum: "$impressions.negative" },
                  impressions_neutral: { $sum: "$impressions.neutral" },
                  volume_positive: { $sum: "$volume.positive" },
                  volume_negative: { $sum: "$volume.negative" },
                  volume_neutral: { $sum: "$volume.neutral" },
                },
              },
            ],
            by_country: breakdownFacetStages("by_country", {
              avg_sentiment: { $avg: "$by_country.avg_sentiment" },
            }),
            by_channel: breakdownFacetStages("by_channel"),
          },
        },
      ],
      // `$unwind`+`$group` over a wide date range can exceed the 100MB
      // in-memory per-stage limit — spill to disk instead of failing.
      { allowDiskUse: true },
    )
    .toArray();

  const totals = result.totals[0];

  return {
    byDate: result.by_date,
    impressions: totals ? countsFromRawGroup(totals, "impressions") : ZERO_COUNTS,
    volume: totals ? countsFromRawGroup(totals, "volume") : ZERO_COUNTS,
    byCountry: result.by_country.map(countryBreakdownFromRawGroup),
    byChannel: result.by_channel.map(breakdownTotalFromRawGroup),
  };
}
