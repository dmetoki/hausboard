This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Dashboard components (`components/dashboard/`)

Split into three tiers by what a component actually does:

```
components/dashboard/
  cards/     data-fetching wrappers: a use*() hook + ChartCard + a chart component
  charts/    pure, props-in/pixels-out visualizations — no data fetching, no ChartCard
  (root)     shared primitives used by both tiers (and elsewhere)
```

Everything in `charts/` is a Recharts- or `react-simple-maps`-based Client
Component with no knowledge of where its data comes from — it takes plain
data via props and renders it. Everything in `cards/` owns the
fetching/shaping (via a `lib/use-*.ts` SWR hook) and wraps the result in
`ChartCard`; the chart itself stays domain-agnostic.

All chart components share the app's chart color tokens declared in
`app/globals.css`:

- `--chart-1` through `--chart-5` — the categorical ramp, for identity series
  (e.g. one metric per card). Assign in fixed order; never cycle or reuse for
  status.
- `--chart-positive` / `--chart-negative` / `--chart-neutral` — a fixed
  status-style palette (green/red/gray), the same hex in light and dark mode,
  never themed. Use these only for a genuine positive/negative/neutral
  semantic (e.g. sentiment), never as a 4th/5th/6th categorical series.

### `ChartCard` (root)

The card shell every chart renders inside. Not chart-specific itself — it just
standardizes title/subtitle/content layout.

```tsx
<ChartCard
  title="Revenue"
  description="Total revenue this period" // optional subtitle
  centerTitle // optional: center the title/subtitle text
  centerContent // optional: vertically center children (e.g. a donut)
  stretch // optional: let children grow to fill extra height the grid row forces on this card
  className="col-span-1" // grid span, passed straight to the Card
>
  {/* one chart component */}
</ChartCard>
```

### `charts/DonutChart` — single categorical breakdown

```ts
type DonutSlice = { label: string; value: number; fill: string };

<DonutChart data={DonutSlice[]} />
```

**Contract:** `fill` is a bare `--chart-*` variable name per slice, not a
resolved color — the component wraps it in `var(...)` itself. The center
label shows the sum of every slice's `value` (via `formatCompactNumberParts`
in `lib/utils.ts`, splitting the digits from the `K`/`M`/`B` suffix so the
suffix can render at a smaller size) — only pass the slices that should count
toward that total.

### `charts/MirrorAreaChart` — two multi-series area charts sharing one x-axis

The one chart component built to be domain-agnostic from the start — it
carries no fixed field names, colors, or labels. `top` and `bottom` each
render as their own multi-series area chart; `bottom` is vertically mirrored
(reversed y-axis, grows downward) so the two form one visual pair around a
shared axis row in the middle.

```ts
type MirrorAreaChartPoint = Record<string, string | number>;
type MirrorAreaChartSeries = { field: string; label: string; color: string };

<MirrorAreaChart
  top: MirrorAreaChartPoint[]
  bottom: MirrorAreaChartPoint[]
  series: MirrorAreaChartSeries[]
  xKey?: string                          // default "date"
  formatXTick?: (value: string) => string // default: parses xKey as ISO and formats "MMM d"
  topLabel?: string                       // shown in top's tooltip, e.g. "Impressions"
  bottomLabel?: string                    // shown in bottom's tooltip, e.g. "Volume"
  topIcon?: ReactNode                     // icon next to topLabel in its tooltip
  bottomIcon?: ReactNode                  // icon next to bottomLabel in its tooltip
  onPointClick?: (point: MirrorAreaChartPoint) => void // fires with the full point for the clicked date, in either half
/>
```

**Contract — read carefully, this is the one place the rules differ from the
other charts:**

- Every object in `top` and `bottom` must have a value for `xKey` (default
  `"date"`) **and** a numeric value for every `series[].field`. Missing
  fields render as gaps in that line.
- `top` and `bottom` must cover the **same `xKey` sequence** (same values, same
  order) — the shared axis row and the y-axis width/margins are computed
  once and reused across both halves for pixel-exact tick alignment. Mismatched
  sequences will misalign the ticks against the data.
