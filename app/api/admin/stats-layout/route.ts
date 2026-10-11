import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";
import { mergeStatsLayout } from "@/lib/stats-layout";
import { readStatsLayout, writeStatsLayout } from "@/lib/stats-preferences";

export const dynamic = "force-dynamic";

export async function GET() {
  const owner = await getOwnerFromRequest();
  if (!owner) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  return NextResponse.json({ layout: await readStatsLayout() });
}

export async function PUT(request: Request) {
  const owner = await getOwnerFromRequest();
  if (!owner) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const body = await readJsonBody(request);
  if (!body.ok) {
    return resultToResponse(body);
  }
  const layout = mergeStatsLayout((body.data as { layout?: unknown }).layout);
  return NextResponse.json({ layout: await writeStatsLayout(layout) });
}
