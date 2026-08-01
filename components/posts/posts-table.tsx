"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Frown,
  Loader2,
  Meh,
  Search,
  Smile,
} from "lucide-react";
import { Icons } from "@/components/icons";
import { fetchMockPosts } from "@/lib/mock-metrics";
import { getPostColumns } from "@/components/posts/columns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DataTableFacetedFilter,
  type FacetedFilterOption,
} from "@/components/ui/data-table-faceted-filter";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Every column except "text" gets an explicit width — combined with
// `table-fixed` on the table itself, that's what lets "text" (Title) soak
// up whatever space is left instead of overflowing or leaving a gap.
const COLUMN_WIDTHS: Record<string, string> = {
  date: "w-28",
  source: "w-10 text-center",
  sentiment: "w-10 text-center",
  author: "w-32",
  countryCode: "w-10 text-center",
  impressions: "w-24",
};

// Same fixed status-color convention used everywhere else sentiment shows
// up in the dashboard — not decorative color.
const SENTIMENT_OPTIONS: FacetedFilterOption[] = [
  {
    label: "Positive",
    value: "positive",
    icon: <Smile className="size-3.5" style={{ color: "var(--chart-positive)" }} />,
  },
  {
    label: "Neutral",
    value: "neutral",
    icon: <Meh className="size-3.5" style={{ color: "var(--chart-neutral)" }} />,
  },
  {
    label: "Negative",
    value: "negative",
    icon: <Frown className="size-3.5" style={{ color: "var(--chart-negative)" }} />,
  },
];

// Only the sources actually present in the mock post pool — matches
// `MOCK_POST_TEXTS` in lib/mock-metrics.ts.
const CHANNEL_OPTIONS: FacetedFilterOption[] = (
  ["x", "news", "linkedin", "blog", "reddit"] as const
).map((source) => {
  const Icon = Icons[source];
  return {
    label: source[0].toUpperCase() + source.slice(1),
    value: source,
    icon: <Icon className="size-3.5" />,
  };
});

export function PostsTable() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sentiments, setSentiments] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  function updateSentiments(values: string[]) {
    setSentiments(values);
    setPageIndex(0);
  }

  function updateSources(values: string[]) {
    setSources(values);
    setPageIndex(0);
  }

  function updatePageSize(value: number) {
    setPageSize(value);
    setPageIndex(0);
  }

  // Same 500ms debounce the reference uses — resets to page 1 once the
  // debounced value actually changes, not on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPageIndex(0);
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const columns = useMemo(() => getPostColumns(), []);
  const sort = sorting[0];

  // Keyed on every param the mock "endpoint" depends on — swapping
  // `fetchMockPosts` for a real fetch later needs no change here.
  const { data, isLoading } = useSWR(
    ["posts", pageIndex, pageSize, sort?.id, sort?.desc, search, sentiments, sources],
    () =>
      fetchMockPosts({
        page: pageIndex,
        pageSize,
        sortBy: sort?.id ?? "date",
        sortOrder: sort?.desc === false ? "asc" : "desc",
        search,
        sentiments,
        sources,
      }),
    { keepPreviousData: true },
  );

  const posts = data?.posts ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  const table = useReactTable({
    data: posts,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPageIndex(0);
    },
    onColumnVisibilityChange: setColumnVisibility,
    manualSorting: true,
    manualPagination: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
  });

  const visibleColumnCount = table.getVisibleLeafColumns().length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-96">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search posts..."
            className="pl-8 text-xs md:text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <DataTableFacetedFilter
            title="Sentiment"
            options={SENTIMENT_OPTIONS}
            selected={sentiments}
            onSelectedChange={updateSentiments}
          />
          <DataTableFacetedFilter
            title="Channel"
            options={CHANNEL_OPTIONS}
            selected={sources}
            onSelectedChange={updateSources}
          />
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <div className="relative">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={COLUMN_WIDTHS[header.column.id]}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {posts.length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-24 text-center text-muted-foreground">
                  No posts match your search.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={COLUMN_WIDTHS[cell.column.id]}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-popover/60">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => updatePageSize(Number(value))}
          >
            <SelectTrigger className="h-7 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="justify-self-center">{totalCount.toLocaleString()} posts</span>
        <div className="flex items-center justify-self-end gap-2">
          <span>
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex(0)}
          >
            <ChevronFirst className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((page) => Math.max(0, page - 1))}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={pageIndex + 1 >= pageCount}
            onClick={() => setPageIndex((page) => Math.min(pageCount - 1, page + 1))}
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={pageIndex + 1 >= pageCount}
            onClick={() => setPageIndex(pageCount - 1)}
          >
            <ChevronLast className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
