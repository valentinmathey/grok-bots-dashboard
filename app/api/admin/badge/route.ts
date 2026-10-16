import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnerFromRequest } from "@/lib/auth";
import { countUnseen } from "@/lib/badge";
import { jsonError } from "@/lib/http";
import { VISIT_COOKIE } from "@/lib/last-seen";

export const dynamic = "force-dynamic";

/** Número para el ícono de la app. Lo usan la app al abrir/volver y el service worker al llegar un push. */
export async function GET() {
  if (!(await getOwnerFromRequest())) return jsonError(401, "unauthorized", "Tenés que entrar como dueño");
  const raw = (await cookies()).get(VISIT_COOKIE)?.value;
  const count = await countUnseen(raw ? decodeURIComponent(raw) : null);
  return NextResponse.json({ count }, { headers: { "Cache-Control": "no-store" } });
}
