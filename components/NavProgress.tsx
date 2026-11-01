"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { isInternalNavigation } from "@/lib/nav-progress";

const PENDING_ATTR = "data-nav-pending";
const SAFETY_MS = 12_000;

/**
 * Barra de progreso arriba + estado "cargando" en el link tocado, desde el
 * mismo toque hasta que la ruta nueva se monta. Global: cubre toda la app.
 */
function NavProgressInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const timers = useRef<number[]>([]);
  const pendingEl = useRef<Element | null>(null);

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }
  function clearPending() {
    pendingEl.current?.removeAttribute(PENDING_ATTR);
    pendingEl.current = null;
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!anchor) return;
      const ok = isInternalNavigation({
        href: anchor.getAttribute("href"),
        target: anchor.getAttribute("target"),
        download: anchor.hasAttribute("download"),
        current: window.location.href,
        button: event.button,
        modifier: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
      });
      if (!ok) return;
      clearTimers();
      clearPending();
      anchor.setAttribute(PENDING_ATTR, "");
      pendingEl.current = anchor;
      setState("loading");
      timers.current.push(
        window.setTimeout(() => {
          clearPending();
          setState("idle");
        }, SAFETY_MS),
      );
    }
    // Burbujeo (no captura): si un onClick hace preventDefault, no arrancamos.
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      clearTimers();
      clearPending();
    };
  }, []);

  // Ruta nueva montada: completar y ocultar.
  const key = `${pathname}?${search?.toString() ?? ""}`;
  const lastKey = useRef(key);
  useEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    clearTimers();
    clearPending();
    setState((s) => (s === "loading" ? "done" : s));
    timers.current.push(window.setTimeout(() => setState("idle"), 260));
  }, [key]);

  return (
    <div
      aria-hidden
      className="nav-progress"
      data-state={state}
    >
      <div className="nav-progress-bar" />
    </div>
  );
}

export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <NavProgressInner />
    </Suspense>
  );
}
