import { botClaimRequest } from "@/lib/requests";
import { getRepository } from "@/lib/data";
import { resultToResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await botClaimRequest(
    getRepository(),
    request.headers.get("authorization"),
    id,
  );
  return resultToResponse(result);
}
