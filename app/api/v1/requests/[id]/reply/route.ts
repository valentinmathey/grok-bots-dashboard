import { botReplyRequest } from "@/lib/requests";
import { getRepository } from "@/lib/data";
import { readJsonBody, resultToResponse } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body.ok) return resultToResponse(body);
  const result = await botReplyRequest(
    getRepository(),
    request.headers.get("authorization"),
    id,
    body.data,
  );
  return resultToResponse(result);
}
