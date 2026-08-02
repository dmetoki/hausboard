import type { SocialUser } from "@/components/dashboard/user-list";
import type { SocialPost } from "@/components/dashboard/post-list";
import type { CountryValue } from "@/components/dashboard/world-map";
import type { CountryScore } from "@/components/dashboard/country-score-list";
import type { PostTableRow } from "@/components/posts/columns";
import { titleCaseFromKebab } from "@/lib/utils";

export type MetricPoint = {
  label: string;
  value: number;
};

// Deterministic (not Math.random()) so server-rendered mock data matches
// what the client receives as a prop — avoids hydration mismatches.
function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return function next() {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

export function generateMockSeries(seed: string, points = 12): MetricPoint[] {
  const random = seededRandom(seed);
  let value = 40 + random() * 40;

  return Array.from({ length: points }, (_, i) => {
    value = Math.max(5, value + (random() - 0.45) * 15);
    return {
      label: `Day ${i + 1}`,
      value: Math.round(value),
    };
  });
}

export function generateMockDistribution(
  seed: string,
  labels: readonly string[],
): Array<{ label: string; value: number }> {
  const random = seededRandom(seed);
  return labels.map((label) => ({
    label,
    value: Math.round(10 + random() * 90),
  }));
}

type SentimentPoint = {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
};

export function generateMockSentimentSeries(
  seed: string,
  scale: number,
  points = 12,
): SentimentPoint[] {
  const random = seededRandom(seed);
  const start = new Date(2026, 5, 1);

  return Array.from({ length: points }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const positive = Math.round(random() * scale);
    const negative = Math.round(random() * scale * 0.3);
    const neutral = Math.round(random() * scale * 0.5);

    return {
      date: date.toISOString().slice(0, 10),
      positive,
      negative,
      neutral,
    };
  });
}

type SentimentBreakdown = {
  label: string;
  positive: number;
  negative: number;
  neutral: number;
};

const CHANNEL_TYPES = ["news", "twitter", "blog", "youtube"] as const;

export function generateMockSentimentByChannel(
  seed: string,
  scale: number,
): SentimentBreakdown[] {
  const random = seededRandom(seed);

  return CHANNEL_TYPES.map((label) => ({
    label,
    positive: Math.round(random() * scale),
    negative: Math.round(random() * scale * 0.25),
    neutral: Math.round(random() * scale * 0.5),
  }));
}

const SENTIMENT_COUNTRIES = [
  "United States",
  "United Kingdom",
  "India",
  "Brazil",
  "Australia",
] as const;

export function generateMockSentimentByCountry(
  seed: string,
  scale: number,
): SentimentBreakdown[] {
  const random = seededRandom(seed);

  return SENTIMENT_COUNTRIES.map((label) => ({
    label,
    positive: Math.round(random() * scale),
    negative: Math.round(random() * scale * 0.25),
    neutral: Math.round(random() * scale * 0.5),
  }));
}

// `numericId` is the ISO 3166-1 NUMERIC code for the same country — matches
// the `id` field on each feature in the world-atlas topology `WorldMap`
// renders, which has no alpha-2 field of its own to match against.
const COUNTRY_CODES = [
  { countryCode: "US", countryName: "United States", numericId: "840" },
  { countryCode: "GB", countryName: "United Kingdom", numericId: "826" },
  { countryCode: "IN", countryName: "India", numericId: "356" },
  { countryCode: "BR", countryName: "Brazil", numericId: "076" },
  { countryCode: "AU", countryName: "Australia", numericId: "036" },
  { countryCode: "CA", countryName: "Canada", numericId: "124" },
  { countryCode: "DE", countryName: "Germany", numericId: "276" },
  { countryCode: "FR", countryName: "France", numericId: "250" },
  { countryCode: "JP", countryName: "Japan", numericId: "392" },
  { countryCode: "MX", countryName: "Mexico", numericId: "484" },
  { countryCode: "ES", countryName: "Spain", numericId: "724" },
  { countryCode: "IT", countryName: "Italy", numericId: "380" },
  { countryCode: "NL", countryName: "Netherlands", numericId: "528" },
  { countryCode: "SE", countryName: "Sweden", numericId: "752" },
  { countryCode: "KR", countryName: "South Korea", numericId: "410" },
  { countryCode: "ZA", countryName: "South Africa", numericId: "710" },
  { countryCode: "AR", countryName: "Argentina", numericId: "032" },
  { countryCode: "NG", countryName: "Nigeria", numericId: "566" },
] as const;

export const DASHBOARD_METRICS = [
  "Revenue",
  "Active Users",
  "New Signups",
] as const;

export const METRIC_SUBTITLES: Record<
  (typeof DASHBOARD_METRICS)[number],
  string
