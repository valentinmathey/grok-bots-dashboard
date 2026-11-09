"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Bot as BotIcon,
} from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { DateRangeField } from "@/components/DateRangeField";
import { EmptyState } from "@/components/EmptyState";
import { ChipRow, FilterChip, SegmentedControl } from "@/components/FilterChip";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { Sheet, SheetFooter } from "@/components/Sheet";
import { formatEventWhen } from "@/lib/format";
import {
  EVENT_BOT_LABELS,
  EVENT_BOT_SLUGS,
  EVENTOS_DATE_PRESETS,
  countEventosFilters,
  eventosHref,
  eventosPresetRange,
  filterAndSortEventos,
  matchingEventosPreset,
  type EventosFilters,
  type EventosItem,
  type EventosSort,
} from "@/lib/eventos";
import {
  IMPORTANCE_BADGE,
  IMPORTANCE_FILTER_LEVELS,
  IMPORTANCE_LABELS,
  type ImportanceLevel,
} from "@/lib/importance";
import {
  MZA_AGE_FILTERS,
  MZA_AGE_LABELS,
  type MzaAgeFilter,
} from "@/lib/mendoza";

export function EventosView({
  items,
  filters,
}: {
  items: EventosItem[];
  filters: EventosFilters;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EventosFilters>(filters);
  const active = countEventosFilters(filters);
  const visible = useMemo(() => filterAndSortEventos(items, filters), [items, filters]);

  function apply(next: EventosFilters) {
    router.push(eventosHref(next));
  }

  function setSort(sort: EventosSort) {
    apply({ ...filters, sort });
  }

  const preset = matchingEventosPreset({ from: draft.from, to: draft.to });

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel="Ordenar"
          className="min-w-0 flex-1 sm:flex-none"
          value={filters.sort}
          options={[
            { id: "fecha", label: "Fecha", onClick: () => setSort("fecha") },
            {
              id: "importancia",
              label: "Importancia",
              onClick: () => setSort("importancia"),
            },
            { id: "bot", label: "Bot", onClick: () => setSort("bot") },
          ]}
        />
        <button
          type="button"
          onClick={() => {
            setDraft(filters);
            setOpen(true);
          }}
          className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-medium sm:px-4"
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} />
          Filtros
          {active ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
              {active}
            </span>
          ) : null}
        </button>
      </div>

      {/* Desktop: chips rápidos de bot también visibles */}
      <div className="hidden sm:block">
        <ChipRow>
          <FilterChip
            selected={!filters.bots.length}
            onClick={() => apply({ ...filters, bots: [] })}
          >
            Todos
          </FilterChip>
          {EVENT_BOT_SLUGS.map((slug) => (
            <FilterChip
              key={slug}
              selected={filters.bots.includes(slug)}
              check={filters.bots.includes(slug)}
              onClick={() => {
                const on = filters.bots.includes(slug);
                apply({
                  ...filters,
                  bots: on
                    ? filters.bots.filter((s) => s !== slug)
                    : [...filters.bots, slug],
                });
              }}
            >
              {EVENT_BOT_LABELS[slug]}
            </FilterChip>
          ))}
        </ChipRow>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nada con esos filtros"
          body="Probá otro bot, fecha, importancia o edad."
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <li key={item.id}>
              <EventosRow item={item} />
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filtros"
        desktopDialog
      >
        <div className="space-y-5">
          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <BotIcon size={13} strokeWidth={1.75} />
              Bot
            </p>
            <div className="flex flex-wrap gap-2">
              {EVENT_BOT_SLUGS.map((slug) => {
                const selected = draft.bots.includes(slug);
                return (
                  <FilterChip
                    key={slug}
                    size="sm"
                    selected={selected}
                    check={selected}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        bots: selected
                          ? draft.bots.filter((s) => s !== slug)
                          : [...draft.bots, slug],
                      })
                    }
                  >
                    {EVENT_BOT_LABELS[slug]}
                  </FilterChip>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <CalendarDays size={13} strokeWidth={1.75} />
              Fechas
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              {EVENTOS_DATE_PRESETS.map((p) => (
                <FilterChip
                  key={p.id}
                  size="sm"
                  selected={preset === p.id}
                  onClick={() => {
                    const range = eventosPresetRange(p.id);
                    setDraft({ ...draft, from: range.from, to: range.to });
                  }}
                >
                  {p.label}
                </FilterChip>
              ))}
            </div>
            <DateRangeField
              title="Desde / hasta"
              value={{ from: draft.from, to: draft.to }}
              onChange={(range) =>
                setDraft({ ...draft, from: range.from, to: range.to })
              }
            />
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Sparkles size={13} strokeWidth={1.75} />
              Importancia
            </p>
            <div className="flex flex-wrap gap-2">
              {IMPORTANCE_FILTER_LEVELS.map((level) => {
                const selected = draft.importance.includes(level);
                const badge =
                  level !== "normal"
                    ? IMPORTANCE_BADGE[level as Exclude<ImportanceLevel, "normal">]
                    : null;
                return (
                  <FilterChip
                    key={level}
                    size="sm"
                    selected={selected}
                    check={selected}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        importance: selected
                          ? draft.importance.filter((x) => x !== level)
                          : [...draft.importance, level],
                      })
                    }
                  >
                    {badge ? `${badge.emoji} ` : ""}
                    {IMPORTANCE_LABELS[level]}
                  </FilterChip>
                );
              })}
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Estado
            </p>
            <FilterChip
              size="sm"
              selected={draft.changedOnly}
              check={draft.changedOnly}
              onClick={() => setDraft({ ...draft, changedOnly: !draft.changedOnly })}
            >
              Solo cambiados / cancelados
            </FilterChip>
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <ShieldCheck size={13} strokeWidth={1.75} />
              Edad
            </p>
            <div className="flex flex-wrap gap-2">
              {MZA_AGE_FILTERS.map((a) => (
                <FilterChip
                  key={a}
                  size="sm"
                  selected={draft.age === a}
                  check={draft.age === a}
                  onClick={() =>
                    setDraft({ ...draft, age: draft.age === a ? null : (a as MzaAgeFilter) })
                  }
                >
                  {MZA_AGE_LABELS[a]}
                </FilterChip>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              Cada +N muestra solo los que piden exactamente esa edad mínima. «Apto menores»
              incluye los que no informan edad.
            </p>
          </section>
        </div>
        <SheetFooter>
          <button
            type="button"
            onClick={() => setDraft({ ...filters, ...{ bots: [], from: undefined, to: undefined, importance: [], changedOnly: false, age: null }, sort: draft.sort })}
            className="min-h-11 flex-1 rounded-full border border-line px-4 text-sm font-medium"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => {
              apply(draft);
              setOpen(false);
            }}
            className="min-h-11 flex-1 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
          >
            Aplicar
          </button>
        </SheetFooter>
      </Sheet>
    </div>
  );
}

