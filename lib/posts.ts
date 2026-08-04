import "server-only";
import clientPromise from "@/lib/mongodb";

type PostSentiment = "positive" | "negative" | "neutral";

export type PostRow = {
  id: string;
  text: string;
  author: string;
  /** Raw channel value as stored (e.g. "twitter", "youtube") — display-icon
   * mapping happens client-side, not here. */
  channel: string;
  sentiment: PostSentiment;
  sentiment_score: number;
  impressions: number;
  /** `YYYYMMDD`, same convention as the daily signal collection. */
  published: string;
  url: string;
};

export type PostsSortField = "date" | "sentiment" | "impressions";

type PostsQuery = {
  orgId: string;
  from: string;
  to: string;
  page: number;
  pageSize: number;
  sortBy: PostsSortField;
  sortOrder: "asc" | "desc";
  search: string;
  /** Empty means "no filter", not "match nothing". */
  sentiments: string[];
  channels: string[];
};

type PaginatedPosts = {
  posts: PostRow[];
  totalCount: number;
};

const SORT_FIELD_PATHS: Record<PostsSortField, string> = {
  date: "published",
  sentiment: "sentiment.score",
  impressions: "public_metrics.impression_count",
};

type PostDocument = {
  _id: unknown;
  text: string;
  author: { name: string };
  channel: string;
  sentiment: { classification: PostSentiment; score: number };
  public_metrics: { impression_count: number };
  published: string;
  url: string;
};

function postRowFromDocument(doc: PostDocument): PostRow {
  return {
    id: String(doc._id),
    text: doc.text,
    author: doc.author?.name ?? "Unknown",
    channel: doc.channel,
    sentiment: doc.sentiment?.classification ?? "neutral",
    sentiment_score: doc.sentiment?.score ?? 0,
    impressions: doc.public_metrics?.impression_count ?? 0,
    published: doc.published,
    url: doc.url,
  };
}

/**
 * Reads a page of posts from the org's legacy mentions collection
 * (`{org_id}_legacy`), filtered to `{from}`–`{to}` (inclusive `YYYYMMDD`
 * strings) plus optional sentiment/channel/search filters, sorted and
 * paginated server-side. One `$facet` aggregation returns both the page of
 * rows and the total matching count in a single round trip.
 *
 * Requires a `{ published: 1 }` index for the range scan, and ideally a text
 * index on `text` if search becomes a hot path (currently a `$regex` scan
 * over whatever the date/sentiment/channel filters already narrowed down to).
 */
export async function getPosts(query: PostsQuery): Promise<PaginatedPosts> {
  const client = await clientPromise;
  const collection = client
    .db("signal")
    .collection<PostDocument>(`${query.orgId}_legacy`);

  const match: Record<string, unknown> = {
    published: { $gte: query.from, $lte: query.to },
  };
  if (query.sentiments.length > 0) {
    match["sentiment.classification"] = { $in: query.sentiments };
  }
  if (query.channels.length > 0) {
    match.channel = { $in: query.channels };
  }
  const search = query.search.trim();
  if (search) {
    match.text = { $regex: search, $options: "i" };
  }

  const skip = query.page * query.pageSize;
  const sortPath = SORT_FIELD_PATHS[query.sortBy];
  const sortDirection = query.sortOrder === "asc" ? 1 : -1;

  const [result] = await collection
    .aggregate<{ posts: PostDocument[]; total: { count: number }[] }>([
      { $match: match },
      {
        $facet: {
          posts: [
            { $sort: { [sortPath]: sortDirection } },
            { $skip: skip },
            { $limit: query.pageSize },
          ],
          total: [{ $count: "count" }],
        },
      },
    ])
    .toArray();

  return {
    posts: result.posts.map(postRowFromDocument),
    totalCount: result.total[0]?.count ?? 0,
  };
}
