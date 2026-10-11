"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet } from "@/components/Sheet";

export function FilterToolbar({
  children,
  applied = 0,
  title = "Filtros",
  alwaysShow = false,
}: {
  children: ReactNode;
  applied?: number;
  title?: string;
  alwaysShow?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-w-0">
      <div className={alwaysShow ? "min-w-0" : "hidden min-w-0 lg:block"}>{children}</div>
      {alwaysShow ? null : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-medium lg:hidden"
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} />
          Filtros
          {applied > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
              {applied}
            </span>
          ) : null}
        </button>
      )}
      {alwaysShow ? null : (
        <Sheet open={open} onClose={() => setOpen(false)} title={title}>
          <div className="pb-[env(safe-area-inset-bottom)]">{children}</div>
        </Sheet>
      )}
    </div>
  );
}
