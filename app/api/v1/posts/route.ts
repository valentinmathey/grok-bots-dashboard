import { revalidatePath } from "next/cache";
import { listCatalogPosts } from "@/lib/catalog";
import { readJsonBody, resultToResponse } from "@/lib/http";
import { getRepository } from "@/lib/data";
import { publishPost } from "@/lib/publishing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const repo = getRepository();
  const result = await listCatalogPosts(
    repo,
    request.headers.get("authorization"),
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  return resultToResponse(result);
}

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return resultToResponse(body);
  }

  const repo = getRepository();
  const result = await publishPost(
    repo,
    request.headers.get("authorization"),
    body.data,
  );

  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/bots/${result.data.bot.slug}`);
  }

  return resultToResponse(result, 201);
}
