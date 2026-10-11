import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { collectAgendaEntries } from "@/lib/agenda";
import { favoriteIdSet } from "@/lib/favorites-store";
import { baCalendarDate } from "@/lib/event-time";
import { getRepository } from "@/lib/data";

export async function AgendaHome() {
  const [posts, favs] = await Promise.all([getRepository().listAgendaPosts(), favoriteIdSet()]);
  const today = baCalendarDate(new Date());
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 7);
  const until = baCalendarDate(horizon);
  const upcoming = collectAgendaEntries(posts, favs).filter(
    (entry) => entry.date >= today && entry.date <= until,
  );
  if (!upcoming.length) return null;
  return (
    <Link
      href="/agenda"
      className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2.5 text-sm hover:bg-chip"
    >
      <span className="inline-flex items-center gap-2">
        <CalendarDays size={14} strokeWidth={1.75} className="text-accent" />
        Próximos 7 días
      </span>
      <span className="truncate text-xs text-muted">
        {upcoming[0]?.title} · {upcoming.length} {upcoming.length === 1 ? "item" : "items"}
      </span>
    </Link>
  );
}
