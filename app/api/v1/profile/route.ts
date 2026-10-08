import { revalidatePath } from "next/cache";
import { readJsonBody, resultToResponse } from "@/lib/http";
import { updateBotProfile } from "@/lib/publishing";
import { createSupabaseRepository } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return resultToResponse(body);
  }

  const repo = createSupabaseRepository();
  const result = await updateBotProfile(
    repo,
    request.headers.get("authorization"),
    body.data,
  );

  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/bots/${result.data.bot.slug}`);
    revalidatePath("/ajustes");
  }

  return resultToResponse(result);
}
