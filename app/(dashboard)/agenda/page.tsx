import { AgendaCalendar } from "@/components/AgendaCalendar";
import { AgendaDayGroups } from "@/components/AgendaEventRow";
import { AgendaFilters } from "@/components/AgendaFilters";
import { collectAgendaEntries } from "@/lib/agenda";
import { favoriteIdSet } from "@/lib/favorites-store";
import {
  parseAgendaView,
  parseBotSlugs,
  type AgendaQuery,
} from "@/lib/calendar";
import { getRepository } from "@/lib/data";
import { addCalendarDays, baCalendarDate } from "@/lib/event-time";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    bot?: string;
    bots?: string;
    type?: string;
    fav?: string;
    month?: string;
  }>;
}) {
  const params = await searchParams;
  const [posts, favs] = await Promise.all([getRepository().listAgendaPosts(), favoriteIdSet()]);
  const allEntries = collectAgendaEntries(posts, favs);
  const bots = [...new Map(allEntries.map((entry) => [entry.bot.slug, entry.bot])).values()];
  const selectedBots = parseBotSlugs(params.bots || params.bot);
  const type =
    params.type === "evento" || params.type === "cierre" || params.type === "viaje"
      ? params.type
      : undefined;
  const fav = params.fav === "1";
  const today = baCalendarDate(new Date());
  const tomorrow = addCalendarDays(today, 1);
  const month =
    params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : today.slice(0, 7);
  const query: AgendaQuery = {
    view: parseAgendaView(params.view),
    type,
    fav,
    bots: selectedBots,
    month,
  };

  let entries = allEntries;
  if (type) entries = entries.filter((entry) => entry.type === type);
  if (fav) entries = entries.filter((entry) => entry.favorite);
  if (selectedBots.length) {
    entries = entries.filter((entry) => selectedBots.includes(entry.bot.slug));
  }

  const upcoming = entries.filter((entry) => entry.date >= today);
  const past = entries.filter((entry) => entry.date < today);

  return (
    <div className="space-y-5 pb-[env(safe-area-inset-bottom)]">
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Agenda</h1>
        <p className="mt-1.5 text-sm text-muted">
          Eventos, cierres de oportunidades y viajes, en hora Argentina.
        </p>
      </div>

      <AgendaFilters query={query} bots={bots} />

      {query.view === "calendario" ? (
        <AgendaCalendar
          entries={entries}
          query={query}
          today={today}
          tomorrow={tomorrow}
        />
      ) : (
        <div className="space-y-4">
          <AgendaDayGroups entries={upcoming} today={today} tomorrow={tomorrow} />
          {past.length ? (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-muted">
                Ya pasaron ({past.length})
              </summary>
              <div className="mt-3">
                <AgendaDayGroups entries={past} today={today} tomorrow={tomorrow} />
              </div>
            </details>
          ) : null}
        </div>
      )}
    </div>
  );
}
