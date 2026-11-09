"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import {
  CalendarDays,
  CircleCheck,
  Headphones,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Wallet,
  Bot as BotIcon,
} from "lucide-react";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { DateRangeField } from "@/components/DateRangeField";
import { FilterGroup, FilterToolbar, type ActiveFilterChip } from "@/components/FilterToolbar";
import {
  EMPTY_SEARCH_UI_FILTERS,
  SEARCH_DATE_PRESETS,
  SEARCH_KIND_GROUPS,
  SEARCH_PRICE_FILTERS,
  SEARCH_STATUS_FILTERS,
  countSearchUiFilters,
  searchDatePresetRange,
  searchUiHref,
  type SearchDatePresetId,
  type SearchKindGroupId,
  type SearchPriceFilter,
  type SearchStatusFilter,
  type SearchUiFilters,
} from "@/lib/search-filters";
import {
  IMPORTANCE_BADGE,
  IMPORTANCE_FILTER_LEVELS,
  IMPORTANCE_LABELS,
  type ImportanceLevel,
} from "@/lib/importance";
import { MZA_AGE_FILTERS, MZA_AGE_LABELS, type MzaAgeFilter } from "@/lib/mendoza";

type BotOption = { id: string; slug: string; name: string };

/**
 * Sheet de Filtros de Buscar: secciones ordenadas, URL via replace (no bloquea),
 * estado optimista al tocar chips.
 */
