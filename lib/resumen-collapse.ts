export const RESUMEN_OPEN_KEY = "gb-resumen-open";

/** Default expanded. Only an explicit "0" collapses. */
export function parseResumenOpen(value: string | null | undefined): boolean {
  return value !== "0";
}

export function persistResumenOpen(open: boolean) {
  const value = open ? "1" : "0";
  try {
    localStorage.setItem(RESUMEN_OPEN_KEY, value);
  } catch {
    // private mode
  }
  document.cookie = `${RESUMEN_OPEN_KEY}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
}
