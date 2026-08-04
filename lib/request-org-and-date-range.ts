import "server-only";
import { auth } from "@clerk/nextjs/server";

const DATE_PATTERN = /^\d{8}$/;

export function isValidCompactDate(value: unknown): value is string {
  return typeof value === "string" && DATE_PATTERN.test(value);
}

type ResolvedOrgAndDateRange =
  | { ok: true; orgId: string; from: string; to: string }
  | { ok: false; status: number; error: string };

/**
 * Shared by every brand-reputation-area POST route: resolves `orgId` from
 * Clerk's session (with the dev-only body override), then validates
 * `date_range.from`/`date_range.to` as `YYYYMMDD` strings. Centralized so
 * every route enforces the exact same auth/validation rules instead of each
 * reimplementing (and potentially drifting from) the same checks.
 */
export async function resolveOrgAndDateRange(
  body: Record<string, unknown> | null,
): Promise<ResolvedOrgAndDateRange> {
  const { orgId: sessionOrgId } = await auth();
  // Dev-only convenience: lets Postman/curl exercise these routes without
  // replicating Clerk session cookies. Strictly gated so a client-supplied
  // org_id can never substitute for a real session in production.
  const devOrgId =
    process.env.NODE_ENV !== "production"
      ? (body?.org_id as string | undefined)
      : undefined;
  const orgId = sessionOrgId ?? devOrgId;

  if (!orgId) {
    return { ok: false, status: 401, error: "No active organization" };
  }

  const dateRange = body?.date_range as { from?: unknown; to?: unknown } | undefined;
  const from = dateRange?.from;
  const to = dateRange?.to;

  if (!isValidCompactDate(from) || !isValidCompactDate(to) || from > to) {
    return {
      ok: false,
      status: 400,
      error: "date_range.from and date_range.to are required as YYYYMMDD strings, with from <= to",
    };
  }

  return { ok: true, orgId, from, to };
}
