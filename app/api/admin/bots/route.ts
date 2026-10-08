import { revalidatePath } from "next/cache";
import { getOwnerFromRequest } from "@/lib/auth";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";
import { createOwnedBot } from "@/lib/publishing";
import { createSupabaseRepository } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const owner = await getOwnerFromRequest();
  if (!owner) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return resultToResponse(body);
  }

  const result = await createOwnedBot(createSupabaseRepository(), body.data);
  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/bots/${result.data.bot.slug}`);
  }
  return resultToResponse(result, 201);
}
