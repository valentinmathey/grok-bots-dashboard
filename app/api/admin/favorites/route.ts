import { NextResponse } from "next/server";
import { getOwnerFromRequest } from "@/lib/auth";
import { jsonError, readJsonBody, resultToResponse } from "@/lib/http";
import {
  listFavorites,
  listItemFavorites,
  setFavoriteNote,
  toggleFavorite,
  toggleItemFavorite,
} from "@/lib/favorites-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getOwnerFromRequest())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const [posts, items] = await Promise.all([listFavorites(), listItemFavorites()]);
  return NextResponse.json({ posts, items });
}

export async function POST(request: Request) {
  if (!(await getOwnerFromRequest())) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const body = await readJsonBody(request);
  if (!body.ok) return resultToResponse(body);
  const data = body.data as {
    post_id?: string;
    note?: string | null;
    item_key?: string;
    label?: string;
    url?: string;
    price_at_save?: number;
    action?: string;
  };
  if (!data.post_id) return jsonError(400, "invalid_input", "Falta post_id");
  if (data.action === "note") {
    await setFavoriteNote(data.post_id, data.note ?? null);
    return NextResponse.json({ ok: true });
  }
  if (data.item_key) {
    const result = await toggleItemFavorite({
      post_id: data.post_id,
      item_key: data.item_key,
      label: data.label,
      url: data.url,
      price_at_save: data.price_at_save,
    });
    return NextResponse.json(result);
  }
  const result = await toggleFavorite(data.post_id, data.note);
  return NextResponse.json(result);
}
