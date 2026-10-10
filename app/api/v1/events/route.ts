import { listCatalogEvents } from "@/lib/catalog";
import { getRepository } from "@/lib/data";
import { resultToResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const repo = getRepository();
  const result = await listCatalogEvents(
    repo,
    request.headers.get("authorization"),
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  return resultToResponse(result);
}
