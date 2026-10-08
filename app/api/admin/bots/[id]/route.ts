import { revalidatePath } from "next/cache";
import { getOwnerFromRequest } from "@/lib/auth";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";
import { getRepository } from "@/lib/data";
import { updateOwnedProfile } from "@/lib/publishing";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await getOwnerFromRequest();
  if (!owner) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return resultToResponse(body);
  }

  const { id } = await params;
  const result = await updateOwnedProfile(getRepository(), id, body.data);
  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/bots/${result.data.bot.slug}`);
    revalidatePath("/ajustes");
  }
  return resultToResponse(result);
}
