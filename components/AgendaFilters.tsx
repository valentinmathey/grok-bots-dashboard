import Link from "next/link";
import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip, SegmentedControl } from "@/components/FilterChip";
import { FilterToolbar } from "@/components/FilterToolbar";
import type { AgendaType } from "@/lib/agenda";
import {
  agendaHref,
  countAgendaFilters,
  type AgendaQuery,
} from "@/lib/calendar";

const TYPES: Array<{ id?: AgendaType; label: string }> = [
  { label: "Todo" },
  { id: "evento", label: "Eventos" },
  { id: "cierre", label: "Cierres" },
  { id: "viaje", label: "Viajes" },
];

export function AgendaFilters({
  query,
  bots,
}: {
  query: AgendaQuery;
  bots: Array<{
    name: string;
    slug: string;
    avatar_color?: string | null;
    avatar_url?: string | null;
  }>;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Vista</p>
        <SegmentedControl
          ariaLabel="Vista"
          className="lg:max-w-xs"
          value={query.view}
          options={[
            { id: "lista", label: "Lista", href: agendaHref(query, { view: "lista" }) },
            { id: "calendario", label: "Calendario", href: agendaHref(query, { view: "calendario" }) },
          ]}
        />
      </div>

      <FilterToolbar applied={countAgendaFilters(query)} title="Filtros" clearHref="/agenda">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Actividades
          </p>
          <ActivityChips query={query} bots={bots} />
        </div>
      </FilterToolbar>
    </div>
  );
}

function ActivityChips({
  query,
  bots,
}: {
  query: AgendaQuery;
  bots: Array<{
    name: string;
    slug: string;
    avatar_color?: string | null;
    avatar_url?: string | null;
  }>;
}) {
  return (
    <ChipRow>
      {TYPES.map((type) => {
        const active = type.id ? query.type === type.id : !query.type;
        return (
          <FilterChip
            key={type.label}
            href={agendaHref(query, { type: type.id })}
            selected={active}
            check
          >
            {type.label}
          </FilterChip>
        );
      })}
      <FilterChip
        href={agendaHref(query, { fav: !query.fav })}
        selected={Boolean(query.fav)}
        check
      >
        Solo favoritos
      </FilterChip>
      {bots.map((bot) => {
        const active = query.bots.includes(bot.slug);
        const next = active
          ? query.bots.filter((slug) => slug !== bot.slug)
          : [...query.bots, bot.slug];
        return (
          <FilterChip
            key={bot.slug}
            href={agendaHref(query, { bots: next })}
            selected={active}
            check
          >
            <BotAvatar bot={bot} size="xs" />
            <span className="min-w-0 truncate">{bot.name}</span>
          </FilterChip>
        );
      })}
      {countAgendaFilters(query) > 0 ? (
        <Link
          href={agendaHref(query, { type: undefined, fav: false, bots: [] })}
          className="inline-flex min-h-11 items-center rounded-full px-3 text-sm text-muted underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Limpiar
        </Link>
      ) : null}
    </ChipRow>
  );
}
