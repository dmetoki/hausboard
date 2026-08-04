import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Shared across dashboard cards (mini/mirror/bar charts, user/post lists) so
// every compact number ("1.2K", "3.4M") formats identically and isn't
// re-instantiated per component.
export const compactNumberFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
})

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value)
}

// Splits a compact-formatted number ("1.2M") into its digits and unit
// suffix, so callers can render the suffix at a smaller size for legibility
// instead of matching the digits' font size.
export function formatCompactNumberParts(value: number): {
  number: string
  suffix: string
} {
  const parts = compactNumberFormatter.formatToParts(value)
  const suffix = parts.find((part) => part.type === "compact")?.value ?? ""
  const number = parts
    .filter((part) => part.type !== "compact")
    .map((part) => part.value)
    .join("")
  return { number, suffix }
}

// Turns a kebab-case status/sentiment value ("slightly-positive") into its
// default display label ("Slightly Positive"). Used by data layers to derive
// a label for the dashboard's status/sentiment fields instead of each
// component hardcoding its own label text per value.
export function titleCaseFromKebab(value: string): string {
  return value
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ")
}

// A diverging status color, banded the same way `sentimentLabelFromScore`
// buckets its "Neutral" label (-1..1) — shared by any component that colors
// a score this way (world map choropleth, country score list) instead of
// each re-implementing the same three-way branch. Returns a bare --chart-*
// variable name; wrap in var(...) at the call site.
export function statusColorFromScore(score: number): string {
  if (score < -1) return "--chart-negative"
  if (score > 1) return "--chart-positive"
  return "--chart-neutral"
}

// Buckets a -5..5 sentiment score (e.g. `by_country[].avg_sentiment`) into
// its display label. Bands are asymmetric-inclusive at the boundaries
// (-4/-1/1/4 each resolve to the more extreme of their two adjacent bands)
// so every value in -5..5 maps to exactly one label.
export function sentimentLabelFromScore(score: number): string {
  if (score <= -4) return "Negative"
  if (score < -1) return "Slightly Negative"
  if (score <= 1) return "Neutral"
  if (score < 4) return "Slightly Positive"
  return "Positive"
}

// `numericId` is the ISO 3166-1 NUMERIC code for the same country — matches
// the `id` field on each feature in the world-atlas topology `WorldMap`
// renders, which has no alpha-2 field of its own to match against.
export const COUNTRY_CODES = [
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
] as const

// `Intl.DisplayNames` covers the full ISO 3166-1 alpha-2 set natively (no
// dependency, no maintaining our own list) — unlike `COUNTRY_CODES` above,
// which is deliberately a small curated set (only what `WorldMap` needs a
// numeric id for), this needs to resolve every country the data can contain.
const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

/** Falls back to the raw code itself for a code `Intl.DisplayNames` doesn't
 * recognize, so it still renders instead of disappearing. */
export function countryNameFromCode(countryCode: string): string {
  try {
    return regionNames.of(countryCode) ?? countryCode
  } catch {
    return countryCode
  }
}

const NUMERIC_ID_BY_COUNTRY_CODE: Record<string, string> = Object.fromEntries(
  COUNTRY_CODES.map(({ countryCode, numericId }) => [countryCode, numericId]),
)

/** Unlike `countryNameFromCode`, there's no sensible fallback here — `id`
 * has to be a real world-atlas numeric id or `WorldMap` can't place it, so
 * callers should drop countries this returns `undefined` for. */
export function numericIdFromCountryCode(countryCode: string): string | undefined {
  return NUMERIC_ID_BY_COUNTRY_CODE[countryCode]
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const DATE_COMPACT = /^(\d{4})(\d{2})(\d{2})$/

export function parseDate(dateString: string): Date {
  // Date-only strings (e.g. "2026-07-27") are parsed as UTC midnight by
  // `new Date()`, but consumers read them back with local-time getters —
  // in timezones behind UTC that silently shifts the date back a day.
  // Parse those components directly to keep them anchored to local time;
  // defer anything carrying a time/offset to the native parser.
  if (DATE_ONLY.test(dateString)) {
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day)
  }
  // Compact "yyyyMMdd" (e.g. "20260727"), as stored in MongoDB — `new Date()`
  // doesn't recognize this form at all and returns Invalid Date.
  const compactMatch = DATE_COMPACT.exec(dateString)
  if (compactMatch) {
    const [, year, month, day] = compactMatch.map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(dateString)
}
