import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await getOwnerFromRequest())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").trim();
  const favoritesOnly = params.get("favorites") === "1";
  const result = await getRepository().searchPosts({
    q,
    bots: params.getAll("bot"),
    kinds: params.getAll("kind"),
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    favoritesOnly,
    sort: params.get("sort") === "newest" ? "newest" : "relevance",
    limit: Number(params.get("limit") ?? 20),
    offset: Number(params.get("offset") ?? 0),
  });
  if (favoritesOnly) {
    const { listFavorites } = await import("@/lib/favorites-store");
    const ids = new Set((await listFavorites()).map((row) => row.post_id));
    result.hits = result.hits.filter((hit) => ids.has(hit.id));
    result.total = result.hits.length;
  }
  return NextResponse.json(result);
}
