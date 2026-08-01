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

## Dashboard charts

The dashboard grid (`app/(app)/page.tsx`) is built from a small set of reusable
chart components in `components/dashboard/`. They are Recharts-based Client
Components with no knowledge of where their data comes from — every one of
them takes plain data via props and renders it. Whoever mounts a chart (a
Server Component page today, real MongoDB-backed data eventually) owns
fetching/shaping the data; the chart owns only the visualization.

All of them share the app's chart color tokens declared in `app/globals.css`:

- `--chart-1` through `--chart-5` — the categorical ramp, for identity series
  (e.g. one metric per card). Assign in fixed order; never cycle or reuse for
  status.
- `--chart-positive` / `--chart-negative` / `--chart-neutral` — a fixed
  status-style palette (green/red/gray), the same hex in light and dark mode,
  never themed. Use these only for a genuine positive/negative/neutral
  semantic (e.g. sentiment), never as a 4th/5th/6th categorical series.

### `ChartCard`

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

### `MiniChart` — single-series area chart

```ts
type MetricPoint = { label: string; value: number };

<MiniChart
  data: MetricPoint[]        // one point per x position, in order
  variant: "compact" | "full" // compact: no axes; full: axes + gridline
  color: string               // a --chart-* CSS variable NAME, e.g. "--chart-1"
/>
```

**Contract:** `color` is the bare variable name, not a CSS color — the
component wraps it in `var(...)` itself. `data` must already be in the order
you want plotted left-to-right; the component doesn't sort it.

### `DonutChart` — single categorical breakdown

```ts
type DonutSlice = { label: string; value: number; fill: string };

<DonutChart data={DonutSlice[]} />
```

**Contract:** same as `MiniChart` — `fill` is a bare `--chart-*` variable name
per slice, not a resolved color. The center label shows the sum of every
slice's `value`, so only pass the slices that should count toward that total.

### `MirrorAreaChart` — two multi-series area charts sharing one x-axis

The one chart component built to be domain-agnostic from the start — it
carries no fixed field names, colors, or labels. `top` and `bottom` each
render as their own multi-series area chart; `bottom` is vertically mirrored
(reversed y-axis, grows downward) so the two form one visual pair around a
shared axis row in the middle.

```ts
type MirrorAreaChartPoint = Record<string, string | number>;
type MirrorAreaChartSeries = { key: string; label: string; color: string };

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
/>
```

**Contract — read carefully, this is the one place the rules differ from the
other two charts:**

- Every object in `top` and `bottom` must have a value for `xKey` (default
  `"date"`) **and** a numeric value for every `series[].key`. Missing keys
  render as gaps in that line.
- `top` and `bottom` must cover the **same `xKey` sequence** (same values, same
  order) — the shared axis row and the y-axis width/margins are computed
  once and reused across both halves for pixel-exact tick alignment. Mismatched
  sequences will misalign the ticks against the data.
- Unlike `MiniChart`/`DonutChart`, `series[].color` is a **resolved CSS color**
  (e.g. `"var(--chart-positive)"`), not a bare variable name — this component
  does not wrap it in `var(...)`. Passing a bare `"--chart-1"` here will
  silently fail to render any color.
