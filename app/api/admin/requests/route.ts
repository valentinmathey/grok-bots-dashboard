import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";
import {
  createRequest,
  listMessages,
  listRequests,
  ownerUpdateRequest,
  REQUEST_STATUSES,
  type RequestStatus,
} from "@/lib/requests";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await getOwnerFromRequest())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const params = new URL(request.url).searchParams;
  const status = params.get("status") as RequestStatus | null;
  const rows = await listRequests({
    botId: params.get("bot") ?? undefined,
    postId: params.get("post") ?? undefined,
    status: status && REQUEST_STATUSES.includes(status) ? status : undefined,
  });
  const withMessages = await Promise.all(
    rows.map(async (row) => ({ ...row, messages: await listMessages(row.id) })),
  );
  return NextResponse.json({ requests: withMessages });
}

export async function POST(request: Request) {
  if (!(await getOwnerFromRequest())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const body = await readJsonBody(request);
  if (!body.ok) return resultToResponse(body);
  const data = body.data as {
    bot_id?: string;
    post_id?: string;
    body?: string;
    id?: string;
    status?: RequestStatus;
    reply?: string;
  };
  if (data.id) {
    const updated = await ownerUpdateRequest(data.id, {
      status: data.status,
      body: data.reply,
    });
    return NextResponse.json({ request: updated });
  }
  if (!data.bot_id || !data.body?.trim()) {
    return jsonError(400, "invalid_input", "Faltan bot_id y body");
  }
  const created = await createRequest({
    bot_id: data.bot_id,
    post_id: data.post_id,
    body: data.body,
  });
  return NextResponse.json({ request: created }, { status: 201 });
}
