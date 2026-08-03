import type { SocialUser } from "@/components/dashboard/user-list";
import type { SocialPost } from "@/components/dashboard/post-list";
import type { PostTableRow } from "@/components/posts/columns";
import { COUNTRY_CODES, titleCaseFromKebab } from "@/lib/utils";

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