export function BuscarFilters({
  q,
  sort,
  filters,
  bots,
  resultsCount,
}: {
  q: string;
  sort?: string;
  filters: SearchUiFilters;
  bots: BotOption[];
  resultsCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState(filters);

  useEffect(() => {
    setOptimistic(filters);
  }, [filters]);

  const applied = countSearchUiFilters(optimistic);

  function go(next: SearchUiFilters) {
    setOptimistic(next);
    const href = searchUiHref(q, next, {}, sort);
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  function patch(partial: Partial<SearchUiFilters>) {
    go({ ...optimistic, ...partial });
  }

  function toggleInList<T extends string>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  const clearHref = searchUiHref(q, EMPTY_SEARCH_UI_FILTERS, {}, sort);

  const activeChips: ActiveFilterChip[] = [];
  if (optimistic.datePreset || optimistic.from || optimistic.to) {
    const label = optimistic.datePreset
      ? SEARCH_DATE_PRESETS.find((p) => p.id === optimistic.datePreset)?.label
      : [optimistic.from, optimistic.to].filter(Boolean).join(" → ");
    activeChips.push({
      label: label ?? "Fecha",
      removeHref: searchUiHref(q, optimistic, { datePreset: null, from: undefined, to: undefined }, sort),
    });
  }
  if (optimistic.importance.length) {
    activeChips.push({
      label: optimistic.importance.map((i) => IMPORTANCE_LABELS[i]).join(", "),
      removeHref: searchUiHref(q, optimistic, { importance: [] }, sort),
    });
  }
  if (optimistic.favoritesOnly) {
    activeChips.push({
      label: "Favoritos",
      removeHref: searchUiHref(q, optimistic, { favoritesOnly: false }, sort),
    });
  }
  if (optimistic.bots.length) {
    activeChips.push({
      label: optimistic.bots
        .map((slug) => bots.find((b) => b.slug === slug)?.name ?? slug)
        .join(", "),
      removeHref: searchUiHref(q, optimistic, { bots: [] }, sort),
    });
  }

  return (
    <div className={pending ? "opacity-90" : undefined}>
      <FilterToolbar
        forceSheet
        applied={applied}
        resultsCount={resultsCount}
        clearHref={clearHref}
        activeChips={activeChips}
      >
        <FilterGroup label="Fecha">
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <CalendarDays size={12} strokeWidth={1.75} />
            Según la fecha del evento (Mendoza). Sin fecha quedan afuera.
          </p>
          <ChipRow>
            <FilterChip
              size="sm"
              selected={!optimistic.datePreset && !optimistic.from && !optimistic.to}
              onClick={() => patch({ datePreset: null, from: undefined, to: undefined })}
            >
              Cualquier fecha
            </FilterChip>
            {SEARCH_DATE_PRESETS.map((preset) => (
              <FilterChip
                key={preset.id}
                size="sm"
                selected={optimistic.datePreset === preset.id}
                check={optimistic.datePreset === preset.id}
                onClick={() => {
                  const range = searchDatePresetRange(preset.id);
                  patch({
                    datePreset: preset.id as SearchDatePresetId,
                    from: range.from,
                    to: range.to,
                  });
                }}
              >
                {preset.label}
              </FilterChip>
            ))}
          </ChipRow>
          <DateRangeField
            title="Desde / hasta"
            value={{ from: optimistic.from, to: optimistic.to }}
            onChange={(range) =>
              patch({
                datePreset: null,
                from: range.from,
                to: range.to,
              })
            }
          />
        </FilterGroup>

        <FilterGroup label="Importancia">
          <ChipRow>
            {IMPORTANCE_FILTER_LEVELS.map((level) => {
              const selected = optimistic.importance.includes(level);
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
                    patch({
                      importance: toggleInList(optimistic.importance, level),
                    })
                  }
                >
                  {badge ? `${badge.emoji} ` : ""}
                  {IMPORTANCE_LABELS[level]}
                </FilterChip>
              );
            })}
          </ChipRow>
        </FilterGroup>

        <FilterGroup label="Estado">
          <ChipRow>
            {SEARCH_STATUS_FILTERS.map((st) => {
              const selected = optimistic.status.includes(st);
              return (
                <FilterChip
                  key={st}
                  size="sm"
                  selected={selected}
                  check={selected}
                  onClick={() =>
                    patch({ status: toggleInList(optimistic.status, st as SearchStatusFilter) })
                  }
                >
                  {st === "activo" ? "Activo" : st === "cambiado" ? "Cambiado" : "Cancelado"}
                </FilterChip>
              );
            })}
          </ChipRow>
        </FilterGroup>

        <FilterGroup label="Precio">
          <ChipRow>
            {SEARCH_PRICE_FILTERS.map((p) => (
              <FilterChip
                key={p}
                size="sm"
                selected={optimistic.price === p}
                check={optimistic.price === p}
                onClick={() =>
                  patch({
                    price: optimistic.price === p ? null : (p as SearchPriceFilter),
                  })
                }
              >
                <Wallet size={12} strokeWidth={1.75} className="mr-0.5 inline" />
                {p === "gratis" ? "Gratis" : "Pago"}
              </FilterChip>
            ))}
          </ChipRow>
        </FilterGroup>

        <FilterGroup label="Edad">
          <ChipRow>
            {MZA_AGE_FILTERS.map((a) => (
              <FilterChip
                key={a}
                size="sm"
                selected={optimistic.age === a}
                check={optimistic.age === a}
                onClick={() =>
                  patch({ age: optimistic.age === a ? null : (a as MzaAgeFilter) })
                }
              >
                <ShieldCheck size={12} strokeWidth={1.75} className="mr-0.5 inline" />
                {MZA_AGE_LABELS[a]}
              </FilterChip>
            ))}
          </ChipRow>
        </FilterGroup>

        <FilterGroup label="Más">
          <ChipRow>
            <FilterChip
              size="sm"
              selected={optimistic.buyBeforeSoon}
              check={optimistic.buyBeforeSoon}
              onClick={() => patch({ buyBeforeSoon: !optimistic.buyBeforeSoon })}
            >
              <Sparkles size={12} strokeWidth={1.75} className="mr-0.5 inline" />
              Comprar antes (próximo)
            </FilterChip>
            <FilterChip
              size="sm"
              selected={optimistic.registered === "si"}
              check={optimistic.registered === "si"}
              onClick={() =>
                patch({ registered: optimistic.registered === "si" ? null : "si" })
              }
            >
              <CircleCheck size={12} strokeWidth={1.75} className="mr-0.5 inline" />
              Ya me inscribí
            </FilterChip>
            <FilterChip
              size="sm"
              selected={optimistic.registered === "no"}
              check={optimistic.registered === "no"}
              onClick={() =>
                patch({ registered: optimistic.registered === "no" ? null : "no" })
              }
            >
              No inscripto
            </FilterChip>
            <FilterChip
              size="sm"
              selected={optimistic.hasAudio}
              check={optimistic.hasAudio}
              onClick={() => patch({ hasAudio: !optimistic.hasAudio })}
            >
              <Headphones size={12} strokeWidth={1.75} className="mr-0.5 inline" />
              Con audio
            </FilterChip>
            <FilterChip
              size="sm"
              selected={optimistic.favoritesOnly}
              check={optimistic.favoritesOnly}
              onClick={() => patch({ favoritesOnly: !optimistic.favoritesOnly })}
            >
              <Star size={12} strokeWidth={1.75} className="mr-0.5 inline" />
              Solo favoritos
            </FilterChip>
          </ChipRow>
        </FilterGroup>

        <FilterGroup label="Tipo de contenido">
          <ChipRow>
            {SEARCH_KIND_GROUPS.map((g) => {
              const selected = optimistic.kindGroups.includes(g.id);
              return (
                <FilterChip
                  key={g.id}
                  size="sm"
                  selected={selected}
                  check={selected}
                  onClick={() =>
                    patch({
                      kindGroups: toggleInList(
                        optimistic.kindGroups,
                        g.id as SearchKindGroupId,
                      ),
                    })
                  }
                >
                  <Tag size={12} strokeWidth={1.75} className="mr-0.5 inline" />
                  {g.label}
                </FilterChip>
              );
            })}
          </ChipRow>
        </FilterGroup>

        <FilterGroup label="Bots">
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <BotIcon size={12} strokeWidth={1.75} />
            Al final, para no mezclarlos con el resto.
          </p>
          <ChipRow>
            <FilterChip
              size="sm"
              selected={!optimistic.bots.length}
              onClick={() => patch({ bots: [] })}
            >
              Todos
            </FilterChip>
            {bots.map((bot) => {
              const selected = optimistic.bots.includes(bot.slug);
              return (
                <FilterChip
                  key={bot.id}
                  size="sm"
                  selected={selected}
                  check={selected}
                  onClick={() =>
                    patch({ bots: toggleInList(optimistic.bots, bot.slug) })
                  }
                >
                  <span className="min-w-0 truncate">{bot.name}</span>
                </FilterChip>
              );
            })}
          </ChipRow>
        </FilterGroup>
      </FilterToolbar>
    </div>
  );
}
