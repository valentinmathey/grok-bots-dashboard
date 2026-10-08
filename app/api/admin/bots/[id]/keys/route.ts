import { revalidatePath } from "next/cache";
import { getOwnerFromRequest } from "@/lib/auth";
import { jsonError, resultToResponse } from "@/lib/http";
import { regenerateOwnedKey } from "@/lib/publishing";
import { createSupabaseRepository } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const owner = await getOwnerFromRequest();
  if (!owner) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }

  const { id } = await context.params;
  const result = await regenerateOwnedKey(createSupabaseRepository(), id);
  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/bots/${result.data.bot.slug}`);
  }
  return resultToResponse(result);
}
