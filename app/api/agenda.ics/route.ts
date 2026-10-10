import { NextResponse } from "next/server";
import { collectAgendaEntries, favoriteIdSet, toIcs } from "@/lib/agenda";
import { agendaTokenValid } from "@/lib/agenda-feed";
import { getOwnerFromRequest } from "@/lib/auth";
import { getRepository } from "@/lib/data";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const owner = await getOwnerFromRequest();
  if (token) {
    if (!(await agendaTokenValid(token))) {
      return jsonError(404, "not_found", "Feed desconocido o revocado");
    }
  } else if (!owner) {
    return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  }
  const [posts, favs] = await Promise.all([getRepository().listAgendaPosts(), favoriteIdSet()]);
  const ics = toIcs(collectAgendaEntries(posts, favs));
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="grok-bots.ics"',
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, max-age=60",
    },
  });
}
