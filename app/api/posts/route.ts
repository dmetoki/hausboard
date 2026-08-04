import { NextResponse, type NextRequest } from "next/server";
import { getPosts, type PostsSortField } from "@/lib/posts";
import { resolveOrgAndDateRange } from "@/lib/request-org-and-date-range";

const SORT_FIELDS: PostsSortField[] = ["date", "sentiment", "impressions"];
const MAX_PAGE_SIZE = 100;

function isSortField(value: unknown): value is PostsSortField {
  return typeof value === "string" && SORT_FIELDS.includes(value as PostsSortField);
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const resolved = await resolveOrgAndDateRange(body);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { orgId, from, to } = resolved;

  const page = Number.isInteger(body?.page) && body.page >= 0 ? body.page : 0;
  const pageSize =
    Number.isInteger(body?.page_size) && body.page_size > 0
      ? Math.min(body.page_size, MAX_PAGE_SIZE)
      : 10;
  const sortBy = isSortField(body?.sort_by) ? body.sort_by : "date";
  const sortOrder = body?.sort_order === "asc" ? "asc" : "desc";
  const search = typeof body?.search === "string" ? body.search : "";
  const sentiments = stringArray(body?.sentiments);
  const channels = stringArray(body?.channels);

  let data;
  try {
    data = await getPosts({
      orgId,
      from,
      to,
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
      sentiments,
      channels,
    });
  } catch (error) {
    console.error("Failed to load posts:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }

  return NextResponse.json({
    posts: data.posts,
    total_count: data.totalCount,
    page,
    page_size: pageSize,
    page_count: Math.max(1, Math.ceil(data.totalCount / pageSize)),
  });
}
