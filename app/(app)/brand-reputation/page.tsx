import { ChartNoAxesColumn, Layers } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { ChartCard } from "@/components/dashboard/chart-card";
import { MiniChart } from "@/components/dashboard/mini-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { StatHighlight } from "@/components/dashboard/stat-highlight";
import { StackedBarChart } from "@/components/dashboard/stacked-bar-chart";
import { UserList } from "@/components/dashboard/user-list";
import { PostList } from "@/components/dashboard/post-list";
import { NarrativeSummary } from "@/components/dashboard/narrative-summary";
import { WorldMap } from "@/components/dashboard/world-map";
import { CountryScoreList } from "@/components/dashboard/country-score-list";
import {
  MirrorAreaChart,
  type MirrorAreaChartSeries,
} from "@/components/dashboard/mirror-area-chart";
import {
  countryScoreListDataFromCountryBreakdown,
  DASHBOARD_METRICS,
  generateMockCountrySentimentBreakdown,
  generateMockDistribution,
  generateMockPosts,
  generateMockSentimentByChannel,
  generateMockSentimentByCountry,
  generateMockSentimentSeries,
  generateMockSeries,
  generateMockUsers,
  HIGHLIGHT_METRICS,
  METRIC_SUBTITLES,
  MOCK_NARRATIVE_SUMMARY,
  worldMapDataFromCountryBreakdown,
} from "@/lib/mock-metrics";

const SENTIMENT_SUBTITLE = "Positive vs. negative mentions";

// Sentiment is a fixed, status-style palette (green/red/gray) rather than the
// generic --chart-1..5 categorical ramp — see the dataviz skill notes on
// status colors in app/globals.css.
const SENTIMENT_SERIES: MirrorAreaChartSeries[] = [
  { key: "positive", label: "Positive", color: "var(--chart-positive)" },
  { key: "negative", label: "Negative", color: "var(--chart-negative)" },
  { key: "neutral", label: "Neutral", color: "var(--chart-neutral)" },
];

// The two donut cards each have exactly 3 slices — reuse the fixed
// sentiment palette for visual variety instead of the generic ramp.
const DONUT_COLORS = ["--chart-positive", "--chart-negative", "--chart-neutral"];

type Metric = (typeof DASHBOARD_METRICS)[number];
type CardSpan = "narrow" | "wide";

type CardDescriptor =
  | { type: "donut"; span: CardSpan; title: Metric; categories: readonly string[] }
  | { type: "sentiment"; span: CardSpan }
  | { type: "posts"; span: CardSpan }
  | { type: "authors"; span: CardSpan }
  | { type: "sentiment-by-channel"; span: CardSpan }
  | { type: "sentiment-by-country"; span: CardSpan }
  | { type: "narrative"; span: CardSpan }
  | { type: "map"; span: CardSpan }
  | { type: "country-score-list"; span: CardSpan }
  | { type: "metric"; span: CardSpan; metric: Metric; color: string };

// The full dashboard grid, top to bottom, left to right — each card is
// explicit about what it is and how wide it spans, so adding/removing/
// reordering a card can't silently desync from a positional row/column
// lookup elsewhere. The highlight tiles are the one exception: they're a
// fixed final row rendered separately below (see HIGHLIGHT_METRICS.map at
// the bottom of the component), since on mobile they need their own 2-column
// sub-grid rather than the single-column stacking every other card gets.
const CARDS: CardDescriptor[] = [
  { type: "donut", span: "narrow", title: "Revenue", categories: ["Direct", "Referral", "Organic"] },
  { type: "sentiment", span: "wide" },
  { type: "donut", span: "narrow", title: "New Signups", categories: ["Web", "Mobile", "Partner"] },

  { type: "posts", span: "narrow" },
  { type: "authors", span: "narrow" },
  { type: "sentiment-by-channel", span: "narrow" },
  { type: "narrative", span: "narrow" },

  { type: "sentiment-by-country", span: "narrow" },
  { type: "map", span: "wide" },
  { type: "country-score-list", span: "narrow" },
];

function spanClassName(span: CardSpan) {
  return span === "wide" ? "col-span-1 md:col-span-2" : "col-span-1";
}