- `series[].color` is a **resolved CSS color** (e.g. `"var(--chart-positive)"`),
  not a bare variable name — this component does not wrap it in `var(...)`.
  Passing a bare `"--chart-1"` here will silently fail to render any color.
- The default `formatXTick` assumes `xKey`'s value is an ISO date string
  (`date-fns`'s `parseISO` + `"MMM d"`). Pass your own `formatXTick` if `xKey`
  isn't a date.
- `onPointClick` is wired via Recharts' `onClick`, matched by `activeLabel`
  against `xKey` — **not** by `activeIndex`. Recharts v3's `activeIndex` is
  actually a numeric *string* (`TooltipIndex = string | null`) despite its
  type claiming `number`, so indexing `data[activeIndex]` silently fails;
  matching on the label sidesteps that entirely.

Example (this is how the dashboard's Sentiment card is wired,
`components/dashboard/cards/sentiment-card.tsx`):

```tsx
const SENTIMENT_SERIES: MirrorAreaChartSeries[] = [
  { field: "positive", label: "Positive", color: "var(--chart-positive)" },
  { field: "negative", label: "Negative", color: "var(--chart-negative)" },
  { field: "neutral", label: "Neutral", color: "var(--chart-neutral)" },
];

<MirrorAreaChart
  top={impressionsByDate}   // [{ date: "2026-06-01", positive: 217, negative: 14, neutral: 125 }, ...]
  bottom={volumeByDate}     // same date sequence as `top`
  series={SENTIMENT_SERIES}
  topLabel="Impressions"
  bottomLabel="Volume"
  topIcon={<ChartNoAxesColumn className="size-3" />}
  bottomIcon={<Layers className="size-3" />}
  onPointClick={setSelectedPoint}
/>
```

### `charts/StackedBarChart` — one horizontal stacked bar per category

```ts
type StackedBarChartRow = Record<string, string | number>; // labelKey + one numeric field per series[].field

<StackedBarChart
  data: StackedBarChartRow[]
  series: MirrorAreaChartSeries[] // same shape as MirrorAreaChart's series
  labelKey?: string                // default "label"
  renderLabel?: (row: StackedBarChartRow) => ReactNode // overrides the plain row[labelKey] text, e.g. a flag ahead of the name
/>
```

**Contract:** same series contract as `MirrorAreaChart` — `series[].color` is a
**resolved CSS color**, not a bare variable name. Every row must have a
numeric value for every `series[].field`; a missing field is treated as `0`
in that row's stack, not skipped. Rows are always sorted largest-total-first
internally, regardless of the order `data` arrives in.

### `charts/WorldMap` — choropleth by country

```ts
type CountryValue = {
  id: string;          // ISO 3166-1 NUMERIC code as a string, e.g. "840" for the US
  countryCode: string;  // ISO 3166-1 ALPHA-2, e.g. "US" — a different code system, for the hover tooltip's flag
  label: string;
  score: number;   // sign only: negative < 0, neutral = 0, positive > 0 — NOT a magnitude
  mentions: number; // raw count, shown in the hover tooltip only — plays no part in color
};

<WorldMap data={CountryValue[]} />
```

**Contract:** `id` must be the ISO 3166-1 **numeric** code, not alpha-2/alpha-3
— it's matched directly against the `id` field on each feature in the
`world-atlas` `countries-110m.json` topology. `score` drives the shared
3-color diverging status scale (`statusColorFromScore` in `lib/utils.ts` —
same one `CountryScoreList` uses) by sign, banded the same way
`sentimentLabelFromScore` buckets its "Neutral" label (-1..1, not just
exactly 0); pass a real magnitude in `mentions` instead if you need to show
volume, since that's what the tooltip reads. Countries not present in `data`
still render, shaded as "no data" rather than omitted. Antarctica is always
excluded from render, and the US feature has its Hawaii polygon stripped for
framing purposes — both independent of what `data` contains. The hover
tooltip is portaled to `document.body` and positioned `fixed` (viewport
coordinates), so it isn't clipped by this component's own `overflow-hidden`
(needed to crop the map's empty ocean band) or the card's rounded-corner
clipping.

`lib/utils.ts` provides the alpha-2 ↔ numeric-id / country-name lookups
every real caller needs: `numericIdFromCountryCode` (backed by a small
curated `COUNTRY_CODES` table — only what the map's topology needs ids for)
and `countryNameFromCode` (backed by the built-in `Intl.DisplayNames` API,
so it covers the full ISO 3166-1 set, not just the curated list).
`components/dashboard/cards/sentiment-world-map-card.tsx` shows the intended
real pipeline: one `useBrandReputation()` payload, `numericIdFromCountryCode`
to drop any country the topology can't place, `countryNameFromCode` for the
label. `CountryScoreList` below is fed from the same underlying data, so a
country never renders a different sentiment color in the map than in that
list.

### `charts/CountryScoreList` — scrollable country/score list

```ts
type CountryScore = {
  countryCode: string; // ISO 3166-1 ALPHA-2, e.g. "US" — different code system than WorldMap's `id`
  countryName: string;
  score: number;       // -5..5 — only the sign drives this list's color; see below
  scoreLabel: string;  // display text for `score` — caller-owned, see UserList below
};

<CountryScoreList countries={CountryScore[]} />
```

**Contract:** `countryCode` is alpha-2 (not the numeric code `WorldMap` uses)
— it's passed straight through to `react-country-flag`. `score`'s sign picks
the fill color via the shared `statusColorFromScore` helper (`lib/utils.ts`)
— the same one `WorldMap` uses. The list has a fixed height and scrolls
internally; it does not grow the card to fit `countries.length`.
`components/dashboard/cards/sentiment-country-score-card.tsx` sorts
`countries` alphabetically by `countryName` before rendering — the component
itself doesn't sort.

### `charts/ChartTooltip` — shared tooltip content

`components/dashboard/charts/chart-tooltip.tsx` exports two pieces every
other chart's tooltip is built from:

```ts
<ChartTooltip
  active?: boolean
  label?: string
  value?: number        // formatted through formatCompactNumber before rendering
  color?: string         // a resolved CSS color, e.g. "var(--chart-1)"
  keyShape?: "dot" | "line" // default "dot"
/>

<SeriesTooltipRows
  series: MirrorAreaChartSeries[]
  payload?: readonly { dataKey?: unknown; value?: unknown }[] // Recharts' tooltip payload, matched to series by dataKey === field
/>
```

`DonutChart` uses `ChartTooltip` directly (one value). `MirrorAreaChart` and
`StackedBarChart` both use `SeriesTooltipRows` for their own multi-series
tooltip wrappers, since they need to show every series at once.

### `UserList` (root) — ranked list of social authors

```ts
type SocialUser = {
  id: string;
  name: string;
  username: string;
  followers: number;
  channel: keyof typeof Icons;             // see `Icons`, components/icons.tsx
  status: "promoter" | "detractor";
  statusLabel: string;                     // display text for `status` — caller-owned, see below
  profileImageUrl?: string;                // falls back to `name`'s initials when absent or on load failure
};

<UserList users={SocialUser[]} />
```

**Contract:** `channel` must be a key that exists on `Icons`; falls back to
`Icons.unknown` if not (a real runtime safety net — `channel` may come from
data that doesn't match the compile-time union; `lib/utils.ts`'s
`channelIconKey` does this translation, including e.g. the stored `"twitter"`
value → the `x` icon key, for the platform's rebrand). `status` drives a
fixed status-color badge (promoter → the positive color, detractor → the
negative color) — icon/color are component-owned, but the display text is
not: `statusLabel` is the caller/data layer's wording, rendered as-is.
`Avatar` renders `profileImageUrl` when present; the underlying primitive
falls back to the initials automatically on a missing/failed image.

### `PostList` (root) — recent social posts

```ts
type SocialPost = {
  id: string;
  text: string;
  channel: keyof typeof Icons;
  impressions: number;
  likes: number;
  sentiment: "positive" | "negative" | "neutral";
  sentimentLabel: string;                  // display text for `sentiment` — caller-owned
};

<PostList posts={SocialPost[]} />
```

**Contract:** same `channel`/`Icons` fallback and `sentimentLabel`
caller-owns-the-text contract as `UserList`. `text` is clamped to 2 lines
visually (`line-clamp-2`) — pass the full text, don't pre-truncate it
yourself.

### `StatHighlight` / `NarrativeSummary` (root) — non-chart cards

Not every card is a chart — per the dataviz skill, a single headline number or
free-form prose sometimes beats a chart shape.

```ts
<StatHighlight
  value={ReactNode} // usually a string, but accepts composed JSX — e.g. a smaller trailing K/M/B suffix or "%" sign
  label={string}
/>
<NarrativeSummary text={string} />                // plain prose, no markup applied
```

### `IconBadge` / `StatusBadge` (root) — shared circular icon badges

Not mounted directly in the dashboard grid — `UserList`/`PostList` use these
internally for the channel-platform icon and the sentiment/status icon.

```ts
<IconBadge
  icon: ComponentType<{ className?: string }>
  size?: string      // default "size-5"
  iconSize?: string  // default "size-3"
/>

<StatusBadge
  icon: ComponentType<{ className?: string }>
  color: string      // a --chart-* variable NAME, e.g. "--chart-positive" (wrapped in var() internally)
  label: string
  size?: string      // default "size-5"
  iconSize?: string  // default "size-3"
/>
```

## Brand Reputation section (`app/(app)/brand-reputation/`)

The main dashboard, backed by real MongoDB-backed data throughout — see
[Data sources](#data-sources--mongodb-collections) below for the collections
and required indexes. Every card gets its data from
`useBrandReputation()`/`useTopAuthors()`/`useRecentPosts()`
(`lib/use-brand-reputation.ts`, `lib/use-authors.ts`, `lib/use-posts.ts`),
each an SWR hook that reads the header's date-range picker
(`context/filters-context.tsx`) and holds onto the last *complete* range
while a new selection is in progress, so a chart never flashes back to a
loading state mid-drag on the calendar. `keepPreviousData: true` plus a
patched `isLoading` (SWR's own flag isn't `keepPreviousData`-aware — it
flips `true` on every new key regardless of whether stale-but-valid data is
still on screen) keeps every card visually stable across a range change.

Two cards remain intentionally mock-fed for now (`lib/mock-metrics.ts`):
the "Summary" narrative card and the Inbox page's/header bell's
notifications.

### Point drill-down: `SentimentPointSheet`

Clicking anywhere on the Sentiment card's `MirrorAreaChart` opens
`components/dashboard/cards/sentiment-point-sheet.tsx` — a lateral panel
(`components/ui/sheet.tsx`, see below) showing the clicked date and every
series' value for it, with the existing `Chat` component
(`components/bot/chat.tsx`) underneath as a **static placeholder** (empty
message history, no-op submit) — ready to wire to a real handler.

### `components/ui/sheet.tsx` — lateral panel primitive

Built on the same `@base-ui/react/dialog` primitive `components/ui/dialog.tsx`
wraps — a side panel is really just that Dialog anchored to an edge and
sliding in/out along that axis instead of fading + zooming in place, not a
different underlying primitive.

```tsx
<Sheet open={boolean} onOpenChange={(open: boolean) => void}>
  <SheetContent side="left" | "right" /* default "right" */ showCloseButton={boolean /* default true */}>
    <SheetHeader>
      <SheetTitle>...</SheetTitle>
      <SheetDescription>...</SheetDescription>
    </SheetHeader>
    {/* body content */}
  </SheetContent>
</Sheet>
```

## Posts section (`app/(app)/posts/`) — server-paginated data table

An 80/20 two-card layout (`md:col-span-4` / `md:col-span-1`, the second card
intentionally empty today — reserved for a future ad-hoc filters panel). The
80% card holds `PostsTable` (`components/posts/posts-table.tsx`), built on
`@tanstack/react-table` + `swr` over `components/ui/table.tsx` (shadcn's
plain-`<table>` primitives).

Backed by `POST /api/posts` (`app/api/posts/route.ts`) → `getPosts()`
(`lib/posts.ts`), reading MongoDB's `{org_id}_legacy` collection — see
[Data sources](#data-sources--mongodb-collections) below for the document
shape and required indexes. `PostsTable` uses `manualPagination`/
`manualSorting` — it never sorts/slices data itself, it just asks
`usePosts()` (`lib/use-posts.ts`) for the page it wants, with the current
sort/search/sentiment/channel filters and the header date-range picker's
range. That hook also maps each raw row into `PostTableRow`
(`components/posts/columns.tsx`) — translating the stored `channel` value to
an icon key (`channelIconKey` in `lib/utils.ts`, shared with the Authors
pipeline below) and deriving `sentimentLabel` — plus filling in a **fixed
placeholder country** (`"US"`/`"United States"`) since the `_legacy`
collection has no per-post country field yet. The channel icon in each row
links out to the post's original `url` in a new tab.

Column definitions live in `components/posts/columns.tsx`, which also
defines `PostTableRow` — a posts-table-specific shape kept separate from the
smaller shared `SocialPost` type `PostList`/the Recent Posts card use, so
this table's needs don't leak into that simpler component.

The Brand Reputation page's "Recent Posts" card
(`components/dashboard/cards/recent-posts-card.tsx`) reuses this same
`/api/posts` endpoint rather than a dedicated one — `useRecentPosts(limit)`
in `lib/use-posts.ts` calls the shared fetch logic (`usePostsFetch`, also
used by `usePosts`) with `page: 0, sortBy: "date", sortOrder: "desc"` and no
filters, mapping to `SocialPost` instead of `PostTableRow`.

## Data sources — MongoDB collections

Every collection lives in the `signal` database. Per-org collections are
named `{org_id}_<suffix>` (or, for one case, just `{org_id}` — see below);
`org_id` is Clerk's org id, e.g. `org_2vQYwSEAwcIPnuyNGsdkMxvOske`. Every
date-scoped collection uses `published` as a zero-padded `YYYYMMDD`
**string** (not a `Date`) for range filtering — this is what every
date-range-scoped API in the app (`/api/brand-reputation`, `/api/posts`,
`/api/authors`) matches against, converting the header date picker's
`YYYY-MM-DD` selection to this compact form before querying.

### `{org_id}_daily` — one document per day, brand-reputation metrics

Read by `getBrandReputation()` (`lib/brand-reputation.ts`), which does all
its per-day, by-country, by-channel, engagement-rate, and unique-authors
summing inside a single `$facet` Mongo aggregation rather than in
application code.

```jsonc
{
  "_id": ObjectId,
  "published": "20260601",           // YYYYMMDD string
  "impressions": { "positive": 3759763, "negative": 1089611, "neutral": 1373423 },
  "volume": { "positive": 27, "negative": 12, "neutral": 6 },
  "engaged_count": 6,                 // posts that day with any engagement
  "unique_authors": 10,               // distinct authors that day
  "by_country": [
    {
      "label": "US",                 // ISO 3166-1 alpha-2
      "impressions": { "positive": 2103981, "negative": 601240, "neutral": 742110 },
      "volume": { "positive": 14, "negative": 6, "neutral": 3 },
      "avg_sentiment": 5             // -5..5, averaged across the requested date range
    }
    // ...one entry per country with any activity that day
  ],
  "by_channel": [
    {
      "label": "twitter",
      "impressions": { "positive": 2210442, "negative": 703120, "neutral": 812004 },
      "volume": { "positive": 16, "negative": 7, "neutral": 4 }
      // no avg_sentiment — channel breakdown doesn't carry a sentiment score
    }
    // ...one entry per channel with any activity that day
  ]
}
```

`by_country`/`by_channel` entries are **not required to sum to the top-level
`impressions`/`volume`** — treat the top-level fields as the source of truth
and the breakdowns as a (possibly partial) attribution. The API derives two
more metrics from this doc rather than storing them directly:
`engagement_rate = sum(engaged_count) / sum(volume) * 100` (a percentage,
`0` when there are no posts, never `NaN`/`Infinity`) and `unique_authors` as
returned is the **average** of each matched day's count, not a sum — the
same author posting on multiple days shouldn't inflate the range total.

**Required index:** `{ published: 1 }` — every query is a range scan on this
field first.

### `{org_id}_legacy` — one document per mention/post

Read by `getPosts()` (`lib/posts.ts`) via a `$facet` aggregation (page of
rows + total matching count in one round trip). Real fields observed in
production data (see `lib/posts.ts` for the exact subset the app reads):

```jsonc
{
  "_id": ObjectId,
  "id": "kN_5ftOIRlQ",               // platform-native post id, not used by the app
  "author": { "id": "...", "name": "Biogénesis Bagó Asia", "username": "...", "followers_count": 0 },
  "channel": "youtube",              // one of: twitter, facebook, instagram, linkedin, news, tiktok, youtube
  "created_at": "2026-07-20T03:08:32Z",
  "public_metrics": { "impression_count": 5, "comment_count": 0, "like_count": 0, "share_count": null },
  "published": "20260720",           // YYYYMMDD string — same convention as `_daily`
  "sentiment": { "classification": "neutral", "score": 0, "reasoning": "..." },
  "text": "...",
  "url": "https://www.youtube.com/watch?v=kN_5ftOIRlQ"
  // plus channel_specific, entities, lang, media_stored, media_type, run_id,
  // step, topics — present in the source data but not read by the app today
}
```

No country field exists on this collection today — the Posts table's
country column is a fixed placeholder until one is added upstream.

**Required index:** `{ published: 1 }`, same as `_daily`. If sentiment
and/or channel filtering becomes a heavy usage pattern (both are exposed as
independent filters in the Posts table), add compound indexes leading with
whichever field is filtered, followed by `published`:
`{ "sentiment.classification": 1, published: 1 }` and
`{ channel: 1, published: 1 }` — a single combined index can't serve as the
leading seek for both filters independently, so two separate indexes (not
one three-field index) is the right shape here. The free-text `text` search
uses `$regex`, which can't use either index; a `$text` index would be needed
if search volume ever justifies it.

### `{org_id}` (unsuffixed) — same per-mention shape as `_legacy`, with `author` embedded

Read by `getTopAuthors()` (`lib/authors.ts`) for the "Top Authors" card.
Same per-post document shape as `_legacy`, but every channel's embedded
`author` object consistently uses `author.followers_count` (the separate
global `authors` collection below has a naming inconsistency this
collection doesn't).

The aggregation: `$match` the date range → `$group` by `author.id` to dedupe
to one row per author (`$first` per field — author profile fields don't
change within a period; also resolves `author.username` being `null` for
some news-channel authors, falling back to `author.id`, e.g. `"clarin.com"`)
→ `$lookup`/`$unwind` into `author_assessments` (below) filtered to this
org's sentiment → sort/limit by follower count.

**Not date-filtered beyond selecting which authors show up**: the sentiment
score used for each author's promoter/detractor status comes from
`author_assessments`, whose `assessed_at` is *when the score was computed*,
not the underlying post period — so which authors appear respects the
header's date range (via this collection's `published` match), but their
score is `author_assessments`' current value for that author/org pair, not
recomputed per range.

**Required index:** `{ published: 1 }` for the range scan; ideally
`{ "author.id": 1 }` too if the `$group` dedupe becomes a bottleneck at
scale.

### `authors` — global, not org-scoped

One document per author across all orgs, keyed by platform-native `id`.
**Not currently read directly** — `getTopAuthors()` uses `{org_id}`'s
embedded `author` data instead, specifically because this collection has an
inconsistent follower-count field name: every channel uses
`public_metrics.followers_count` except LinkedIn, which uses the singular
`public_metrics.follower_count`. If this collection is ever read directly,
handle both.

### `author_assessments` — global, org-scoped sentiment per author

```jsonc
{
  "author_id": "...",              // matches authors.id / {org_id}'s author.id
  "author_name": "...",
  "author_username": "...",
  "channel": "twitter",
  "assessment": [
    {
      "org_id": "org_2vQY...",
      "sentiment": {
        "score": 4,                 // -5..5 — thresholded to promoter (>=0) / detractor (<0)
        "classification": "positive",
        "assessed_at": "2026-08-04T01:16:48.476Z" // when scored, not the post period
      }
    }
    // one entry per org this author has been assessed for
  ]
}
```

A strict subset of `{org_id}`'s distinct authors — not every author with
mentions in a period has an assessment for that org, and `getTopAuthors()`
excludes ones that don't (via the `$lookup`/`$unwind` dropping non-matches)
rather than showing an unknown status.

**Required index:** `{ author_id: 1 }` for the `$lookup` above.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
