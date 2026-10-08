import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseEnv, getOwnerEmail, isPreviewMode } from "@/lib/env";
import { isOwnerEmail } from "@/lib/owner";

function isPublicPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/v1") ||
    pathname.startsWith("/api/mcp")
  );
}

function applyCookies(
  from: NextResponse,
  to: NextResponse,
): NextResponse {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"] as const) {
    const value = from.headers.get(header);
    if (value) {
      to.headers.set(header, value);
    }
  }
  return to;
}

export async function updateSession(request: NextRequest) {
  if (isPreviewMode()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  let env: { url: string; anonKey: string };
  try {
    env = getPublicSupabaseEnv();
  } catch {
    if (isPublicPath(request.nextUrl.pathname)) {
      return supabaseResponse;
    }
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const email =
    typeof data?.claims?.email === "string" ? data.claims.email : null;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/v1") || pathname.startsWith("/api/mcp")) {
    return supabaseResponse;
  }

  if (!email) {
    if (isPublicPath(pathname)) {
      return supabaseResponse;
    }
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return applyCookies(supabaseResponse, NextResponse.redirect(login));
  }

  if (!isOwnerEmail(email) || !getOwnerEmail()) {
    await supabase.auth.signOut();
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "?error=forbidden";
    return applyCookies(supabaseResponse, NextResponse.redirect(login));
  }

  if (pathname.startsWith("/login")) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return applyCookies(supabaseResponse, NextResponse.redirect(home));
  }

  return supabaseResponse;
}