export default async function BrandReputationPage() {
  await auth.protect();

  // One payload, shared by both the map and the country list below — they
  // render the same by-country breakdown two different ways rather than
  // each fetching/generating their own copy of it.
  const countryBreakdown = generateMockCountrySentimentBreakdown("country-mentions");

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
      {CARDS.map((card, i) => {
        const className = spanClassName(card.span);

        switch (card.type) {
          case "posts":
            return (
              <ChartCard
                key={i}
                className={className}
                title="Recent Posts"
                description="Latest mentions this period"
              >
                <PostList posts={generateMockPosts("recent-posts").slice(0, 3)} />
              </ChartCard>
            );

          case "authors":
            return (
              <ChartCard
                key={i}
                className={className}
                title="Top Authors"
                description="Most followed authors this period"
              >
                <UserList users={generateMockUsers("top-authors")} />
              </ChartCard>
            );

          case "sentiment-by-channel":
            return (
              <ChartCard
                key={i}
                className={className}
                title="Sentiment by Channel"
                description="Breakdown by channel type"
              >
                <StackedBarChart
                  data={generateMockSentimentByChannel("by-channel", 400)}
                  series={SENTIMENT_SERIES}
                />
              </ChartCard>
            );

          case "sentiment-by-country":
            return (
              <ChartCard
                key={i}
                className={className}
                title="Sentiment by Country"
                description="Breakdown by top 5 countries"
                stretch
              >
                <StackedBarChart
                  data={generateMockSentimentByCountry("by-country", 400)}
                  series={SENTIMENT_SERIES}
                />
              </ChartCard>
            );

          case "narrative":
            return (
              <ChartCard
                key={i}
                className={className}
                title="Summary"
                description="Key takeaways this period"
              >
                <NarrativeSummary text={MOCK_NARRATIVE_SUMMARY} />
              </ChartCard>
            );

          case "map":
            return (
              <ChartCard
                key={i}
                className={className}
                title="Mentions by Country"
                description="Where this period's mentions came from"
              >
                <WorldMap data={worldMapDataFromCountryBreakdown(countryBreakdown)} />
              </ChartCard>
            );

          case "country-score-list":
            return (
              <ChartCard
                key={i}
                className={className}
                title="All Countries"
                description="Sentiment across every monitored country"
              >
                <CountryScoreList
                  countries={countryScoreListDataFromCountryBreakdown(countryBreakdown)}
                />
              </ChartCard>
            );

          case "sentiment":
            return (
              <ChartCard
                key={i}
                className={className}
                title="Sentiment"
                description={SENTIMENT_SUBTITLE}
              >
                <MirrorAreaChart
                  top={generateMockSentimentSeries("impressions", 4_000_000)}
                  bottom={generateMockSentimentSeries("volume", 40)}
                  series={SENTIMENT_SERIES}
                  topLabel="Impressions"
                  bottomLabel="Volume"
                  topIcon={<ChartNoAxesColumn className="size-3" />}
                  bottomIcon={<Layers className="size-3" />}
                />
              </ChartCard>
            );

          case "donut":
            return (
              <ChartCard
                key={i}
                className={className}
                title={card.title}
                description={METRIC_SUBTITLES[card.title]}
                centerTitle
                centerContent
              >
                <DonutChart
                  data={generateMockDistribution(card.title, card.categories).map(
                    (slice, i) => ({
                      ...slice,
                      fill: DONUT_COLORS[i % DONUT_COLORS.length],
                    }),
                  )}
                />
              </ChartCard>
            );

          case "metric":
            return (
              <ChartCard
                key={i}
                className={className}
                title={card.metric}
                description={METRIC_SUBTITLES[card.metric]}
              >
                <MiniChart
                  data={generateMockSeries(card.metric)}
                  variant={card.span === "wide" ? "full" : "compact"}
                  color={card.color}
                />
              </ChartCard>
            );
        }
      })}
      {/* Own 2-column sub-grid on mobile (2 tiles per line instead of the
          single-column stack every other card gets); `md:contents` drops
          this wrapper from the box model at the desktop breakpoint so its
          children rejoin the outer 4-column grid directly, unchanged from
          before. */}
      <div className="grid grid-cols-2 gap-4 md:contents">
        {HIGHLIGHT_METRICS.map((highlight) => (
          <ChartCard key={highlight.label} className="col-span-1" centerContent>
            <StatHighlight value={highlight.value} label={highlight.label} />
          </ChartCard>
        ))}
      </div>
    </div>
  );
}
