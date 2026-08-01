import { auth } from "@clerk/nextjs/server";
import { ChartCard } from "@/components/dashboard/chart-card";
import { PostsTable } from "@/components/posts/posts-table";

export default async function PostsPage() {
  await auth.protect();

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-5">
      <ChartCard className="md:col-span-4">
        <PostsTable />
      </ChartCard>
      {/* Placeholder for a future ad-hoc filters panel — intentionally
          empty for now. */}
      <ChartCard className="md:col-span-1">{null}</ChartCard>
    </div>
  );
}