- The default `formatXTick` assumes `xKey`'s value is an ISO date string
  (`date-fns`'s `parseISO` + `"MMM d"`). Pass your own `formatXTick` if `xKey`
  isn't a date.

Example (this is how the dashboard's Sentiment card is wired):

```tsx
const SENTIMENT_SERIES: MirrorAreaChartSeries[] = [
  { key: "positive", label: "Positive", color: "var(--chart-positive)" },
  { key: "negative", label: "Negative", color: "var(--chart-negative)" },
  { key: "neutral", label: "Neutral", color: "var(--chart-neutral)" },
];

<MirrorAreaChart
  top={impressionsByDate}   // [{ date: "2026-06-01", positive: 217, negative: 14, neutral: 125 }, ...]
  bottom={volumeByDate}     // same date sequence as `top`
  series={SENTIMENT_SERIES}
  topLabel="Impressions"
  bottomLabel="Volume"
  topIcon={<ChartNoAxesColumn className="size-3" />}
  bottomIcon={<Layers className="size-3" />}
/>
```

### `StackedBarChart` — one horizontal stacked bar per category

```ts
type StackedBarChartRow = Record<string, string | number>; // labelKey + one numeric field per series[].key

<StackedBarChart
  data: StackedBarChartRow[]
  series: MirrorAreaChartSeries[] // same shape as MirrorAreaChart's series
  labelKey?: string                // default "label"
/>
```

**Contract:** same series contract as `MirrorAreaChart` — `series[].color` is a
**resolved CSS color** (e.g. `"var(--chart-positive)"`), not a bare variable
name. Every row must have a numeric value for every `series[].key`; a missing
key is treated as `0` in that row's stack, not skipped. `data` order is render
order, top to bottom, against one shared numeric scale across all rows.

### `UserList` — ranked list of social authors

```ts
type SocialUser = {
  id: string;
  name: string;
  username: string;
  followers: number;
  source: keyof typeof Icons;              // see `Icons`, components/icons.tsx
  status: "promoter" | "detractor";
  statusLabel: string;                     // display text for `status` — caller-owned, see below
};

<UserList users={SocialUser[]} />
```

**Contract:** `source` must be a key that exists on `Icons`; falls back to
`Icons.unknown` if not (a real runtime safety net — `source` may come from
data that doesn't match the compile-time union). `status` drives a fixed
status-color badge (promoter → the positive color, detractor → the negative
color) — icon/color are component-owned, but the display text is not:
`statusLabel` is the caller/data layer's wording (e.g. for localization),
rendered as-is.

### `PostList` — recent social posts

```ts
type SocialPost = {
  id: string;
  text: string;
  source: keyof typeof Icons;
  impressions: number;
  likes: number;
  sentiment: "positive" | "negative" | "neutral";
  sentimentLabel: string;                  // display text for `sentiment` — caller-owned
};

<PostList posts={SocialPost[]} />
```

**Contract:** same `source`/`Icons` fallback and `sentimentLabel`
caller-owns-the-text contract as `UserList`. `text` is clamped to 2 lines
visually (`line-clamp-2`) — pass the full text, don't pre-truncate it
yourself.

### `WorldMap` — choropleth by country

```ts
type CountryValue = {
  id: string;      // ISO 3166-1 NUMERIC code as a string, e.g. "840" for the US
  label: string;
  score: number;   // sign only: negative < 0, neutral = 0, positive > 0 — NOT a magnitude
  mentions: number; // raw count, shown in the hover tooltip only — plays no part in color
};

<WorldMap data={CountryValue[]} />
```

**Contract:** `id` must be the ISO 3166-1 **numeric** code, not alpha-2/alpha-3
— it's matched directly against the `id` field on each feature in the
`world-atlas` `countries-110m.json` topology. `score` drives a fixed
3-color diverging status scale (same negative/neutral/positive convention as
the rest of the dashboard) purely by sign — `-5` and `-1` render identically;
pass a real magnitude in `mentions` instead if you need to show volume, since
that's what the tooltip reads. Countries not present in `data` still render,
shaded as "no data" rather than omitted. Antarctica is always excluded from
render, and the US feature has its Hawaii polygon stripped for framing
purposes — both independent of what `data` contains.

`lib/mock-metrics.ts` demonstrates the intended real-world pipeline for this
component, and it's the **same pipeline `CountryScoreList` below uses** —
one upstream payload, two adapters, one per component:
`generateMockCountrySentimentBreakdown` produces the raw per-country
`{ id (alpha-2), label, positive, neutral, negative, mentions }` shape a real
sentiment API would plausibly return, and `worldMapDataFromCountryBreakdown`
adapts it into `WorldMap`'s actual `CountryValue[]` contract — converting
alpha-2 → numeric ids and collapsing `positive - negative` down to a `score`
sign. `WorldMap` itself never sees the alpha-2/positive/negative shape, only
the adapted output — neither this component nor `CountryScoreList` know
"sentiment" as a concept, only an opaque `score` whose sign they color and a
`label`/`scoreLabel` they render verbatim.

### `CountryScoreList` — scrollable country/score list

```ts
type CountryScore = {
  countryCode: string; // ISO 3166-1 ALPHA-2, e.g. "US" — different code system than WorldMap's `id`
  countryName: string;
  score: number;       // sign only: negative < 0, neutral = 0, positive > 0 — same convention as WorldMap
  scoreLabel: string;  // display text for `score` — caller-owned, see UserList above
};

<CountryScoreList countries={CountryScore[]} />
```

**Contract:** `countryCode` is alpha-2 (not the numeric code `WorldMap` uses)
— it's passed straight through to `react-country-flag`. `score`'s sign picks
the fill color via the shared `statusColorFromScore` helper (`lib/utils.ts`)
— the same one `WorldMap` uses, so a country never renders a different color
in the map than in this list for the same data. The list has a fixed height
and scrolls internally; it does not grow the card to fit `countries.length`.
`worldMapDataFromCountryBreakdown` and `countryScoreListDataFromCountryBreakdown`
in `lib/mock-metrics.ts` both derive their score from the exact same rule, so
wiring both components from one `generateMockCountrySentimentBreakdown()`
call (rather than two) keeps them in agreement — see how
`app/(app)/brand-reputation/page.tsx` does this.

### `StatHighlight` / `NarrativeSummary` — non-chart cards

Not every card is a chart — per the dataviz skill, a single headline number or
free-form prose sometimes beats a chart shape.

```ts
<StatHighlight value={string} label={string} />   // hero number + its own label
<NarrativeSummary text={string} />                // plain prose, no markup applied
```

### `IconBadge` / `StatusBadge` — shared circular icon badges

Not mounted directly in the dashboard grid — `UserList`/`PostList` use these
internally for the source-platform icon and the sentiment/status icon.

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

### `ChartTooltip` — shared tooltip content

`MiniChart` and `DonutChart` both render their Recharts `<Tooltip>` via this
one component (`components/dashboard/chart-tooltip.tsx`), so their hover
cards stay visually consistent. `MirrorAreaChart` has its own tooltip (it
needs to show every series at once, not just one value), so it doesn't use
this component — but any *new* single-value chart should.

```ts
<ChartTooltip
  active?: boolean
  label?: string
  value?: number
  color?: string        // a resolved CSS color, e.g. "var(--chart-1)"
  keyShape?: "dot" | "line" // default "dot"
/>
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
