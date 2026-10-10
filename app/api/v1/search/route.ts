import { searchCatalogPosts } from "@/lib/catalog";
import { getRepository } from "@/lib/data";
import { resultToResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const payload = {
    q: params.get("q") ?? "",
    bot: params.get("bot") ?? undefined,
    bots: params.getAll("bot").length > 1 ? params.getAll("bot") : params.getAll("bots"),
    kind: params.get("kind") ?? undefined,
    kinds: params.getAll("kind").length > 1 ? params.getAll("kind") : params.getAll("kinds"),
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    sort: params.get("sort") ?? undefined,
    favorites: params.get("favorites") === "1" || params.get("favorites") === "true",
    limit: params.get("limit") ?? undefined,
    offset: params.get("offset") ?? undefined,
  };
  const result = await searchCatalogPosts(
    getRepository(),
    request.headers.get("authorization"),
    payload,
  );
  return resultToResponse(result);
}
