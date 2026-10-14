import { CalendarClock } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip, SegmentedControl } from "@/components/FilterChip";
import { FilterGroup, FilterToolbar } from "@/components/FilterToolbar";
import { getRepository } from "@/lib/data";
import { listRoutines, type Routine } from "@/lib/routines";
import { nextRun } from "@/lib/routines-schedule";
import type { Bot } from "@/lib/types";

export const dynamic = "force-dynamic";

const whenFormat = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Argentina/Mendoza",
});

type Row = Routine & { next: string | null; bot?: Bot };

function RoutineItem({ row, showBot }: { row: Row; showBot?: boolean }) {
  return (
    <li className="min-w-0 rounded-2xl bg-chip/50 p-3">
      <div className="flex min-w-0 items-start gap-2">
        {showBot && row.bot ? <BotAvatar bot={row.bot} size="sm" className="shrink-0" /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <p className="min-w-0 break-words font-semibold leading-snug">{row.name}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                row.enabled
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-chip text-muted"
              }`}
            >
              {row.enabled ? "Activa" : "Pausada"}
            </span>
          </div>
          {showBot && row.bot ? <p className="text-xs text-muted">{row.bot.name}</p> : null}
          <p className="mt-1 inline-flex items-center gap-1 text-sm">
            <CalendarClock size={14} strokeWidth={1.75} className="shrink-0 text-muted" />
            {row.schedule_text}
          </p>
          {row.summary ? (
            <p className="mt-1 break-words text-sm leading-6 text-muted">{row.summary}</p>
          ) : null}
          {row.next && row.enabled ? (
            <p className="mt-1 text-xs text-muted">
              Próxima ejecución:{" "}
              <time dateTime={row.next} className="font-medium text-foreground">
                {whenFormat.format(new Date(row.next))} (Mendoza)
              </time>
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default async function RutinasPage({
  searchParams,
}: {
  searchParams: Promise<{ bot?: string; vista?: string }>;
}) {
  const params = await searchParams;
  const [bots, routines] = await Promise.all([getRepository().listBots(), listRoutines()]);
  const timeline = params.vista === "timeline";
  const selected = params.bot ? bots.find((bot) => bot.slug === params.bot) : undefined;
  const rows: Row[] = routines
    .filter((r) => !selected || r.bot_id === selected.id)
    .map((r) => ({ ...r, next: nextRun(r.cron, r.timezone), bot: bots.find((b) => b.id === r.bot_id) }));
  const botsWith = bots.filter((bot) => routines.some((r) => r.bot_id === bot.id));
  const qs = (next: { bot?: string; vista?: string }) => {
    const p = new URLSearchParams();
    if (next.bot) p.set("bot", next.bot);
    if (next.vista) p.set("vista", next.vista);
    const s = p.toString();
    return s ? `/rutinas?${s}` : "/rutinas";
  };
  const vista = timeline ? "timeline" : undefined;

  const ordered = [...rows].sort((a, b) => {
    const an = a.enabled && a.next ? Date.parse(a.next) : Infinity;
    const bn = b.enabled && b.next ? Date.parse(b.next) : Infinity;
    return an - bn || a.name.localeCompare(b.name, "es");
  });
  const groups = botsWith
    .filter((bot) => !selected || bot.id === selected.id)
    .map((bot) => ({ bot, items: rows.filter((r) => r.bot_id === bot.id) }))
    .filter((g) => g.items.length);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Rutinas</h1>
        <p className="mt-1.5 text-sm text-muted">Qué publica cada bot y cuándo.</p>
      </div>
      <FilterToolbar
        applied={selected ? 1 : 0}
        clearHref={qs({ vista })}
        activeChips={selected ? [{ label: selected.name, removeHref: qs({ vista }) }] : []}
        primary={
          <SegmentedControl
            ariaLabel="Vista"
            className="lg:w-auto lg:min-w-[18rem]"
            value={timeline ? "timeline" : "bot"}
            options={[
              { id: "bot", label: "Por bot", href: qs({ bot: selected?.slug }) },
              { id: "timeline", label: "Próximas", href: qs({ bot: selected?.slug, vista: "timeline" }) },
            ]}
          />
        }
      >
        {botsWith.length > 1 ? (
          <FilterGroup label="Bots">
            <ChipRow>
              <FilterChip href={qs({ vista })} selected={!selected}>
                Todos
              </FilterChip>
              {botsWith.map((bot) => (
                <FilterChip key={bot.id} href={qs({ bot: bot.slug, vista })} selected={selected?.id === bot.id}>
                  {bot.name}
                </FilterChip>
              ))}
            </ChipRow>
          </FilterGroup>
        ) : null}
      </FilterToolbar>
      {rows.length === 0 ? (
        <div className="surface rounded-3xl p-6 text-center">
          <p className="font-medium">Todavía no hay rutinas</p>
          <p className="mt-1 text-sm text-muted">
            Cuando un bot cargue sus rutinas con set_routines, aparecen acá.
          </p>
        </div>
      ) : timeline ? (
        <ul className="surface space-y-2 rounded-3xl p-3 sm:p-4">
          {ordered.map((row) => (
            <RoutineItem key={row.id} row={row} showBot />
          ))}
        </ul>
      ) : (
        <div className="space-y-4">
          {groups.map(({ bot, items }) => (
            <section key={bot.id} className="surface min-w-0 rounded-3xl p-3 sm:p-4">
              <div className="mb-3 flex items-center gap-2">
                <BotAvatar bot={bot} size="sm" />
                <h2 className="min-w-0 truncate font-semibold">{bot.name}</h2>
                <span className="text-xs text-muted">· {items.length}</span>
              </div>
              <ul className="space-y-2">
                {items.map((row) => (
                  <RoutineItem key={row.id} row={row} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
