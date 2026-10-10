export function isSharePath(pathname: string): boolean {
  return (
    pathname === "/compartir" ||
    pathname.startsWith("/compartir/") ||
    pathname === "/api/compartir" ||
    pathname.startsWith("/api/compartir/")
  );
}

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/robots.txt" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/offline" ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/v1") ||
    pathname.startsWith("/api/mcp") ||
    pathname.startsWith("/api/cron") ||
    isSharePath(pathname)
  );
}
