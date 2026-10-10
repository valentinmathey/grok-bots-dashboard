import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getRepository } from "@/lib/data";
import { getCronSecret } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { upsertWeeklySummary } from "@/lib/summary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = getCronSecret();
  if (!secret) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return jsonError(401, "unauthorized", "Falta Authorization: Bearer CRON_SECRET");
  }

  const result = await upsertWeeklySummary(getRepository());
  if (!result.ok) {
    return jsonError(
      result.status,
      result.error.code,
      result.error.message,
      result.error.details,
    );
  }

  revalidatePath("/");
  revalidatePath(`/bots/${result.data.bot.slug}`);

  return NextResponse.json({
    ok: true,
    created: result.data.created,
    week_key: result.data.week_key,
    post_id: result.data.post.id,
  });
}
