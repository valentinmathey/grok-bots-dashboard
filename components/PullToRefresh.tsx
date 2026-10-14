"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, RotateCw } from "lucide-react";
import { PULL_THRESHOLD, pullDistance } from "@/lib/resume";

const IGNORE =
  'input, textarea, select, [contenteditable="true"], [role="dialog"], [data-no-ptr], .sheet-footer';

/** Pull-to-refresh liviano para pantallas táctiles (la PWA de iOS no trae uno nativo). */
export function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, startTransition] = useTransition();
  const state = useRef<{ x: number; y: number; active: boolean; locked: boolean; pull: number } | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    function blocked(target: EventTarget | null) {
      if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return true;
      return target instanceof Element && Boolean(target.closest(IGNORE));
    }
    function onStart(event: TouchEvent) {
      if (event.touches.length !== 1 || window.scrollY > 0 || blocked(event.target)) {
        state.current = null;
        return;
      }
      const t = event.touches[0];
      state.current = { x: t.clientX, y: t.clientY, active: false, locked: false, pull: 0 };
    }
    function onMove(event: TouchEvent) {
      const s = state.current;
      if (!s || s.locked) return;
      const t = event.touches[0];
      const dx = t.clientX - s.x;
      const dy = t.clientY - s.y;
      if (!s.active) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        // Horizontal (chips) o hacia arriba: no es un pull.
        if (Math.abs(dx) > Math.abs(dy) || dy < 0 || window.scrollY > 0) {
          s.locked = true;
          return;
        }
        s.active = true;
      }
      if (window.scrollY > 0) return;
      event.preventDefault();
      s.pull = pullDistance(dy);
      setPull(s.pull);
    }
    function onEnd() {
      const s = state.current;
      state.current = null;
      if (!s?.active) return;
      if (s.pull >= PULL_THRESHOLD) {
        setRefreshing(true);
        setPull(PULL_THRESHOLD * 0.75);
        startTransition(() => router.refresh());
      } else {
        setPull(0);
      }
    }
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [router]);

  useEffect(() => {
    if (!refreshing || pending) return;
    const id = window.setTimeout(() => {
      setRefreshing(false);
      setPull(0);
    }, 400);
    return () => window.clearTimeout(id);
  }, [refreshing, pending]);

  if (pull <= 0 && !refreshing) return null;
  const ready = pull >= PULL_THRESHOLD;
  return (
    <div
      aria-live="polite"
      aria-label={refreshing ? "Actualizando" : undefined}
      className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center"
      style={{
        top: "env(safe-area-inset-top)",
        transform: `translateY(${pull - 36}px)`,
        transition: state.current?.active ? "none" : "transform 200ms ease",
      }}
    >
      <span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-muted shadow">
        {refreshing ? (
          <Loader2 size={18} strokeWidth={1.75} className="animate-spin text-accent" />
        ) : (
          <RotateCw
            size={18}
            strokeWidth={1.75}
            className={ready ? "text-accent" : ""}
            style={{ transform: `rotate(${(pull / PULL_THRESHOLD) * 270}deg)`, opacity: Math.min(1, pull / 40) }}
          />
        )}
      </span>
    </div>
  );
}
