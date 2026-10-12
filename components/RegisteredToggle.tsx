"use client";

import { CircleCheck } from "lucide-react";
import { useFavorites } from "@/components/FavoritesProvider";

/** Botón del cluster de acciones: "Ya me inscribí" en eventos. */
export function RegisteredToggle({ postId }: { postId: string }) {
  const { registeredIds, toggleRegistered } = useFavorites();
  const on = registeredIds.has(postId);
  const label = on ? "Inscripto. Tocá para desmarcar" : "Ya me inscribí";
  return (
    <button
      type="button"
      data-no-collapse
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        void toggleRegistered(postId);
      }}
      className={`grid h-10 w-10 place-items-center rounded-full transition-transform hover:scale-110 ${
        on ? "text-emerald-500" : "text-muted hover:text-foreground"
      }`}
    >
      <CircleCheck size={17} strokeWidth={1.75} fill={on ? "currentColor" : "none"} className={on ? "[&>path]:stroke-white dark:[&>path]:stroke-black" : ""} />
    </button>
  );
}

/** Chip visible en el cuerpo/meta de la card cuando está inscripto. */
export function RegisteredBadge({ postId }: { postId: string }) {
  const { registeredIds } = useFavorites();
  if (!registeredIds.has(postId)) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
      <CircleCheck size={12} strokeWidth={2} />
      Inscripto
    </span>
  );
}
