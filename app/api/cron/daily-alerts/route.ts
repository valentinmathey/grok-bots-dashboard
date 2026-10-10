import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getCronSecret } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { runDailyPushAlerts } from "@/lib/push-daily";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = getCronSecret();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return jsonError(401, "unauthorized", "Falta Authorization: Bearer CRON_SECRET");
  }
  const result = await runDailyPushAlerts(getRepository());
  return NextResponse.json({ ok: true, sent: result.sent });
}
