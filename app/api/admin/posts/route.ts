import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { PAGE_SIZE, parseFeedQuery } from "@/lib/filters";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const owner = await getOwnerFromRequest();
  if (!owner) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug")?.trim();
  if (!slug) {
    return jsonError(400, "invalid_input", "Falta el slug del bot");
  }

  const search = Object.fromEntries(url.searchParams.entries());
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const limit = Number(url.searchParams.get("limit") ?? PAGE_SIZE);

  const repo = getRepository();
  const bot = await repo.getBotBySlug(slug);
  if (!bot) {
    return jsonError(404, "not_found", "No encontramos ese bot");
  }

  const facets = await repo.listFacets(bot.id);
  const query = parseFeedQuery(search, { hasEvents: facets.has_events });

  const page = await repo.listPostsPage(bot.id, query, {
    sort: query.sort,
    offset: Number.isFinite(offset) ? Math.max(0, offset) : 0,
    limit: Number.isFinite(limit) ? Math.min(Math.max(1, limit), 50) : PAGE_SIZE,
  });

  return NextResponse.json(page);
}
