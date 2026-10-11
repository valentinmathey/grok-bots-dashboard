"use client";

import { Star } from "lucide-react";
import { useFavorites } from "@/components/FavoritesProvider";

export function FavoriteStar({
  postId,
  itemKey,
  label,
  url,
  price,
}: {
  postId: string;
  itemKey?: string;
  label?: string;
  url?: string;
  price?: number;
}) {
  const { postIds, togglePost, toggleItem, isItemSaved } = useFavorites();
  const on = itemKey ? isItemSaved(postId, itemKey) : postIds.has(postId);

  return (
    <button
      type="button"
      data-no-collapse
      aria-pressed={on}
      aria-label={on ? "Sacar de guardados" : "Guardar"}
      title={on ? "Sacar de guardados" : "Guardar"}
      onClick={(event) => {
        event.stopPropagation();
        if (itemKey) {
          void toggleItem({ post_id: postId, item_key: itemKey, label, url, price_at_save: price });
          return;
        }
        void togglePost(postId);
      }}
      className={`grid h-10 w-10 place-items-center rounded-full transition-transform hover:scale-110 ${
        on ? "text-amber-500" : "text-muted hover:text-foreground"
      }`}
    >
      <Star size={16} strokeWidth={1.75} fill={on ? "currentColor" : "none"} />
    </button>
  );
}
