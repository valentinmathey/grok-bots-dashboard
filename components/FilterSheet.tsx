"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  CalendarDays,
  Hash,
  Package,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  Wallet,
} from "lucide-react";
import { ChipRow, FilterChip, SegmentedControl } from "@/components/FilterChip";
import { Sheet } from "@/components/Sheet";
import { amenityLabel, oportunidadCategoryLabel } from "@/lib/details";
import {
  countActiveFilters,
  filtersToSearchParams,
  type FeedQuery,
  type FeedSort,
  type SortOrder,
} from "@/lib/filters";
import { kindLabel } from "@/lib/format";
import type { PostFacets } from "@/lib/types";

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <FilterChip selected={active} onClick={onClick} check={active}>
      {children}
    </FilterChip>
  );
}

export function FilterSheet({
  action,
  facets,
  query,
}: {
  action: string;
  facets: PostFacets;
  query: FeedQuery;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FeedQuery>(query);
  const active = countActiveFilters(query);

  const alojamiento = facets.has_alojamientos && !facets.has_events;
  const oportunidades =
    facets.has_oportunidades && !facets.has_events && !alojamiento;
  const chipFilters = useMemo(
    () =>
      [
        query.product ? { key: "product", label: query.product } : null,
        query.kind ? { key: "kind", label: kindLabel(query.kind) } : null,
        query.tag ? { key: "tag", label: `#${query.tag}` } : null,
        query.from || query.to
          ? {
              key: "dates",
              label: [query.from, query.to].filter(Boolean).join(" → "),
            }
          : null,
        query.city ? { key: "city", label: query.city } : null,
        query.search_area ? { key: "search_area", label: query.search_area } : null,
        query.neighborhood ? { key: "neighborhood", label: query.neighborhood } : null,
        query.max_price_pp != null
          ? { key: "max_price_pp", label: `Hasta ${query.max_price_pp}/pers.` }
          : null,
        query.amenities?.length
          ? { key: "amenities", label: query.amenities.map(amenityLabel).join(" + ") }
          : null,
        query.category
          ? { key: "category", label: oportunidadCategoryLabel(query.category) }
          : null,
        query.recommended ? { key: "recommended", label: "Solo recomendadas" } : null,
        query.openOnly ? { key: "open", label: "Abiertas" } : null,
      ].filter(Boolean) as Array<{ key: string; label: string }>,
    [query],
  );

  function push(next: FeedQuery) {
    const params = filtersToSearchParams(next);
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action);
  }

  function apply() {
    push(draft);
    setOpen(false);
  }

  function clear() {
    const next = { sort: query.sort } as FeedQuery;
    setDraft(next);
    push(next);
    setOpen(false);
  }

  function toggleSort(sort: FeedSort | SortOrder) {
    push({ ...query, sort });
  }

  function removeChip(key: string) {
    const next = { ...query };
    if (key === "product") next.product = undefined;
    if (key === "kind") next.kind = undefined;
    if (key === "tag") next.tag = undefined;
    if (key === "dates") {
      next.from = undefined;
      next.to = undefined;
    }
    if (key === "city") next.city = undefined;
    if (key === "search_area") next.search_area = undefined;
    if (key === "neighborhood") next.neighborhood = undefined;
    if (key === "max_price_pp") next.max_price_pp = undefined;
    if (key === "amenities") next.amenities = undefined;
    if (key === "category") next.category = undefined;
    if (key === "recommended") next.recommended = undefined;
    if (key === "open") next.openOnly = undefined;
    push(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => {
            setDraft(query);
            setOpen(true);
          }}
          className="inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-medium sm:w-auto sm:px-4"
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} />
          Filtros
          {active > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
              {active}
            </span>
          ) : null}
        </button>
        {alojamiento ? (
          <SegmentedControl
            className="sm:flex-1"
            value={query.sort ?? "score"}
            options={[
              { id: "score", label: "Score", onClick: () => toggleSort("score") },
              { id: "price_pp", label: "$/pers.", onClick: () => toggleSort("price_pp") },
              { id: "price_total", label: "Total", onClick: () => toggleSort("price_total") },
              { id: "rating", label: "Nota", onClick: () => toggleSort("rating") },
            ]}
          />
        ) : oportunidades ? (
          <SegmentedControl
            className="sm:flex-1"
            value={query.sort ?? "newest"}
            options={[
              { id: "newest", label: "Nuevas", onClick: () => toggleSort("newest") },
              { id: "deadline", label: "Cierre", onClick: () => toggleSort("deadline") },
              { id: "prize", label: "Premio", onClick: () => toggleSort("prize") },
            ]}
          />
        ) : (
          <SegmentedControl
            className="sm:w-auto"
            value={query.sort === "oldest" ? "oldest" : "newest"}
            options={[
              {
                id: "newest",
                label: (
                  <>
                    <ArrowDownNarrowWide size={13} strokeWidth={1.75} />
                    {facets.has_events
                      ? query.when === "past"
                        ? "Recientes"
                        : "Próximos"
                      : "Nuevas"}
                  </>
                ),
                onClick: () => toggleSort("newest"),
              },
              {
                id: "oldest",
                label: (
                  <>
                    <ArrowUpNarrowWide size={13} strokeWidth={1.75} />
                    {facets.has_events
                      ? query.when === "past"
                        ? "Antiguos"
                        : "Lejanos"
                      : "Antiguas"}
                  </>
                ),
                onClick: () => toggleSort("oldest"),
              },
            ]}
          />
        )}
      </div>

      {oportunidades ? (
        <ChipRow>
          <Chip
            active={Boolean(query.recommended)}
            onClick={() => push({ ...query, recommended: query.recommended ? undefined : true })}
          >
            <Star size={12} strokeWidth={1.75} className="mr-1 inline" />
            Solo recomendadas
          </Chip>
          <Chip
            active={Boolean(query.openOnly)}
            onClick={() => push({ ...query, openOnly: query.openOnly ? undefined : true })}
          >
            Abiertas
          </Chip>
          {facets.categories.map((category) => (
            <Chip
              key={category}
              active={query.category === category}
              onClick={() =>
                push({
                  ...query,
                  category: query.category === category ? undefined : category,
                })
              }
            >
              {oportunidadCategoryLabel(category)}
            </Chip>
          ))}
        </ChipRow>
      ) : null}

      {chipFilters.length > 0 ? (
        <ChipRow>
          {chipFilters.map((chip) => (
            <FilterChip key={chip.key} selected size="sm" onClick={() => removeChip(chip.key)}>
              {chip.label}
              <span aria-hidden>×</span>
            </FilterChip>
          ))}
        </ChipRow>
      ) : null}

      <Sheet open={open} onClose={() => setOpen(false)} title="Filtros" desktopDialog>
            {facets.products.length > 0 ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  <Package size={12} strokeWidth={1.75} className="mr-1 inline" />
                  Producto
                </p>
                <div className="flex flex-wrap gap-2">
                  {facets.products.map((product) => (
                    <Chip
                      key={product}
                      active={draft.product === product}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          product: current.product === product ? undefined : product,
                        }))
                      }
                    >
                      {product}
                    </Chip>
                  ))}
                </div>
              </section>
            ) : null}

            {facets.kinds.length > 0 ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  <Sparkles size={12} strokeWidth={1.75} className="mr-1 inline" />
                  Tipo
                </p>
                <div className="flex flex-wrap gap-2">
                  {facets.kinds.map((kind) => (
                    <Chip
                      key={kind}
                      active={draft.kind === kind}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          kind: current.kind === kind ? undefined : kind,
                        }))
                      }
                    >
                      {kindLabel(kind)}
                    </Chip>
                  ))}
                </div>
              </section>
            ) : null}

            {facets.tags.length > 0 ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  <Hash size={12} strokeWidth={1.75} className="mr-1 inline" />
                  Etiquetas
                </p>
                <div className="flex flex-wrap gap-2">
                  {facets.tags.map((tag) => (
                    <Chip
                      key={tag}
                      active={draft.tag === tag}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          tag: current.tag === tag ? undefined : tag,
                        }))
                      }
                    >
                      #{tag}
                    </Chip>
                  ))}
                </div>
              </section>
            ) : null}

            {alojamiento && (facets.cities.length > 0 || facets.search_areas.length > 0) ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  Ciudad / zona
                </p>
                <div className="flex flex-wrap gap-2">
                  {facets.cities.map((city) => (
                    <Chip
                      key={city}
                      active={draft.city === city}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          city: current.city === city ? undefined : city,
                        }))
                      }
                    >
                      {city}
                    </Chip>
                  ))}
                  {facets.search_areas.map((area) => (
                    <Chip
                      key={area}
                      active={draft.search_area === area}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          search_area: current.search_area === area ? undefined : area,
                        }))
                      }
                    >
                      {area}
                    </Chip>
                  ))}
                </div>
              </section>
            ) : null}

            {alojamiento && facets.neighborhoods.length > 0 ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  Barrio
                </p>
                <div className="flex flex-wrap gap-2">
                  {facets.neighborhoods.map((neighborhood) => (
                    <Chip
                      key={neighborhood}
                      active={draft.neighborhood === neighborhood}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          neighborhood:
                            current.neighborhood === neighborhood ? undefined : neighborhood,
                        }))
                      }
                    >
                      {neighborhood}
                    </Chip>
                  ))}
                </div>
              </section>
            ) : null}

            {alojamiento ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  <Wallet size={12} strokeWidth={1.75} className="mr-1 inline" />
                  Precio máximo por persona
                </p>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Ej. 400"
                  value={draft.max_price_pp ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      max_price_pp: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    }))
                  }
                  className="min-h-11 w-full rounded-2xl border border-line bg-raised px-3 text-sm"
                />
              </section>
            ) : null}

            {oportunidades && facets.categories.length > 0 ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  <Trophy size={12} strokeWidth={1.75} className="mr-1 inline" />
                  Categoría
                </p>
                <div className="flex flex-wrap gap-2">
                  {facets.categories.map((category) => (
                    <Chip
                      key={category}
                      active={draft.category === category}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          category: current.category === category ? undefined : category,
                        }))
                      }
                    >
                      {oportunidadCategoryLabel(category)}
                    </Chip>
                  ))}
                </div>
              </section>
            ) : null}

            {oportunidades ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  Estado
                </p>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    active={Boolean(draft.recommended)}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        recommended: current.recommended ? undefined : true,
                      }))
                    }
                  >
                    Solo recomendadas
                  </Chip>
                  <Chip
                    active={Boolean(draft.openOnly)}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        openOnly: current.openOnly ? undefined : true,
                      }))
                    }
                  >
                    Abiertas
                  </Chip>
                </div>
              </section>
            ) : null}

            {alojamiento && facets.amenities.length > 0 ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  <Star size={12} strokeWidth={1.75} className="mr-1 inline" />
                  Amenities
                </p>
                <div className="flex flex-wrap gap-2">
                  {facets.amenities.map((amenity) => {
                    const active = draft.amenities?.includes(amenity);
                    return (
                      <Chip
                        key={amenity}
                        active={Boolean(active)}
                        onClick={() =>
                          setDraft((current) => {
                            const have = new Set(current.amenities ?? []);
                            if (have.has(amenity)) have.delete(amenity);
                            else have.add(amenity);
                            return {
                              ...current,
                              amenities: have.size ? [...have] : undefined,
                            };
                          })
                        }
                      >
                        {amenityLabel(amenity)}
                      </Chip>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
              <label className="text-xs">
                <span className="mb-1 flex items-center gap-1 font-medium text-muted">
                  <CalendarDays size={12} strokeWidth={1.75} />
                  {facets.has_events ? "Desde (evento)" : "Desde"}
                </span>
                <input
                  type="date"
                  value={draft.from ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      from: event.target.value || undefined,
                    }))
                  }
                  className="min-h-11 w-full rounded-2xl border border-line bg-raised px-3 text-sm"
                />
              </label>
              <label className="text-xs">
                <span className="mb-1 block font-medium text-muted">
                  {facets.has_events ? "Hasta (evento)" : "Hasta"}
                </span>
                <input
                  type="date"
                  value={draft.to ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      to: event.target.value || undefined,
                    }))
                  }
                  className="min-h-11 w-full rounded-2xl border border-line bg-raised px-3 text-sm"
                />
              </label>
            </section>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={clear}
                className="min-h-11 flex-1 rounded-full border border-line text-sm font-medium"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={apply}
                className="min-h-11 flex-1 rounded-full bg-accent text-sm font-semibold text-accent-ink"
              >
                Aplicar
              </button>
            </div>
      </Sheet>
    </div>
  );
}
