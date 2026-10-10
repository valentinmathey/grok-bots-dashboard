import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const owner = await getOwnerFromRequest();
  if (!owner) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return resultToResponse(body);
  }
  const ids = (body.data as { ids?: unknown }).ids;
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string" && id.trim())) {
    return jsonError(400, "invalid_input", "Mandá ids: string[] con el orden nuevo");
  }

  const repo = getRepository();
  const bots = await repo.reorderBots(ids.map((id) => id.trim()));
  revalidatePath("/");
  revalidatePath("/ajustes");
  return NextResponse.json({ bots });
}