> = {
  Revenue: "Total revenue this period",
  "Active Users": "Unique users this period",
  "New Signups": "New accounts created",
};

const MOCK_USERS = [
  { name: "Ava Sinclair", username: "avasinclair", channel: "x" },
  { name: "Marcus Webb", username: "marcuswebb", channel: "instagram" },
  { name: "Priya Nair", username: "priyanair", channel: "youtube" },
  { name: "Diego Ramos", username: "diegoramos", channel: "linkedin" },
  { name: "Yuki Tanaka", username: "yukitanaka", channel: "tiktok" },
] as const;

export function generateMockUsers(seed: string): SocialUser[] {
  const random = seededRandom(seed);

  return MOCK_USERS.map((user, i) => {
    const status = random() > 0.3 ? "promoter" : "detractor";
    return {
      id: `${seed}-${i}`,
      name: user.name,
      username: user.username,
      channel: user.channel,
      followers: Math.round(1_000 + random() * 500_000),
      status,
      statusLabel: titleCaseFromKebab(status),
    };
  });
}

const MOCK_POST_TEXTS = [
  {
    text: "Just tried the new product update and honestly it's a huge improvement over the last version. The onboarding flow feels so much smoother now.",
    channel: "x",
    sentiment: "positive",
  },
  {
    text: "Support took three days to respond to a critical billing issue. Really disappointed with how this was handled given how much we pay for this plan.",
    channel: "news",
    sentiment: "negative",
  },
  {
    text: "Comparing a few vendors this quarter. Feature set looks solid but pricing is on the higher end compared to competitors in the same space.",
    channel: "linkedin",
    sentiment: "neutral",
  },
  {
    text: "The team behind this has been incredibly responsive on feedback. Shipped two of our requested features within a month of us asking.",
    channel: "blog",
    sentiment: "positive",
  },
  {
    text: "Outage lasted almost two hours during peak traffic today. Status page wasn't updated until well after customers started reporting it.",
    channel: "reddit",
    sentiment: "negative",
  },
] as const;

export function generateMockPosts(seed: string): SocialPost[] {
  const random = seededRandom(seed);

  return MOCK_POST_TEXTS.map((post, i) => ({
    id: `${seed}-${i}`,
    text: post.text,
    channel: post.channel,
    sentiment: post.sentiment,
    sentimentLabel: titleCaseFromKebab(post.sentiment),
    impressions: Math.round(1_000 + random() * 2_000_000),
    likes: Math.round(10 + random() * 5_000),
  }));
}

// A larger pool for the posts table (pagination/sorting need more than the
// 5 curated posts above) — cycles the same `MOCK_POST_TEXTS` templates,
// varying the numbers per row so rows aren't literal duplicates.
export function generateMockPostsTable(seed: string, count: number): PostTableRow[] {
  const random = seededRandom(seed);
  const start = new Date(2026, 5, 1);

  return Array.from({ length: count }, (_, i) => {
    const post = MOCK_POST_TEXTS[i % MOCK_POST_TEXTS.length];
    const author = MOCK_USERS[i % MOCK_USERS.length];
    const country = COUNTRY_CODES[i % COUNTRY_CODES.length];
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    return {
      id: `${seed}-${i}`,
      text: post.text,
      author: author.name,
      countryCode: country.countryCode,
      countryName: country.countryName,
      channel: post.channel,
      sentiment: post.sentiment,
      sentimentLabel: titleCaseFromKebab(post.sentiment),
      impressions: Math.round(1_000 + random() * 2_000_000),
      date: date.toISOString().slice(0, 10),
    };
  });
}

const POSTS_TABLE_SIZE = 60;

export type PostsQuery = {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search: string;
  /** Empty/omitted means "no filter", not "match nothing". */
  sentiments?: string[];
  channels?: string[];
};

export type PaginatedPosts = {
  posts: PostTableRow[];
  totalCount: number;
};

// The seam a real backend would replace — same query shape a real paginated
// endpoint would take, same `{ posts, totalCount }` response shape, and a
// real `await` (simulated latency) so callers can't accidentally depend on
// this resolving synchronously.
export async function fetchMockPosts(query: PostsQuery): Promise<PaginatedPosts> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const all = generateMockPostsTable("posts-table", POSTS_TABLE_SIZE);
  const search = query.search.trim().toLowerCase();
  const filtered = all.filter((post) => {
    if (search && !post.text.toLowerCase().includes(search)) return false;
    if (query.sentiments?.length && !query.sentiments.includes(post.sentiment)) return false;
    if (query.channels?.length && !query.channels.includes(post.channel)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const left = a[query.sortBy as keyof PostTableRow];
    const right = b[query.sortBy as keyof PostTableRow];
    const direction = query.sortOrder === "asc" ? 1 : -1;

    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * direction;
    }
    if (typeof left === "string" && typeof right === "string") {
      return left.localeCompare(right) * direction;
    }
    return 0;
  });

  const start = query.page * query.pageSize;
  return {
    posts: sorted.slice(start, start + query.pageSize),
    totalCount: sorted.length,
  };
}

