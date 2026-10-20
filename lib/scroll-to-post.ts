/** Id de post desde el hash (#post-<id>), o null. */
export function hashPostId(hash: string): string | null {
  if (!hash.startsWith("#post-")) return null;
  const id = decodeURIComponent(hash.slice(6)).trim();
  return id || null;
}

/** Momentos (ms) en que se re-centra el post mientras se asienta el layout. */
export const SETTLE_DELAYS_MS = [0, 120, 300, 600, 1000, 1500];

/**
 * Centra el post y lo vuelve a centrar mientras cargan imágenes o se expande
 * la card. Si el usuario toca o scrollea, deja de corregir. Devuelve un cancelador.
 */
export function scrollToPostSettled(id: string): () => void {
  if (typeof window === "undefined") return () => undefined;
  let stopped = false;
  const timers: number[] = [];
  const stop = () => {
    stopped = true;
    timers.forEach((t) => window.clearTimeout(t));
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);
  SETTLE_DELAYS_MS.forEach((delay, i) => {
    timers.push(
      window.setTimeout(() => {
        if (stopped) return;
        const el = document.getElementById(`post-${id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const centered = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2) < 24;
          const tall = rect.height > window.innerHeight - 16;
          if (i === 0 || !(centered || (tall && Math.abs(rect.top) < 24))) {
            el.scrollIntoView({ behavior: i === 0 ? "smooth" : "auto", block: tall ? "start" : "center" });
          }
        }
        if (i === SETTLE_DELAYS_MS.length - 1) stop();
      }, delay),
    );
  });
  return stop;
}
