import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { ChartCard } from "@/components/dashboard/chart-card";
import { StatHighlight } from "@/components/dashboard/stat-highlight";
import { SentimentCard } from "@/components/dashboard/cards/sentiment-card";
import { SentimentDonutCard } from "@/components/dashboard/cards/sentiment-donut-card";
import { SentimentByChannelCard } from "@/components/dashboard/cards/sentiment-by-channel-card";
import { SentimentByCountryCard } from "@/components/dashboard/cards/sentiment-by-country-card";
import { RecentPostsCard } from "@/components/dashboard/cards/recent-posts-card";
import { UserList } from "@/components/dashboard/user-list";
import { NarrativeSummary } from "@/components/dashboard/narrative-summary";
import { SentimentCountryScoreCard } from "@/components/dashboard/cards/sentiment-country-score-card";
import { SentimentWorldMapCard } from "@/components/dashboard/cards/sentiment-world-map-card";
import {
  generateMockUsers,
  HIGHLIGHT_METRICS,
  MOCK_NARRATIVE_SUMMARY,
} from "@/lib/mock-metrics";

export const metadata: Metadata = {
  title: "Brand Reputation",
};

type CardSpan = "narrow" | "wide";

type CardDescriptor =
  | { type: "sentiment-donut"; span: CardSpan; field: "impressions" | "volume" }
  | { type: "sentiment"; span: CardSpan }
  | { type: "posts"; span: CardSpan }
  | { type: "authors"; span: CardSpan }
  | { type: "sentiment-by-channel"; span: CardSpan }
  | { type: "sentiment-by-country"; span: CardSpan }
  | { type: "narrative"; span: CardSpan }
  | { type: "map"; span: CardSpan }
  | { type: "country-score-list"; span: CardSpan };

// The full dashboard grid, top to bottom, left to right — each card is
// explicit about what it is and how wide it spans, so adding/removing/
// reordering a card can't silently desync from a positional row/column
// lookup elsewhere. The highlight tiles are the one exception: they're a
// fixed final row rendered separately below (see HIGHLIGHT_METRICS.map at
// the bottom of the component), since on mobile they need their own 2-column
// sub-grid rather than the single-column stacking every other card gets.
const CARDS: CardDescriptor[] = [
  { type: "sentiment-donut", span: "narrow", field: "impressions" },
  { type: "sentiment", span: "wide" },
  { type: "sentiment-donut", span: "narrow", field: "volume" },

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

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
      {CARDS.map((card, i) => {
        const className = spanClassName(card.span);

        switch (card.type) {
          case "posts":
            return <RecentPostsCard key={i} className={className} />;

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
            return <SentimentByChannelCard key={i} className={className} />;

          case "sentiment-by-country":
            return <SentimentByCountryCard key={i} className={className} />;

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
            return <SentimentWorldMapCard key={i} className={className} />;

          case "country-score-list":
            return <SentimentCountryScoreCard key={i} className={className} />;

          case "sentiment":
            return <SentimentCard key={i} className={className} />;

          case "sentiment-donut":
            return (
              <SentimentDonutCard
                key={i}
                className={className}
                field={card.field}
                title={card.field === "impressions" ? "Impressions" : "Volume"}
                description={
                  card.field === "impressions"
                    ? "Reach by sentiment"
                    : "Mentions by sentiment"
                }
              />
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
