"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { shouldRefreshOnResume } from "@/lib/resume";

/**
 * La PWA de iOS vuelve del fondo con la página vieja. Al volver (visible, pageshow
 * desde bfcache o focus) después de >= 30 s, re-pedimos los server components y
 * le pedimos al service worker que busque versión nueva (dispara el aviso existente).
 */
export function ResumeRefresh() {
  const router = useRouter();
  const hiddenAt = useRef<number | null>(null);
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    function resume(force = false) {
      const now = Date.now();
      if (!force && !shouldRefreshOnResume({ hiddenAt: hiddenAt.current, now, lastRefreshAt: lastRefresh.current })) {
        hiddenAt.current = null;
        return;
      }
      hiddenAt.current = null;
      lastRefresh.current = now;
      router.refresh();
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker
          .getRegistration()
          .then((registration) => registration?.update())
          .catch(() => undefined);
      }
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") hiddenAt.current = Date.now();
      else resume();
    }
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) resume(Date.now() - lastRefresh.current > 10_000);
    }
    function onBlur() {
      hiddenAt.current ??= Date.now();
    }
    function onFocus() {
      resume();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);

  return null;
}
