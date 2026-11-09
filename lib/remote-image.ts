/**
 * Helpers para portadas remotas (Luma, Meetup, etc.): el navegador a veces
 * falla con format=auto→AVIF o con hotlink por Referer.
 */

/** Reescribe CDNs conocidos a un formato más compatible (webp/jpeg). */
export function preferCompatibleImageUrl(src: string): string {
  try {
    const url = new URL(src);
    // Cloudflare Image Resizing en Luma: format=auto → webp
    if (
      url.hostname === "images.lumacdn.com" &&
      url.pathname.includes("/cdn-cgi/image/")
    ) {
      url.pathname = url.pathname.replace(/format=auto/i, "format=webp");
      if (!/format=/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(
          "/cdn-cgi/image/",
          "/cdn-cgi/image/format=webp,",
        );
      }
      return url.toString();
    }
    return src;
  } catch {
    return src;
  }
}

/** Segunda chance si falló la primera (webp→jpeg, o sin transform). */
export function imageUrlFallback(src: string): string | null {
  try {
    const url = new URL(src);
    if (url.hostname === "images.lumacdn.com" && url.pathname.includes("/cdn-cgi/image/")) {
      if (/format=webp/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/format=webp/i, "format=jpeg");
        return url.toString();
      }
      if (/format=auto/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/format=auto/i, "format=jpeg");
        return url.toString();
      }
      // Sin format: pedir el original después de /cdn-cgi/image/.../
      const m = url.pathname.match(/\/cdn-cgi\/image\/[^/]+\/(.+)$/);
      if (m?.[1]) {
        return `${url.origin}/${m[1]}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}
