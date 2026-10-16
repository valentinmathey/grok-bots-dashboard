"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { applyAppBadge } from "@/lib/app-badge";

/**
 * Sincroniza el número del ícono de la app: en el Resumen del día lo limpia (la cookie
 * de visita marca todo como visto); en otras páginas lo actualiza con las novedades pendientes.
 */
export function AppBadgeSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    let cancelled = false;
    async function sync() {
      if (document.visibilityState !== "visible") return;
      // En el Resumen del día todo queda visto.
      if (pathname === "/") {
        await applyAppBadge(0);
        return;
      }
      try {
        const res = await fetch("/api/admin/badge", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const { count } = (await res.json()) as { count: number };
        await applyAppBadge(count);
      } catch {
        /* sin red: dejamos el badge como está */
      }
    }
    void sync();
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, [pathname]);

  return null;
}
