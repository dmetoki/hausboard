"use client";

import { ChartCard } from "@/components/dashboard/chart-card";
import { PostList } from "@/components/dashboard/post-list";
import { useRecentPosts } from "@/lib/use-posts";

const RECENT_POSTS_LIMIT = 3;

export function RecentPostsCard({ className }: { className?: string }) {
  const { posts, isLoading, error } = useRecentPosts(RECENT_POSTS_LIMIT);

  return (
    <ChartCard
      className={className}
      title="Recent Posts"
      description="Latest mentions this period"
    >
      {error ? (
        <p className="text-sm text-muted-foreground">Failed to load posts.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <PostList posts={posts} />
      )}
    </ChartCard>
  );
}
