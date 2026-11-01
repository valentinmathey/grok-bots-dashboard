/**
 * ¿Este click en un <a> dispara una navegación interna del App Router que
 * merece barra de progreso? (mismo origen, otra ruta o query, sin modificadores).
 */
export function isInternalNavigation(input: {
  href: string | null;
  target?: string | null;
  download?: boolean;
  current: string;
  button?: number;
  modifier?: boolean;
}): boolean {
  if (!input.href || input.download) return false;
  if (input.target && input.target !== "_self") return false;
  if ((input.button ?? 0) !== 0 || input.modifier) return false;
  if (/^(mailto|tel|sms|javascript):/i.test(input.href)) return false;
  let next: URL;
  let now: URL;
  try {
    now = new URL(input.current);
    next = new URL(input.href, now);
  } catch {
    return false;
  }
  if (next.origin !== now.origin) return false;
  if (next.pathname.startsWith("/api/")) return false;
  return next.pathname !== now.pathname || next.search !== now.search;
}
