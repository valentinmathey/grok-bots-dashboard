import Link from "next/link";
import { CalendarDays, Star } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { collectAgendaEntries, favoriteIdSet, googleCalendarUrl } from "@/lib/agenda";
import { baCalendarDate } from "@/lib/event-time";
import { getRepository } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const TYPE_LABEL: Record<string, string> = {
  evento: "Evento",
  cierre: "Cierre",
  viaje: "Viaje",
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    bot?: string;
    type?: string;
    fav?: string;
    month?: string;
  }>;
}) {
  const params = await searchParams;
  const [posts, favs] = await Promise.all([getRepository().listAgendaPosts(), favoriteIdSet()]);
  let entries = collectAgendaEntries(posts, favs);
  if (params.bot) entries = entries.filter((entry) => entry.bot.slug === params.bot);
  if (params.type) entries = entries.filter((entry) => entry.type === params.type);
  if (params.fav === "1") entries = entries.filter((entry) => entry.favorite);

  const today = baCalendarDate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowYmd = baCalendarDate(tomorrow);
  const upcoming = entries.filter((entry) => entry.date >= today);
  const past = entries.filter((entry) => entry.date < today);
  const view = params.view === "mes" ? "mes" : "lista";
  const month = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : today.slice(0, 7);

  function href(next: Record<string, string | undefined>) {
    const query = new URLSearchParams();
    const merged = {
      view: params.view,
      bot: params.bot,
      type: params.type,
      fav: params.fav,
      month: params.month,
      ...next,
    };
    for (const [key, value] of Object.entries(merged)) {
      if (value) query.set(key, value);
    }
    const qs = query.toString();
    return qs ? `/agenda?${qs}` : "/agenda";
  }

  const bots = [...new Map(entries.map((entry) => [entry.bot.slug, entry.bot])).values()];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
        <p className="mt-1.5 text-sm text-muted">
          Eventos, cierres de oportunidades y viajes, en hora Argentina.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Link href={href({ view: "lista" })} className={`rounded-full px-3 py-1 text-xs font-medium ${view === "lista" ? "bg-accent text-accent-ink" : "bg-chip"}`}>
          Lista
        </Link>
        <Link href={href({ view: "mes" })} className={`rounded-full px-3 py-1 text-xs font-medium ${view === "mes" ? "bg-accent text-accent-ink" : "bg-chip"}`}>
          Mes
        </Link>
        <Link href={href({ type: undefined })} className={`rounded-full px-3 py-1 text-xs font-medium ${!params.type ? "bg-accent text-accent-ink" : "bg-chip"}`}>
          Todo
        </Link>
        {(["evento", "cierre", "viaje"] as const).map((type) => (
          <Link
            key={type}
            href={href({ type })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${params.type === type ? "bg-accent text-accent-ink" : "bg-chip"}`}
          >
            {TYPE_LABEL[type]}
          </Link>
        ))}
        <Link href={href({ fav: params.fav === "1" ? undefined : "1" })} className={`rounded-full px-3 py-1 text-xs font-medium ${params.fav === "1" ? "bg-accent text-accent-ink" : "bg-chip"}`}>
          Solo favoritos
        </Link>
        {bots.map((bot) => (
          <Link
            key={bot.slug}
            href={href({ bot: params.bot === bot.slug ? undefined : bot.slug })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${params.bot === bot.slug ? "bg-accent text-accent-ink" : "bg-chip"}`}
          >
            {bot.name}
          </Link>
        ))}
      </div>

      {view === "mes" ? (
        <MonthGrid month={month} entries={entries} href={href} today={today} />
      ) : (
        <div className="space-y-4">
          <DayGroups
            entries={upcoming}
            today={today}
            tomorrow={tomorrowYmd}
          />
          {past.length ? (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-muted">Ya pasaron ({past.length})</summary>
              <div className="mt-3">
                <DayGroups entries={past} today={today} tomorrow={tomorrowYmd} />
              </div>
            </details>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DayGroups({
  entries,
  today,
  tomorrow,
}: {
  entries: ReturnType<typeof collectAgendaEntries>;
  today: string;
  tomorrow: string;
}) {
  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = groups.get(entry.date) ?? [];
    list.push(entry);
    groups.set(entry.date, list);
  }
  return (
    <div className="space-y-4">
      {[...groups.entries()].map(([date, items]) => (
        <section key={date}>
          <h2 className="sticky top-14 z-10 bg-background/90 py-1 text-sm font-semibold backdrop-blur">
            {date === today ? "Hoy" : date === tomorrow ? "Mañana" : date}
          </h2>
          <ul className="mt-1 space-y-1.5">
            {items.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/bots/${entry.bot.slug}#post-${entry.postId}`}
                  className="surface flex items-center gap-3 rounded-2xl px-3 py-2.5"
                >
                  <BotAvatar bot={entry.bot} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {entry.favorite ? <Star size={12} className="mr-1 inline text-amber-500" /> : null}
                      {entry.title}
                    </p>
                    <p className="text-[11px] text-muted">
                      {TYPE_LABEL[entry.type]}
                      {entry.location ? ` · ${entry.location}` : ""}
                    </p>
                  </div>
                  <a
                    href={googleCalendarUrl(entry)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-medium text-accent"
                    data-no-collapse
                  >
                    Calendar
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MonthGrid({
  month,
  entries,
  href,
  today,
}: {
  month: string;
  entries: ReturnType<typeof collectAgendaEntries>;
  href: (next: Record<string, string | undefined>) => string;
  today: string;
}) {
  const [year, mon] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, mon - 1, 1));
  const startPad = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const cells = Array.from({ length: startPad + daysInMonth }, (_, index) => {
    if (index < startPad) return null;
    const day = index - startPad + 1;
    return `${month}-${String(day).padStart(2, "0")}`;
  });
  const prev = new Date(Date.UTC(year, mon - 2, 1));
  const next = new Date(Date.UTC(year, mon, 1));
  const prevMonth = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextMonth = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <Link href={href({ view: "mes", month: prevMonth })} className="text-accent">
          ←
        </Link>
        <span className="font-semibold">{month}</span>
        <Link href={href({ view: "mes", month: nextMonth })} className="text-accent">
          →
        </Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
        {["L", "M", "M", "J", "V", "S", "D"].map((label, index) => (
          <div key={`${label}-${index}`}>{label}</div>
        ))}
        {cells.map((ymd, index) => {
          const dayEntries = ymd ? entries.filter((entry) => entry.date === ymd || (entry.endDate && entry.date <= ymd && entry.endDate >= ymd)) : [];
          return (
            <div
              key={ymd ?? `pad-${index}`}
              className={`min-h-14 rounded-xl border border-transparent p-1 ${ymd === today ? "border-accent" : ""} ${ymd ? "bg-card" : ""}`}
            >
              {ymd ? <p className="font-medium text-foreground">{Number(ymd.slice(8))}</p> : null}
              <div className="mt-0.5 flex justify-center gap-0.5">
                {dayEntries.slice(0, 3).map((entry) => (
                  <span
                    key={entry.id}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                    title={entry.title}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">
        <CalendarDays size={12} className="mr-1 inline" />
        Tocá un día en lista para ver el detalle. Exportá el feed desde Ajustes.
      </p>
    </div>
  );
}
