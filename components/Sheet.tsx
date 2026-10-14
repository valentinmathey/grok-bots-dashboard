"use client";

import { useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { lockBodyScroll, SHEET_TAP_SLOP, shouldDismissSheet } from "@/lib/sheet";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  desktopDialog?: boolean;
  mobileOnly?: boolean;
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isDesktopDialog(desktopDialog: boolean) {
  return (
    desktopDialog &&
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 640px)").matches
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  desktopDialog = false,
  mobileOnly = false,
}: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    active: false,
    startY: 0,
    lastY: 0,
    lastT: 0,
    vy: 0,
    offset: 0,
    fromHandle: false,
  });
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setOffset(0);
      setDragging(false);
      return;
    }
    const unlock = lockBodyScroll();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function startDrag(event: PointerEvent<HTMLElement>, fromHandle: boolean) {
    if (isDesktopDialog(desktopDialog)) return;
    if ((event.target as HTMLElement).closest("[data-sheet-close]")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const now = performance.now();
    drag.current = {
      active: true,
      startY: event.clientY,
      lastY: event.clientY,
      lastT: now,
      vy: 0,
      offset: 0,
      fromHandle,
    };
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    if (!drag.current.active) return;
    const now = performance.now();
    const y = event.clientY;
    const dt = Math.max(1, now - drag.current.lastT);
    drag.current.vy = (y - drag.current.lastY) / dt;
    drag.current.lastY = y;
    drag.current.lastT = now;
    const next = Math.max(0, y - drag.current.startY);
    drag.current.offset = next;
    setOffset(next);
  }

  function endDrag() {
    if (!drag.current.active) return;
    const { offset: dy, vy, fromHandle } = drag.current;
    drag.current.active = false;
    setDragging(false);
    if (fromHandle && dy < SHEET_TAP_SLOP && vy < 0.15) {
      onClose();
      setOffset(0);
      return;
    }
    const height = panelRef.current?.getBoundingClientRect().height ?? 480;
    if (shouldDismissSheet({ offsetY: dy, height, velocityY: vy })) {
      onClose();
      setOffset(0);
      return;
    }
    setOffset(0);
  }

  if (!open || !mounted) return null;

  const dialog = isDesktopDialog(desktopDialog);
  const reduced = prefersReducedMotion();
  const backdropOpacity = dragging
    ? Math.max(0.12, 0.4 * (1 - offset / Math.max(1, panelRef.current?.offsetHeight ?? 480)))
    : 0.4;

  const node = (
    <div className={`sheet-root ${mobileOnly ? "lg:hidden" : ""}`} role="presentation">
      <button
        type="button"
        className="sheet-backdrop"
        style={{ opacity: backdropOpacity }}
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`sheet-panel ${dialog ? "sheet-panel-dialog" : ""}`}
        style={{
          transform: dialog ? undefined : `translateY(${offset}px)`,
          transition:
            dragging || reduced
              ? "none"
              : "transform 280ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div
          className="sheet-grab"
          onPointerDown={(event) => startDrag(event, Boolean((event.target as HTMLElement).closest("[data-sheet-handle]")))}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {dialog ? null : (
            <button
              type="button"
              data-sheet-handle
              aria-label="Cerrar"
              className="sheet-handle"
              onClick={() => {
                if (drag.current.offset > SHEET_TAP_SLOP) return;
                onClose();
              }}
            >
              <span />
            </button>
          )}
          <div className="flex items-center gap-3 px-4 pb-2 pt-1">
            <h2 id={titleId} className="min-w-0 flex-1 text-lg font-semibold tracking-tight">
              {title}
            </h2>
            <button
              type="button"
              data-sheet-close
              aria-label="Cerrar"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-chip hover:text-foreground"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

/** Footer fijo compartido de los sheets (Limpiar / Aplicar / Ver resultados). */
export function SheetFooter({ children }: { children: ReactNode }) {
  return <div className="sheet-footer flex gap-2">{children}</div>;
}
