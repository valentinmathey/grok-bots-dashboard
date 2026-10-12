import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isOwnerEmail } from "@/lib/owner";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  // token_hash no depende del code verifier PKCE guardado en el navegador
  // que pidió el mail, así que funciona aunque el link se abra en otro
  // navegador (ej. pedido desde la PWA, abierto en Safari).
  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    : await supabase.auth.exchangeCodeForSession(code as string);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
  if (!isOwnerEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=forbidden`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
