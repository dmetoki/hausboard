"use client";

import { useState } from "react";
import useSWR from "swr";
import type { AuthorRow } from "@/lib/authors";
import type { SocialUser } from "@/components/dashboard/user-list";
import { useFilters } from "@/context/filters-context";
import { channelIconKey, titleCaseFromKebab } from "@/lib/utils";

type AuthorsResponse = {
  authors: AuthorRow[];
};

function toCompactDate(isoDate: string) {
  return isoDate.replaceAll("-", "");
}

function toSocialUser(row: AuthorRow): SocialUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    followers: row.followers,
    channel: channelIconKey(row.channel),
    status: row.status,
    statusLabel: titleCaseFromKebab(row.status),
    profileImageUrl: row.profileImageUrl,
  };
}

async function fetcher([, from, to, limit]: [string, string, string, number]) {
  const res = await fetch("/api/authors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date_range: { from, to }, limit }),
  });
  if (!res.ok) throw new Error(`Failed to load authors (${res.status})`);
  return res.json() as Promise<AuthorsResponse>;
}

/** The "Top Authors" card's data — same "hold the last complete range"
 * fix as `useBrandReputation`/`usePosts`, see those for why. */
export function useTopAuthors(limit: number) {
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
    from && to ? ["/api/authors", from, to, limit] : null,
    fetcher,
    { keepPreviousData: true },
  );

  return {
    users: (data?.authors ?? []).map(toSocialUser),
    // Same SWR `isLoading`-vs-`keepPreviousData` fix used across every other
    // brand-reputation hook.
    isLoading: isLoading && data === undefined,
    error,
  };
}
