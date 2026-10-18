import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";
import { formatZodError } from "@/lib/validations";
import {
  createWatchlistItem,
  createWatchlistSchema,
  deleteWatchlistItem,
  listWatchlist,
  updateWatchlistItem,
  updateWatchlistSchema,
} from "@/lib/watchlist";

export const dynamic = "force-dynamic";

async function guard() {
  return (await getOwnerFromRequest())
    ? null
    : jsonError(401, "unauthorized", "Tenés que entrar como dueño");
}

export async function GET(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  const botId = new URL(request.url).searchParams.get("bot_id");
  if (!botId) return jsonError(400, "invalid_input", "Falta bot_id");
  return NextResponse.json({ items: await listWatchlist(botId) });
}

export async function POST(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await readJsonBody(request);
  if (!body.ok) return resultToResponse(body);
  const parsed = createWatchlistSchema.safeParse(body.data);
  if (!parsed.success)
    return jsonError(
      400,
      "invalid_input",
      "Producto inválido",
      formatZodError(parsed.error),
    );
  return NextResponse.json({ item: await createWatchlistItem(parsed.data) });
}

export async function PATCH(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  const body = await readJsonBody(request);
  if (!body.ok) return resultToResponse(body);
  const parsed = updateWatchlistSchema.safeParse(body.data);
  if (!parsed.success)
    return jsonError(
      400,
      "invalid_input",
      "Cambio inválido",
      formatZodError(parsed.error),
    );
  const item = await updateWatchlistItem(parsed.data);
  if (!item) return jsonError(404, "not_found", "No existe");
  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const denied = await guard();
  if (denied) return denied;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError(400, "invalid_input", "Falta id");
  await deleteWatchlistItem(id);
  return NextResponse.json({ ok: true });
}
