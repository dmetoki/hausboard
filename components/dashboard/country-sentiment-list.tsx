"use client";

import ReactCountryFlag from "react-country-flag";

export type SentimentLevel =
  | "negative"
  | "slightly-negative"
  | "neutral"
  | "slightly-positive"
  | "positive";

export type CountrySentiment = {
  /** Two-letter ISO 3166-1 alpha-2 country code, e.g. "US". */
  countryCode: string;
  countryName: string;
  sentiment: SentimentLevel;
};

// Same fixed status-color convention used everywhere else sentiment shows up
// in the dashboard (mirror chart, stacked bar charts, post/user lists) — the
// "slightly" levels share their base color; the label carries the degree.
const SENTIMENT_STYLES: Record<SentimentLevel, { label: string; color: string }> = {
  negative: { label: "Negative", color: "--chart-negative" },
  "slightly-negative": { label: "Slightly Negative", color: "--chart-negative" },
  neutral: { label: "Neutral", color: "--chart-neutral" },
  "slightly-positive": { label: "Slightly Positive", color: "--chart-positive" },
  positive: { label: "Positive", color: "--chart-positive" },
};

// Matches the world map's typical rendered height in the same row (a fixed
// 2:1 aspect ratio, so it doesn't swing much across normal card widths) —
// a CSS-only "stretch to match this sibling" isn't reliable here (a grid
// item's content can grow the whole row before overflow/scroll ever kick
// in), so this fixes the height directly rather than deriving it.
const LIST_HEIGHT = "20rem";

/**
 * A plain scrollable list (country + sentiment), height-capped to roughly
 * match its neighboring map card, that scrolls internally instead of
 * growing the card to fit every row — matches the row-based layout of
 * `UserList`/`PostList` but capped rather than open-ended.
 */
export function CountrySentimentList({ countries }: { countries: CountrySentiment[] }) {
  return (
    <div
      className="divide-y divide-border overflow-y-auto"
      style={{ height: LIST_HEIGHT }}
    >
      {countries.map((country) => {
        const sentiment = SENTIMENT_STYLES[country.sentiment];

        return (
          <div
            key={country.countryCode}
            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
          >
            <span className="flex items-center gap-2 text-xs text-foreground">
              <ReactCountryFlag
                countryCode={country.countryCode}
                svg
                style={{ width: "1em", height: "1em" }}
                aria-label={country.countryName}
              />
              {country.countryName}
            </span>
            <span
              className="shrink-0 rounded-none px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: `color-mix(in oklab, var(${sentiment.color}) 16%, transparent)`,
                color: `var(${sentiment.color})`,
              }}
            >
              {sentiment.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