function EventosRow({ item }: { item: EventosItem }) {
  const details = (item.details ?? {}) as Record<string, unknown>;
  const venue = typeof details.venue === "string" ? details.venue : null;
  const status = String(details.status ?? "activo");

  return (
    <Link
      href={`/bots/${item.bot.slug}#post-${item.id}`}
      className="surface flex items-start gap-3 rounded-2xl px-3 py-2.5"
    >
      <BotAvatar bot={item.bot} size="sm" className="mt-0.5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <ImportanceBadge details={details} compact />
          {status === "cambiado" ? (
            <span className="rounded-full bg-amber-400/25 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              Cambiado
            </span>
          ) : null}
          {status === "cancelado" ? (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-400">
              Cancelado
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block text-sm font-semibold leading-5">{item.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
          {item.event_at ? (
            <span className="inline-flex items-center gap-1 font-medium tabular-nums">
              <CalendarDays size={11} strokeWidth={1.75} />
              {formatEventWhen(item.event_at, item.event_end_at)}
            </span>
          ) : null}
          <span className="rounded-full bg-chip px-2 py-0.5 font-medium">
            {EVENT_BOT_LABELS[item.bot.slug as keyof typeof EVENT_BOT_LABELS] ?? item.bot.name}
          </span>
          {venue ? <span className="min-w-0 truncate">{venue}</span> : null}
        </span>
      </span>
    </Link>
  );
}
