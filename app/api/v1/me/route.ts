import { resultToResponse } from "@/lib/http";
import { getRepository } from "@/lib/data";
import { authenticateBot } from "@/lib/publishing";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const repo = getRepository();
  const result = await authenticateBot(
    repo,
    request.headers.get("authorization"),
  );

  if (!result.ok) {
    return resultToResponse(result);
  }

  return resultToResponse({
    ok: true,
    data: {
      bot: {
        id: result.data.botId,
        name: result.data.name,
        slug: result.data.slug,
        status: result.data.status,
        scopes: result.data.scopes,
      },
    },
  });
}
