import "server-only";
import clientPromise from "@/lib/mongodb";

type AuthorStatus = "promoter" | "detractor";

export type AuthorRow = {
  id: string;
  name: string;
  username: string;
  channel: string;
  followers: number;
  status: AuthorStatus;
  /** News-channel authors don't have one. */
  profileImageUrl?: string;
};

type DedupedAuthor = {
  _id: string;
  name: string;
  username: string;
  channel: string;
  followers: number;
  profile_image_url?: string | null;
};

type JoinedAuthor = DedupedAuthor & { score: number };

function statusFromScore(score: number): AuthorStatus {
  return score >= 0 ? "promoter" : "detractor";
}

function authorRowFromJoined(doc: JoinedAuthor): AuthorRow {
  return {
    id: doc._id,
    name: doc.name,
    username: doc.username,
    channel: doc.channel,
    followers: doc.followers,
    status: statusFromScore(doc.score),
    profileImageUrl: doc.profile_image_url ?? undefined,
  };
}

/**
 * Reads the org's top authors (by follower count) for `{from}`–`{to}`
 * (inclusive `YYYYMMDD` strings) from the org's own mentions collection
 * (`{org_id}`, unsuffixed — same per-mention schema as `{org_id}_legacy`,
 * but with `author` embedded per post): matches the date range, dedupes to
 * one row per `author.id` (`$group`, first-write-wins per field — author
 * profile fields don't change within a period), then joins each deduped
 * author against `author_assessments` for this org's sentiment score.
 *
 * Unlike the global `authors` collection, every channel here (including
 * LinkedIn) consistently uses `author.followers_count` — no field-name
 * fallback needed.
 *
 * Requires a `{ published: 1 }` index on `{org_id}` for the range scan, and
 * ideally `{ author_id: 1 }` on `author_assessments` for the `$lookup`.
 */
export async function getTopAuthors(
  orgId: string,
  from: string,
  to: string,
  limit: number,
): Promise<AuthorRow[]> {
  const client = await clientPromise;
  const db = client.db("signal");
  const collection = db.collection(orgId);

  const results = await collection
    .aggregate<JoinedAuthor>([
      { $match: { published: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: "$author.id",
          name: { $first: "$author.name" },
          // News-channel authors often have no handle — falls back to the
          // author id (a domain, e.g. "clarin.com") rather than rendering
          // the literal string "null" after the `@` in `UserList`.
          username: { $first: { $ifNull: ["$author.username", "$author.id"] } },
          channel: { $first: "$channel" },
          followers: { $first: { $ifNull: ["$author.followers_count", 0] } },
          profile_image_url: { $first: "$author.profile_image_url" },
        },
      },
      {
        $lookup: {
          from: "author_assessments",
          localField: "_id",
          foreignField: "author_id",
          as: "assessment_doc",
        },
      },
      { $unwind: "$assessment_doc" },
      { $unwind: "$assessment_doc.assessment" },
      { $match: { "assessment_doc.assessment.org_id": orgId } },
      { $addFields: { score: "$assessment_doc.assessment.sentiment.score" } },
      { $sort: { followers: -1 } },
      { $limit: limit },
      {
        $project: {
          name: 1,
          username: 1,
          channel: 1,
          followers: 1,
          profile_image_url: 1,
          score: 1,
        },
      },
    ])
    .toArray();

  return results.map(authorRowFromJoined);
}
