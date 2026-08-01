"use client";

import type { ReactNode } from "react";
import { format } from "date-fns";
import ReactCountryFlag from "react-country-flag";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChartNoAxesColumn,
  Flag,
  Frown,
  Meh,
  Share2,
  Smile,
} from "lucide-react";
import type { Column, ColumnDef } from "@tanstack/react-table";
import { Icons } from "@/components/icons";
import { IconBadge } from "@/components/dashboard/icon-badge";
import { Button } from "@/components/ui/button";
import { compactNumberFormatter, parseDate } from "@/lib/utils";

// tanstack's `ColumnMeta` is an empty interface meant to be augmented by
// consumers — `label` is what `DataTableViewOptions` (components/ui/) shows
// in the show/hide-columns menu for columns whose header is icon-only.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match tanstack's original type parameter names to merge
  interface ColumnMeta<TData, TValue> {
    label?: string;
  }
}

// The posts table's own row shape — a superset of `SocialPost` (id, text,
// source, sentiment, sentimentLabel, impressions) plus `date` and `author`.
// Kept separate from `SocialPost` itself so this table's needs don't leak
// into `PostList`/the brand-reputation page, which only ever needed the
// smaller shape.
export type PostTableRow = {
  id: string;
  text: string;
  author: string;
  /** ISO 3166-1 alpha-2, e.g. "US" — same code system `CountryScoreList`
   * uses, for the same `react-country-flag` rendering. */
  countryCode: string;
  countryName: string;
  source: keyof typeof Icons;
  sentiment: "positive" | "negative" | "neutral";
  sentimentLabel: string;
  impressions: number;
  date: string;
};

const SENTIMENT_ICONS: Record<PostTableRow["sentiment"], typeof Smile> = {
  positive: Smile,
  negative: Frown,
  neutral: Meh,
};

const SENTIMENT_COLORS: Record<PostTableRow["sentiment"], string> = {
  positive: "--chart-positive",
  negative: "--chart-negative",
  neutral: "--chart-neutral",
};

function SortableHeader({
  column,
  label,
}: {
  column: Column<PostTableRow, unknown>;
  label: ReactNode;
}) {
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <Button
      variant="ghost"
      size="xs"
      className="-ml-2 h-7 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      <Icon className="size-3" />
    </Button>
  );
}

export function getPostColumns(): ColumnDef<PostTableRow>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => <SortableHeader column={column} label="Published" />,
      meta: { label: "Published" },
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(parseDate(row.original.date), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "source",
      header: () => <Share2 className="size-3.5 text-muted-foreground" />,
      meta: { label: "Source" },
      enableSorting: false,
      size: 40,
      cell: ({ row }) => (
        <IconBadge icon={Icons[row.original.source] ?? Icons.unknown} />
      ),
    },
    {
      accessorKey: "text",
      header: "Title",
      meta: { label: "Title" },
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block w-full truncate text-foreground" title={row.original.text}>
          {row.original.text}
        </span>
      ),
    },
    {
      accessorKey: "sentiment",
      header: ({ column }) => (
        <SortableHeader column={column} label={<Smile className="size-3.5" />} />
      ),
      meta: { label: "Sentiment" },
      cell: ({ row }) => {
        const Icon = SENTIMENT_ICONS[row.original.sentiment];
        const color = SENTIMENT_COLORS[row.original.sentiment];
        return (
          <Icon
            className="size-4"
            style={{ color: `var(${color})` }}
            aria-label={row.original.sentimentLabel}
          >
            <title>{row.original.sentimentLabel}</title>
          </Icon>
        );
      },
    },
    {
      accessorKey: "author",
      header: "Author",
      meta: { label: "Author" },
      enableSorting: false,
      cell: ({ row }) => <span className="text-foreground">{row.original.author}</span>,
    },
    {
      accessorKey: "countryCode",
      header: ({ column }) => (
        <SortableHeader column={column} label={<Flag className="size-3.5" />} />
      ),
      meta: { label: "Country" },
      cell: ({ row }) => (
        <ReactCountryFlag
          countryCode={row.original.countryCode}
          svg
          style={{ width: "1.1em", height: "1.1em" }}
          aria-label={row.original.countryName}
          title={row.original.countryName}
        />
      ),
    },
    {
      accessorKey: "impressions",
      header: ({ column }) => (
        <SortableHeader column={column} label={<ChartNoAxesColumn className="size-3.5" />} />
      ),
      meta: { label: "Impressions" },
      cell: ({ row }) => (
        <span className="tabular-nums">
          {compactNumberFormatter.format(row.original.impressions)}
        </span>
      ),
    },
  ];
}
