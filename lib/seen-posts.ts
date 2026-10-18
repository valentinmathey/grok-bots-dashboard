/**
 * "Visto" por post sin tablas: ids en localStorage (por dispositivo) + la cookie
 * de última visita del Resumen. Un post es nuevo si no se abrió y apareció o
 * cambió después de la visita anterior.
 */
export const SEEN_KEY = "gbd-seen-posts";
const MAX_SEEN = 3000;

export function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveSeen(ids: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-MAX_SEEN)));
  } catch {
    /* sin storage: no pasa nada */
  }
}

/** Clave de visto: cambia si el post se actualiza (cambio de horario, cancelación…). */
export function seenToken(post: { id: string; updated_at?: string; created_at: string }) {
  return `${post.id}@${post.updated_at ?? post.created_at}`;
}

export function isPostSeen(
  post: { id: string; updated_at?: string; created_at: string },
  seen: Set<string>,
  baselineIso: string | null,
): boolean {
  if (seen.has(seenToken(post))) return true;
  if (!baselineIso) return false;
  return (post.updated_at ?? post.created_at) <= baselineIso;
}
