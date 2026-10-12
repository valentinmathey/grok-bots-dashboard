import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_OPTIONS } from "@/lib/supabase/cookies";
import { getPublicSupabaseEnv, getOwnerEmail, isPreviewMode } from "@/lib/env";
import { isOwnerEmail } from "@/lib/owner";
import { isPublicPath, isSharePath } from "@/lib/public-paths";

function applyShareRobots(response: NextResponse, pathname: string): NextResponse {
  if (isSharePath(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
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
    const next = NextResponse.next({ request });
    return applyShareRobots(next, request.nextUrl.pathname);
  }

  let supabaseResponse = NextResponse.next({ request });

  let env: { url: string; anonKey: string };
  try {
    env = getPublicSupabaseEnv();
  } catch {
    if (isPublicPath(request.nextUrl.pathname)) {
      return applyShareRobots(supabaseResponse, request.nextUrl.pathname);
    }
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookieOptions: SESSION_COOKIE_OPTIONS,
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

  if (
    pathname.startsWith("/api/v1") ||
    pathname.startsWith("/api/mcp") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/api/compartir/")
  ) {
    return applyShareRobots(supabaseResponse, pathname);
  }

  if (!email) {
    if (isPublicPath(pathname)) {
      return applyShareRobots(supabaseResponse, pathname);
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

  return applyShareRobots(supabaseResponse, pathname);
}
