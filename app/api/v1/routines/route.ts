import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { readJsonBody, resultToResponse } from "@/lib/http";
import { botGetRoutines, botSetRoutines } from "@/lib/routines";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return resultToResponse(await botGetRoutines(getRepository(), request.headers.get("authorization")));
}

export async function PUT(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return resultToResponse(body);
  const result = await botSetRoutines(getRepository(), request.headers.get("authorization"), body.data);
  if (result.ok) revalidatePath("/rutinas");
  return resultToResponse(result);
}
