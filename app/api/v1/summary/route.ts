import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/data";
import { resultToResponse } from "@/lib/http";
import { publishWeeklySummaryForBot } from "@/lib/summary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = await publishWeeklySummaryForBot(
    getRepository(),
    request.headers.get("authorization"),
  );

  if (result.ok) {
    revalidatePath("/");
    revalidatePath(`/bots/${result.data.bot.slug}`);
  }

  return resultToResponse(result, result.ok && result.data.created ? 201 : 200);
}
