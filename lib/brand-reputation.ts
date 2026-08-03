import "server-only";
import clientPromise from "@/lib/mongodb";

export type SentimentCounts = {
  positive: number;
  negative: number;
  neutral: number;
};

export type DailySignalDocument = {
  published: string;
  impressions: SentimentCounts;
  volume: SentimentCounts;
};

/**
 * Reads `{from}`–`{to}` (inclusive, `YYYYMMDD` strings) from the org's daily
 * signal collection — one document per day, so this is a plain ranged read,
 * not a fold/rollup. `published` sorts correctly as a plain string index
 * scan because it's a fixed-width, zero-padded `YYYYMMDD` value.
 *
 * Collection is per-org (`{org_id}_daily` inside the `signal` database,
 * same db `lib/settings.ts` already reads from) — see the route handler for
 * the required index this range scan depends on.
 */
export async function getDailyBrandReputation(
  orgId: string,
  from: string,
  to: string,
): Promise<DailySignalDocument[]> {
  const client = await clientPromise;
  const collection = client
    .db("signal")
    .collection<DailySignalDocument>(`${orgId}_daily`);

  return collection
    .aggregate<DailySignalDocument>([
      { $match: { published: { $gte: from, $lte: to } } },
      { $sort: { published: 1 } },
      { $project: { _id: 0, published: 1, impressions: 1, volume: 1 } },
    ])
    .toArray();
}

/** Sums a `SentimentCounts` field (`impressions` or `volume`) across every
 * day in the range — the totals shown alongside the per-day breakdown. */
export function sumSentimentCounts(
  days: DailySignalDocument[],
  field: "impressions" | "volume",
): SentimentCounts {
  return days.reduce(
    (sum, day) => ({
      positive: sum.positive + day[field].positive,
      negative: sum.negative + day[field].negative,
      neutral: sum.neutral + day[field].neutral,
    }),
    { positive: 0, negative: 0, neutral: 0 },
  );
}
