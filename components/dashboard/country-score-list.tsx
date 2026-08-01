"use client";

import ReactCountryFlag from "react-country-flag";
import { statusColorFromScore } from "@/lib/utils";

export type CountryScore = {
  /** Two-letter ISO 3166-1 alpha-2 country code, e.g. "US". */
  countryCode: string;
  countryName: string;
  /** Sign only, not a magnitude: negative < 0, neutral = 0, positive > 0. */
  score: number;
  /** Display text for `score` — owned by the caller/data layer, not this
   * component, so wording can change (localization, rephrasing) without
   * touching the component. */
  scoreLabel: string;
};

// Matches the world map's typical rendered height in the same row (a fixed
// 2:1 aspect ratio, so it doesn't swing much across normal card widths) —
// a CSS-only "stretch to match this sibling" isn't reliable here (a grid
// item's content can grow the whole row before overflow/scroll ever kick
// in), so this fixes the height directly rather than deriving it.
const LIST_HEIGHT = "20rem";

/**
 * A plain scrollable list (country + score), height-capped to roughly
 * match its neighboring map card, that scrolls internally instead of
 * growing the card to fit every row — matches the row-based layout of
 * `UserList`/`PostList` but capped rather than open-ended.
 */
export function CountryScoreList({ countries }: { countries: CountryScore[] }) {
  return (
    <div
      className="divide-y divide-border overflow-y-auto"
      style={{ height: LIST_HEIGHT }}
    >
      {countries.map((country) => {
        const color = statusColorFromScore(country.score);

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
                backgroundColor: `color-mix(in oklab, var(${color}) 16%, transparent)`,
                color: `var(${color})`,
              }}
            >
              {country.scoreLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
