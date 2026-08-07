import { NextResponse, type NextRequest } from "next/server";
import { getTopAuthors } from "@/lib/authors";
import { resolveOrgAndDateRange } from "@/lib/request-org-and-date-range";

const MAX_LIMIT = 50;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const resolved = await resolveOrgAndDateRange(body);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { orgId, from, to } = resolved;

  const limit =
    Number.isInteger(body?.limit) && body.limit > 0
      ? Math.min(body.limit, MAX_LIMIT)
      : 5;

  let authors;
  try {
    authors = await getTopAuthors(orgId, from, to, limit);
  } catch (error) {
    console.error("Failed to load authors:", error);
    return NextResponse.json({ error: "Failed to load authors" }, { status: 500 });
  }

  return NextResponse.json({ authors });
}
