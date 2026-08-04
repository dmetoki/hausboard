"use client";

import { useState } from "react";
import useSWR from "swr";
import type { PostRow, PostsSortField } from "@/lib/posts";
import type { PostTableRow } from "@/components/posts/columns";
import type { SocialPost } from "@/components/dashboard/post-list";
import { Icons } from "@/components/icons";
import { useFilters } from "@/context/filters-context";
import { titleCaseFromKebab } from "@/lib/utils";

type PostsResponse = {
  posts: PostRow[];
  total_count: number;
  page: number;
  page_size: number;
  page_count: number;
};

type PostsFetchParams = {
  page: number;
  pageSize: number;
  sortBy: PostsSortField;
  sortOrder: "asc" | "desc";
  search: string;
  sentiments: string[];
  channels: string[];
};

export type UsePostsParams = PostsFetchParams;

function toCompactDate(isoDate: string) {
  return isoDate.replaceAll("-", "");
}

// The stored channel value doesn't always match the icon set's key (e.g.
// Twitter's rebrand to X) — translated here, once, rather than forcing every
// consumer to know about the mismatch.
const CHANNEL_ICON_KEY: Record<string, keyof typeof Icons> = {
  twitter: "x",
};

function channelIconKey(channel: string): keyof typeof Icons {
  const mapped = CHANNEL_ICON_KEY[channel] ?? channel;
  return mapped in Icons ? (mapped as keyof typeof Icons) : "unknown";
}

// The legacy mentions collection has no country data yet — fixed placeholder
// until a real per-post country field exists upstream.
const MOCK_COUNTRY_CODE = "US";
const MOCK_COUNTRY_NAME = "United States";

function toTableRow(row: PostRow): PostTableRow {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    countryCode: MOCK_COUNTRY_CODE,
    countryName: MOCK_COUNTRY_NAME,
    channel: channelIconKey(row.channel),
    url: row.url,
    sentiment: row.sentiment,
    sentimentLabel: titleCaseFromKebab(row.sentiment),
    impressions: row.impressions,
    date: row.published,
  };
}

function toSocialPost(row: PostRow): SocialPost {
  return {
    id: row.id,
    text: row.text,
    channel: channelIconKey(row.channel),
    impressions: row.impressions,
    likes: row.likes,
    sentiment: row.sentiment,
    sentimentLabel: titleCaseFromKebab(row.sentiment),
  };
}

async function fetcher([, from, to, page, pageSize, sortBy, sortOrder, search, sentiments, channels]: [
  string,
  string,
  string,
  number,
  number,
  PostsSortField,
  "asc" | "desc",
  string,
  string[],
  string[],
]) {
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date_range: { from, to },
      page,
      page_size: pageSize,
      sort_by: sortBy,
      sort_order: sortOrder,
      search,
      sentiments,
      channels,
    }),
  });
  if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
  return res.json() as Promise<PostsResponse>;
}

/** Shared by every posts-endpoint consumer: holds the date range (same
 * "last complete range" fix as `useBrandReputation`) and runs the SWR
 * fetch. Callers map the raw `PostRow[]` into whatever shape they need. */
function usePostsFetch(params: PostsFetchParams) {
  const { filters } = useFilters();

  const completeRange =
    filters?.from && filters?.to
      ? { from: filters.from, to: filters.to }
      : undefined;
  const [range, setRange] = useState(completeRange);
  if (
    completeRange &&
    (completeRange.from !== range?.from || completeRange.to !== range?.to)
  ) {
    setRange(completeRange);
  }

  const from = range ? toCompactDate(range.from) : undefined;
  const to = range ? toCompactDate(range.to) : undefined;

  const { data, error, isLoading } = useSWR(
    from && to
      ? [
          "/api/posts",
          from,
          to,
          params.page,
          params.pageSize,
          params.sortBy,
          params.sortOrder,
          params.search,
          params.sentiments,
          params.channels,
        ]
      : null,
    fetcher,
    { keepPreviousData: true },
  );

  return {
    data,
    error,
    // Same SWR `isLoading`-vs-`keepPreviousData` fix as `useBrandReputation`.
    isLoading: isLoading && data === undefined,
  };
}

export function usePosts(params: UsePostsParams) {
  const { data, error, isLoading } = usePostsFetch(params);

  return {
    posts: (data?.posts ?? []).map(toTableRow),
    totalCount: data?.total_count ?? 0,
    pageCount: data?.page_count ?? 1,
    isLoading,
    error,
  };
}

/** The "Recent Posts" card's data — same `/api/posts` endpoint, just the
 * newest `limit` posts with no filters, rather than a dedicated endpoint. */
export function useRecentPosts(limit: number) {
  const { data, error, isLoading } = usePostsFetch({
    page: 0,
    pageSize: limit,
    sortBy: "date",
    sortOrder: "desc",
    search: "",
    sentiments: [],
    channels: [],
  });

  return {
    posts: (data?.posts ?? []).map(toSocialPost),
    isLoading,
    error,
  };
}
