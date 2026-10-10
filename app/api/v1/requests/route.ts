import { botListRequests } from "@/lib/requests";
import { getRepository } from "@/lib/data";
import { resultToResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const result = await botListRequests(
    getRepository(),
    request.headers.get("authorization"),
    params,
  );
  return resultToResponse(result);
}
