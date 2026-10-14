export const RESUME_MIN_HIDDEN_MS = 30_000;
export const RESUME_THROTTLE_MS = 10_000;
export const PULL_THRESHOLD = 70;
export const PULL_MAX = 120;

/** ¿Refrescar al volver a la app? Solo si estuvo oculta >= 30 s y no refrescamos recién. */
export function shouldRefreshOnResume(input: {
  hiddenAt: number | null;
  now: number;
  lastRefreshAt: number;
}): boolean {
  if (input.hiddenAt === null) return false;
  if (input.now - input.hiddenAt < RESUME_MIN_HIDDEN_MS) return false;
  return input.now - input.lastRefreshAt >= RESUME_THROTTLE_MS;
}

/** Distancia visible del pull con resistencia (crece cada vez más lento). */
export function pullDistance(dragPx: number): number {
  if (dragPx <= 0) return 0;
  return Math.min(PULL_MAX, PULL_MAX * (1 - Math.exp(-dragPx / 160)));
}
