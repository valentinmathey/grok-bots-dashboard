import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";
import { createAgendaToken, listAgendaTokenPrefixes, revokeAgendaTokens } from "@/lib/agenda-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getOwnerFromRequest())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  return NextResponse.json({ prefixes: await listAgendaTokenPrefixes() });
}

export async function POST(request: Request) {
  if (!(await getOwnerFromRequest())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const body = await readJsonBody(request);
  if (!body.ok) return resultToResponse(body);
  const action = (body.data as { action?: string }).action;
  if (action === "revoke") {
    await revokeAgendaTokens();
    return NextResponse.json({ ok: true });
  }
  const created = await createAgendaToken();
  return NextResponse.json({
    token: created.token,
    prefix: created.prefix,
    url: `${getSiteUrl()}/api/agenda.ics?token=${created.token}`,
  });
}