// Shape of the (eventual) real "mentions by country" API response — each
// country's raw sentiment breakdown, alpha-2 coded. `mentions` is always the
// sum of the other three; not stored separately by the source, just derived.
type CountrySentimentBreakdown = {
  id: string; // ISO 3166-1 alpha-2, e.g. "AR"
  label: string;
  positive: number;
  neutral: number;
  negative: number;
  mentions: number;
};

export function generateMockCountrySentimentBreakdown(
  seed: string,
): CountrySentimentBreakdown[] {
  const random = seededRandom(seed);

  return COUNTRY_CODES.map(({ countryCode, countryName }) => {
    const positive = Math.round(random() * 500);
    const neutral = Math.round(random() * 200);
    const negative = Math.round(random() * 150);

    return {
      id: countryCode,
      label: countryName,
      positive,
      neutral,
      negative,
      mentions: positive + neutral + negative,
    };
  });
}

const NUMERIC_ID_BY_COUNTRY_CODE: Record<string, string> = Object.fromEntries(
  COUNTRY_CODES.map(({ countryCode, numericId }) => [countryCode, numericId]),
);

// The one place this breakdown's positive/negative counts turn into a
// diverging status score — both adapters below derive their score from this,
// so `WorldMap` and `CountryScoreList` always agree on the same country.
function scoreFromBreakdown(row: CountrySentimentBreakdown): number {
  const diff = row.positive - row.negative;
  return diff < 0 ? -5 : diff > 0 ? 5 : 0;
}

function scoreLabelFromScore(score: number): string {
  return score < 0 ? "Negative" : score > 0 ? "Positive" : "Neutral";
}

// Turns the raw by-country breakdown into what `WorldMap` actually renders:
// a diverging status score (not a magnitude) plus the numeric country id its
// topology needs instead of alpha-2. Countries with no known numeric id are
// dropped rather than rendered with a made-up id.
export function worldMapDataFromCountryBreakdown(
  rows: CountrySentimentBreakdown[],
): CountryValue[] {
  return rows.flatMap((row) => {
    const numericId = NUMERIC_ID_BY_COUNTRY_CODE[row.id];
    if (!numericId) return [];

    return [
      { id: numericId, label: row.label, score: scoreFromBreakdown(row), mentions: row.mentions },
    ];
  });
}

// Same breakdown, adapted for `CountryScoreList` instead — same score rule
// as `worldMapDataFromCountryBreakdown`, so both cards reflect one payload.
export function countryScoreListDataFromCountryBreakdown(
  rows: CountrySentimentBreakdown[],
): CountryScore[] {
  return rows.map((row) => {
    const score = scoreFromBreakdown(row);
    return {
      countryCode: row.id,
      countryName: row.label,
      score,
      scoreLabel: scoreLabelFromScore(score),
    };
  });
}

export const MOCK_NARRATIVE_SUMMARY =
  "Sentiment stayed largely positive across the period, driven by strong " +
  "engagement on X and Instagram following the product update announcement. " +
  "Negative mentions clustered around a single support-response complaint " +
  "that spread on News and Reddit mid-period but faded within a few days. " +
  "Volume dipped briefly around the outage report before recovering to " +
  "above-average levels by period end, with impressions concentrated among " +
  "a small group of high-follower authors rather than broad organic reach.";

export const HIGHLIGHT_METRICS = [
  { label: "Impressions", value: "12.4M" },
  { label: "Volume", value: "3,482" },
  { label: "Engagement", value: "8.6%" },
  { label: "Unique Authors", value: "1,204" },
] as const;

export type NotificationSeed = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
};

export const MOCK_NOTIFICATIONS: NotificationSeed[] = [
  {
    id: "1",
    title: "Spike in mentions",
    description: "Mentions from India increased 34% over the last 24 hours.",
    time: "5m ago",
    read: false,
  },
  {
    id: "2",
    title: "Weekly report ready",
    description: "Your sentiment summary for last week is available.",
    time: "2h ago",
    read: false,
  },
  {
    id: "3",
    title: "New comment on your post",
    description: "Someone replied to your recent mention on X.",
    time: "5h ago",
    read: true,
  },
  {
    id: "4",
    title: "New team member",
    description: "Jordan Lee joined your organization.",
    time: "1d ago",
    read: true,
  },
];
