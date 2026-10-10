import { isPreviewMode } from "@/lib/env";
import { fail } from "@/lib/http";
import { authenticateBot, requireWrite, type BotsRepository } from "@/lib/publishing";
import { canReadAll } from "@/lib/scopes";
import type { Result } from "@/lib/types";

export const REQUEST_STATUSES = ["pendiente", "en_progreso", "respondido", "descartado"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export type BotRequest = {
  id: string;
  bot_id: string;
  post_id: string | null;
  item_key: string | null;
  kind: "comment" | "request";
  body: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  claimed_at: string | null;
  answered_at: string | null;
  unread: boolean;
};

export type RequestMessage = {
  id: string;
  request_id: string;
  author: "owner" | "bot";
  body: string;
  linked_post_id: string | null;
  created_at: string;
};

const memory = {
  requests: [] as BotRequest[],
  messages: [] as RequestMessage[],
};

function nowIso() {
  return new Date().toISOString();
}

async function useAdmin() {
  if (isPreviewMode()) return null;
  const { createAdminClient } = await import("@/lib/supabase/admin");
  return createAdminClient();
}

export async function createRequest(input: {
  bot_id: string;
  post_id?: string | null;
  item_key?: string | null;
  body: string;
  kind?: "comment" | "request";
}): Promise<BotRequest> {
  const row: BotRequest = {
    id: `req_${memory.requests.length + 1}_${Date.now()}`,
    bot_id: input.bot_id,
    post_id: input.post_id ?? null,
    item_key: input.item_key ?? null,
    kind: input.kind ?? "request",
    body: input.body.trim(),
    status: "pendiente",
    created_at: nowIso(),
    updated_at: nowIso(),
    claimed_at: null,
    answered_at: null,
    unread: false,
  };
  const admin = await useAdmin();
  if (!admin) {
    memory.requests.unshift(row);
    memory.messages.push({
      id: `msg_${memory.messages.length + 1}`,
      request_id: row.id,
      author: "owner",
      body: row.body,
      linked_post_id: null,
      created_at: row.created_at,
    });
    return row;
  }
  const { data, error } = await admin
    .from("bot_requests")
    .insert({
      bot_id: row.bot_id,
      post_id: row.post_id,
      item_key: row.item_key,
      kind: row.kind,
      body: row.body,
    })
    .select("*")
    .single();
  if (error) throw error;
  await admin.from("bot_request_messages").insert({
    request_id: data.id,
    author: "owner",
    body: row.body,
  });
  return data as BotRequest;
}

export async function listRequests(filter: {
  botId?: string;
  status?: RequestStatus;
  postId?: string;
}): Promise<BotRequest[]> {
  const admin = await useAdmin();
  if (!admin) {
    return memory.requests.filter((row) => {
      if (filter.botId && row.bot_id !== filter.botId) return false;
      if (filter.status && row.status !== filter.status) return false;
      if (filter.postId && row.post_id !== filter.postId) return false;
      return true;
    });
  }
  let query = admin.from("bot_requests").select("*").order("created_at", { ascending: false });
  if (filter.botId) query = query.eq("bot_id", filter.botId);
  if (filter.status) query = query.eq("status", filter.status);
  if (filter.postId) query = query.eq("post_id", filter.postId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BotRequest[];
}

export async function listMessages(requestId: string): Promise<RequestMessage[]> {
  const admin = await useAdmin();
  if (!admin) return memory.messages.filter((row) => row.request_id === requestId);
  const { data, error } = await admin
    .from("bot_request_messages")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RequestMessage[];
}

export async function ownerUpdateRequest(
  id: string,
  patch: { status?: RequestStatus; body?: string },
) {
  const admin = await useAdmin();
  if (!admin) {
    const row = memory.requests.find((item) => item.id === id);
    if (!row) return null;
    if (patch.status) row.status = patch.status;
    if (patch.body) {
      row.body = patch.body;
      row.status = "pendiente";
      memory.messages.push({
        id: `msg_${memory.messages.length + 1}`,
        request_id: id,
        author: "owner",
        body: patch.body,
        linked_post_id: null,
        created_at: nowIso(),
      });
    }
    row.updated_at = nowIso();
    row.unread = false;
    return row;
  }
  const next: Record<string, unknown> = { updated_at: nowIso(), unread: false };
  if (patch.status) next.status = patch.status;
  const { data } = await admin.from("bot_requests").update(next).eq("id", id).select("*").single();
  if (patch.body) {
    await admin.from("bot_request_messages").insert({
      request_id: id,
      author: "owner",
      body: patch.body,
    });
    await admin.from("bot_requests").update({ status: "pendiente", updated_at: nowIso() }).eq("id", id);
  }
  return data as BotRequest;
}

export async function claimRequest(botId: string, id: string): Promise<Result<BotRequest>> {
  const admin = await useAdmin();
  if (!admin) {
    const row = memory.requests.find((item) => item.id === id);
    if (!row || row.bot_id !== botId) {
      return fail(404, "not_found", "Ese pedido no es de este bot");
    }
    row.status = "en_progreso";
    row.claimed_at = nowIso();
    row.updated_at = nowIso();
    return { ok: true, data: row };
  }
  const { data } = await admin.from("bot_requests").select("*").eq("id", id).maybeSingle();
  if (!data || data.bot_id !== botId) {
    return fail(404, "not_found", "Ese pedido no es de este bot");
  }
  const { data: updated } = await admin
    .from("bot_requests")
    .update({ status: "en_progreso", claimed_at: nowIso(), updated_at: nowIso() })
    .eq("id", id)
    .select("*")
    .single();
  return { ok: true, data: updated as BotRequest };
}

export async function replyRequest(
  botId: string,
  id: string,
  input: { body: string; linked_post_id?: string | null; status?: RequestStatus },
): Promise<Result<BotRequest>> {
  const admin = await useAdmin();
  const status = input.status ?? "respondido";
  if (!admin) {
    const row = memory.requests.find((item) => item.id === id);
    if (!row || row.bot_id !== botId) {
      return fail(404, "not_found", "Ese pedido no es de este bot");
    }
    row.status = status;
    row.answered_at = nowIso();
    row.updated_at = nowIso();
    row.unread = true;
    memory.messages.push({
      id: `msg_${memory.messages.length + 1}`,
      request_id: id,
      author: "bot",
      body: input.body,
      linked_post_id: input.linked_post_id ?? null,
      created_at: nowIso(),
    });
    return { ok: true, data: row };
  }
  const { data } = await admin.from("bot_requests").select("*").eq("id", id).maybeSingle();
  if (!data || data.bot_id !== botId) {
    return fail(404, "not_found", "Ese pedido no es de este bot");
  }
  await admin.from("bot_request_messages").insert({
    request_id: id,
    author: "bot",
    body: input.body,
    linked_post_id: input.linked_post_id ?? null,
  });
  const { data: updated } = await admin
    .from("bot_requests")
    .update({
      status,
      answered_at: nowIso(),
      updated_at: nowIso(),
      unread: true,
    })
    .eq("id", id)
    .select("*")
    .single();
  return { ok: true, data: updated as BotRequest };
}

export async function botListRequests(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<Result<{ requests: BotRequest[] }>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) return auth;
  if (!canReadAll(auth.data.scopes) && !auth.data.scopes.includes("publish")) {
    return fail(403, "forbidden", "Esta clave no puede listar pedidos");
  }
  const status = (payload as { status?: RequestStatus } | null)?.status;
  const rows = await listRequests({
    botId: auth.data.botId,
    status: status && REQUEST_STATUSES.includes(status) ? status : undefined,
  });
  return { ok: true, data: { requests: rows } };
}

export async function botClaimRequest(
  repo: BotsRepository,
  authorization: string | null,
  id: string,
): Promise<Result<BotRequest>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) return auth;
  const write = requireWrite(auth.data);
  if (!write.ok) return write;
  return claimRequest(auth.data.botId, id);
}

export async function botReplyRequest(
  repo: BotsRepository,
  authorization: string | null,
  id: string,
  payload: unknown,
): Promise<Result<BotRequest>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) return auth;
  const write = requireWrite(auth.data);
  if (!write.ok) return write;
  const body = String((payload as { body?: unknown } | null)?.body ?? "").trim();
  if (!body) return fail(400, "invalid_input", "Falta body");
  const result = await replyRequest(auth.data.botId, id, {
    body,
    linked_post_id: ((payload as { linked_post_id?: string }).linked_post_id ?? null),
    status: (payload as { status?: RequestStatus }).status,
  });
  if (result.ok) {
    try {
      const { sendPush } = await import("@/lib/push");
      const { buildPushPayload } = await import("@/lib/push-payload");
      await sendPush(
        buildPushPayload({
          type: "new_post",
          bot: { id: auth.data.botId, name: auth.data.name, slug: auth.data.slug },
          extra: "El bot respondió un pedido",
        }),
      );
    } catch {
      /* push opcional */
    }
  }
  return result;
}
