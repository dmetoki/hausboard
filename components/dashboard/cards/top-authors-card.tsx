"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { UserList } from "@/components/dashboard/user-list";
import { useTopAuthors } from "@/lib/use-authors";

const TOP_AUTHORS_LIMIT = 5;

export function TopAuthorsCard({ className }: { className?: string }) {
  const { users, isLoading, error } = useTopAuthors(TOP_AUTHORS_LIMIT);

  return (
    <ChartCard
      className={className}
      title="Top Authors"
      description="Most followed authors this period"
    >
      {error ? (
        <p className="text-sm text-muted-foreground">Failed to load authors.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <UserList users={users} />
      )}
    </ChartCard>
  );
}
