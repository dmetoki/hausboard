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

// A diverging status color by sign only (not magnitude) — negative < 0,
// neutral = 0, positive > 0 — shared by any component that colors a score
// this way (world map choropleth, country score list) instead of each
// re-implementing the same three-way branch. Returns a bare --chart-*
// variable name; wrap in var(...) at the call site.
export function statusColorFromScore(score: number): string {
  if (score < 0) return "--chart-negative"
  if (score > 0) return "--chart-positive"
  return "--chart-neutral"
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
