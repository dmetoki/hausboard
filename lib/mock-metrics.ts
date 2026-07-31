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

export type SentimentPoint = {
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

export type SentimentBySource = {
  label: string;
  positive: number;
  negative: number;
  neutral: number;
};

const SOURCE_TYPES = ["news", "twitter", "blog", "youtube"] as const;

export function generateMockSentimentBySource(
  seed: string,
  scale: number,
): SentimentBySource[] {
  const random = seededRandom(seed);

  return SOURCE_TYPES.map((label) => ({
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
): SentimentBySource[] {
  const random = seededRandom(seed);

  return SENTIMENT_COUNTRIES.map((label) => ({
    label,
    positive: Math.round(random() * scale),
    negative: Math.round(random() * scale * 0.25),
    neutral: Math.round(random() * scale * 0.5),
  }));
}

const SENTIMENT_LEVELS = [
  "negative",
  "slightly-negative",
  "neutral",
  "slightly-positive",
  "positive",
] as const;

const COUNTRY_CODES = [
  { countryCode: "US", countryName: "United States" },
  { countryCode: "GB", countryName: "United Kingdom" },
  { countryCode: "IN", countryName: "India" },
  { countryCode: "BR", countryName: "Brazil" },
  { countryCode: "AU", countryName: "Australia" },
  { countryCode: "CA", countryName: "Canada" },
  { countryCode: "DE", countryName: "Germany" },
  { countryCode: "FR", countryName: "France" },
  { countryCode: "JP", countryName: "Japan" },
  { countryCode: "MX", countryName: "Mexico" },
  { countryCode: "ES", countryName: "Spain" },
  { countryCode: "IT", countryName: "Italy" },
  { countryCode: "NL", countryName: "Netherlands" },
  { countryCode: "SE", countryName: "Sweden" },
  { countryCode: "KR", countryName: "South Korea" },
  { countryCode: "ZA", countryName: "South Africa" },
  { countryCode: "AR", countryName: "Argentina" },
  { countryCode: "NG", countryName: "Nigeria" },
] as const;

export function generateMockCountrySentiments(seed: string) {
  const random = seededRandom(seed);

  return COUNTRY_CODES.map((country) => ({
    ...country,
    sentiment: SENTIMENT_LEVELS[Math.floor(random() * SENTIMENT_LEVELS.length)],
  }));
}

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
  { name: "Ava Sinclair", username: "avasinclair", source: "x" },
  { name: "Marcus Webb", username: "marcuswebb", source: "instagram" },
  { name: "Priya Nair", username: "priyanair", source: "youtube" },
  { name: "Diego Ramos", username: "diegoramos", source: "linkedin" },
  { name: "Yuki Tanaka", username: "yukitanaka", source: "tiktok" },
] as const;

export type SocialUserSeed = {
  id: string;
  name: string;
  username: string;
  followers: number;
  source: (typeof MOCK_USERS)[number]["source"];
  status: "promoter" | "detractor";
};

export function generateMockUsers(seed: string): SocialUserSeed[] {
  const random = seededRandom(seed);

  return MOCK_USERS.map((user, i) => ({
    id: `${seed}-${i}`,
    name: user.name,
    username: user.username,
    source: user.source,
    followers: Math.round(1_000 + random() * 500_000),
    status: random() > 0.3 ? "promoter" : "detractor",
  }));
}

const MOCK_POST_TEXTS = [
  {
    text: "Just tried the new product update and honestly it's a huge improvement over the last version. The onboarding flow feels so much smoother now.",
    source: "x",
    sentiment: "positive",
  },
  {
    text: "Support took three days to respond to a critical billing issue. Really disappointed with how this was handled given how much we pay for this plan.",
    source: "news",
    sentiment: "negative",
  },
  {
    text: "Comparing a few vendors this quarter. Feature set looks solid but pricing is on the higher end compared to competitors in the same space.",
    source: "linkedin",
    sentiment: "neutral",
  },
  {
    text: "The team behind this has been incredibly responsive on feedback. Shipped two of our requested features within a month of us asking.",
    source: "blog",
    sentiment: "positive",
  },
  {
    text: "Outage lasted almost two hours during peak traffic today. Status page wasn't updated until well after customers started reporting it.",
    source: "reddit",
    sentiment: "negative",
  },
] as const;

export type SocialPostSeed = {
  id: string;
  text: string;
  source: (typeof MOCK_POST_TEXTS)[number]["source"];
  impressions: number;
  likes: number;
  sentiment: (typeof MOCK_POST_TEXTS)[number]["sentiment"];
};

export function generateMockPosts(seed: string): SocialPostSeed[] {
  const random = seededRandom(seed);

  return MOCK_POST_TEXTS.map((post, i) => ({
    id: `${seed}-${i}`,
    text: post.text,
    source: post.source,
    sentiment: post.sentiment,
    impressions: Math.round(1_000 + random() * 2_000_000),
    likes: Math.round(10 + random() * 5_000),
  }));
}

// ISO 3166-1 numeric codes — matches the `id` field on each feature in the
// world-atlas topology `WorldMap` renders.
const MOCK_COUNTRIES = [
  { id: "840", label: "United States" },
  { id: "826", label: "United Kingdom" },
  { id: "124", label: "Canada" },
  { id: "036", label: "Australia" },
  { id: "276", label: "Germany" },
  { id: "250", label: "France" },
  { id: "076", label: "Brazil" },
  { id: "356", label: "India" },
  { id: "392", label: "Japan" },
  { id: "484", label: "Mexico" },
] as const;

export function generateMockCountryMentions(seed: string) {
  const random = seededRandom(seed);

  return MOCK_COUNTRIES.map((country) => ({
    ...country,
    value: Math.round(500 + random() * 50_000),
  }));
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
