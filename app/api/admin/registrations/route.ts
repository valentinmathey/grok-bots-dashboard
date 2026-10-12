import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";
import { listRegisteredIds, setRegistered } from "@/lib/registrations-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getOwnerFromRequest())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  return NextResponse.json({ post_ids: await listRegisteredIds() });
}

export async function POST(request: Request) {
  if (!(await getOwnerFromRequest())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const body = await readJsonBody(request);
  if (!body.ok) return resultToResponse(body);
  const data = body.data as { post_id?: string; registered?: boolean };
  if (!data.post_id) return jsonError(400, "invalid_input", "Falta post_id");
  return NextResponse.json(await setRegistered(data.post_id, data.registered !== false));
}
