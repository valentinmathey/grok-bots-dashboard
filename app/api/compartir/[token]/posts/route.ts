import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { PAGE_SIZE, parseFeedQuery } from "@/lib/filters";
import { jsonError } from "@/lib/http";
import { resolveShare } from "@/lib/share";

export const dynamic = "force-dynamic";

const robots = { "X-Robots-Tag": "noindex, nofollow" };

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const repo = getRepository();
  const share = await resolveShare(repo, token);
  if (!share.ok) {
    return jsonError(404, "not_found", "No encontramos ese link");
  }

  const url = new URL(request.url);
  const search = Object.fromEntries(url.searchParams.entries());
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number(url.searchParams.get("limit") ?? PAGE_SIZE);

  const facets = await repo.listFacets(share.data.bot.id);
  const query = parseFeedQuery(search, {
    hasEvents: facets.has_events,
    hasAlojamientos: facets.has_alojamientos,
  });
  const page = await repo.listPostsPage(share.data.bot.id, query, {
    sort: query.sort,
    offset: Number.isFinite(offset) ? Math.max(0, offset) : 0,
    limit: Number.isFinite(limit) ? Math.min(Math.max(1, limit), 50) : PAGE_SIZE,
  });

  return NextResponse.json(page, { headers: robots });
}
