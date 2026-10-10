import { revalidatePath } from "next/cache";
import { readJsonBody, resultToResponse } from "@/lib/http";
import { getRepository } from "@/lib/data";
import { deleteOwnPost, updateOwnPost } from "@/lib/publishing";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return resultToResponse(body);
  }

  const { id } = await params;
  const repo = getRepository();
  const result = await updateOwnPost(
    repo,
    request.headers.get("authorization"),
    id,
    body.data,
  );

  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/bots/${result.data.bot.slug}`);
  }

  return resultToResponse(result);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const repo = getRepository();
  const result = await deleteOwnPost(
    repo,
    request.headers.get("authorization"),
    id,
  );

  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/bots/${result.data.bot.slug}`);
  }

  return resultToResponse(result);
}
