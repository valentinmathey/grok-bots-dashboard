/**
 * "Última visita" sin tablas: dos cookies en el navegador.
 * - VISIT_COOKIE: última actividad en el Resumen.
 * - LAST_SEEN_COOKIE: inicio de la referencia ("lo nuevo desde...").
 * Si pasaron más de VISIT_GAP_MS desde la última actividad, arranca una visita
 * nueva y la referencia pasa a ser esa actividad anterior.
 */
export const LAST_SEEN_COOKIE = "gbd_last_seen";
export const VISIT_COOKIE = "gbd_visit_at";
export const VISIT_GAP_MS = 30 * 60_000;
export const DEFAULT_LOOKBACK_MS = 24 * 3_600_000;

function parse(value?: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function resolveLastSeen(input: {
  lastSeen?: string | null;
  visitAt?: string | null;
  now?: Date;
}): { since: Date; lastSeen: string; visitAt: string } {
  const now = (input.now ?? new Date()).getTime();
  const visit = parse(input.visitAt);
  const prev = parse(input.lastSeen);
  let since: number;
  if (visit !== null && now - visit > VISIT_GAP_MS) since = visit;
  else since = prev ?? visit ?? now - DEFAULT_LOOKBACK_MS;
  if (visit === null && prev === null) since = now - DEFAULT_LOOKBACK_MS;
  return {
    since: new Date(since),
    lastSeen: new Date(since).toISOString(),
    visitAt: new Date(now).toISOString(),
  };
}
