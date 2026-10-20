import { baCalendarDate } from "@/lib/event-time";
import type { Post } from "@/lib/types";

export const EVENTO_STATUSES = ["activo", "cambiado", "cancelado"] as const;

/** Eventos cambiados o cancelados cuya fecha (fin o inicio) no pasó, por fecha. */
export function pickEventoChanges(posts: Post[], now = new Date()): Post[] {
  const today = baCalendarDate(now);
  return posts
    .filter((post) => {
      const status = (post.details as Record<string, unknown> | null)?.status;
      if (status !== "cambiado" && status !== "cancelado") return false;
      const end = post.event_end_at ?? post.event_at;
      return Boolean(end) && baCalendarDate(end as string) >= today;
    })
    .sort((a, b) => (a.event_at ?? "").localeCompare(b.event_at ?? ""));
}
