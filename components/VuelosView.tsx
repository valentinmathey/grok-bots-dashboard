"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  CalendarDays,
  CircleDot,
  MapPin,
  Plane,
  PlaneTakeoff,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { FilterChip, SegmentedControl } from "@/components/FilterChip";
import { Sheet, SheetFooter } from "@/components/Sheet";
import { VueloCard } from "@/components/VueloCard";
import type { PostCardBot } from "@/components/PostCardHeader";
import type { Post } from "@/lib/types";
import {
  buildAerolineaFichas,
  CATEGORIA_LABELS,
  countVuelosFilters,
  EMPTY_VUELOS_FILTERS,
  formatYmdMonth,
  matchesVuelosFilters,
  ORIGEN_LABELS,
  sortVuelos,
  toggleVuelosEstados,
  uniqueAerolineas,
  uniqueDestinos,
  uniqueMeses,
  vuelosHref,
  VUELO_CATEGORIAS,
  VUELO_ESTADO_LABELS,
  VUELO_ESTADOS,
  VUELO_ORIGENES,
  effectiveVuelosEstados,
  type VueloCategoria,
  type VueloEstado,
  type VueloOrigen,
  type VuelosFilters,
  type VuelosSort,
} from "@/lib/vuelos";

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function VuelosView({
  posts,
  bot,
  filters,
  slug = "vuelos",
}: {
  posts: Post[];
  bot?: PostCardBot | null;
  filters: VuelosFilters;
  slug?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<VuelosFilters>(filters);

  const destinos = useMemo(() => uniqueDestinos(posts), [posts]);
  const meses = useMemo(() => uniqueMeses(posts), [posts]);
  const aerolineas = useMemo(() => uniqueAerolineas(posts), [posts]);
  const fichas = useMemo(() => buildAerolineaFichas(posts), [posts]);
  const visible = useMemo(
    () => sortVuelos(posts.filter((post) => matchesVuelosFilters(post, filters)), filters.sort),
    [posts, filters],
  );
  const active = countVuelosFilters(filters);

  function apply(next: VuelosFilters) {
    router.push(vuelosHref(next, {}, slug));
  }

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel="Ordenar por"
          className="min-w-0 flex-1 sm:flex-none"
          value={filters.sort}
          options={[
            {
              id: "precio",
              label: "Precio",
              onClick: () => apply({ ...filters, sort: "precio" }),
            },
            {
              id: "fecha",
              label: "Fecha",
              onClick: () => apply({ ...filters, sort: "fecha" }),
            },
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

      {visible.length === 0 ? (
        <EmptyState
          title={posts.length === 0 ? "Todavía no hay vuelos" : "Nada con esos filtros"}
          body={
            posts.length === 0
              ? "Cuando el bot publique una búsqueda, los vuelos aparecen acá."
              : "Probá otro destino, origen, mes, aerolínea o categoría."
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((post) => (
            <VueloCard key={post.id} post={post} bot={bot} fichas={fichas} />
          ))}
        </div>
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
              <MapPin size={13} strokeWidth={1.75} />
              Destino
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                selected={!draft.destinos.length}
                onClick={() => setDraft({ ...draft, destinos: [] })}
              >
                Todos
              </FilterChip>
              {destinos.map((destino) => (
                <FilterChip
                  key={destino}
                  selected={draft.destinos.includes(destino)}
                  check={draft.destinos.includes(destino)}
                  onClick={() =>
                    setDraft({ ...draft, destinos: toggle(draft.destinos, destino) })
                  }
                >
                  {destino}
                </FilterChip>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <PlaneTakeoff size={13} strokeWidth={1.75} />
              Origen
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                selected={!draft.origenes.length}
                onClick={() => setDraft({ ...draft, origenes: [] })}
              >
                Todos
              </FilterChip>
              {VUELO_ORIGENES.map((origen) => (
                <FilterChip
                  key={origen}
                  selected={draft.origenes.includes(origen)}
                  check={draft.origenes.includes(origen)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      origenes: toggle(draft.origenes, origen as VueloOrigen),
                    })
                  }
                >
                  {ORIGEN_LABELS[origen]}
                </FilterChip>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <CalendarDays size={13} strokeWidth={1.75} />
              Mes de viaje
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                selected={!draft.meses.length}
                onClick={() => setDraft({ ...draft, meses: [] })}
              >
                Todos
              </FilterChip>
              {meses.map((mes) => (
                <FilterChip
                  key={mes}
                  selected={draft.meses.includes(mes)}
                  check={draft.meses.includes(mes)}
                  onClick={() => setDraft({ ...draft, meses: toggle(draft.meses, mes) })}
                >
                  {formatYmdMonth(`${mes}-01`)}
                </FilterChip>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Plane size={13} strokeWidth={1.75} />
              Aerolínea
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                selected={!draft.aerolineas.length}
                onClick={() => setDraft({ ...draft, aerolineas: [] })}
              >
                Todas
              </FilterChip>
              {aerolineas.map((aerolinea) => (
                <FilterChip
                  key={aerolinea.key}
                  selected={draft.aerolineas.includes(aerolinea.key)}
                  check={draft.aerolineas.includes(aerolinea.key)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      aerolineas: toggle(draft.aerolineas, aerolinea.key),
                    })
                  }
                >
                  {aerolinea.label}
                </FilterChip>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <Tag size={13} strokeWidth={1.75} />
              Categoría
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                selected={!draft.categorias.length}
                onClick={() => setDraft({ ...draft, categorias: [] })}
              >
                Todas
              </FilterChip>
              {VUELO_CATEGORIAS.map((categoria) => (
                <FilterChip
                  key={categoria}
                  selected={draft.categorias.includes(categoria)}
                  check={draft.categorias.includes(categoria)}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      categorias: toggle(draft.categorias, categoria as VueloCategoria),
                    })
                  }
                >
                  {CATEGORIA_LABELS[categoria]}
                </FilterChip>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <CircleDot size={13} strokeWidth={1.75} />
              Estado
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                selected={effectiveVuelosEstados(draft).length === VUELO_ESTADOS.length}
                onClick={() =>
                  setDraft({ ...draft, estados: [...VUELO_ESTADOS] })
                }
              >
                Todos
              </FilterChip>
              {VUELO_ESTADOS.map((estado) => {
                const selected = effectiveVuelosEstados(draft).includes(estado);
                return (
                  <FilterChip
                    key={estado}
                    selected={selected}
                    check={selected}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        estados: toggleVuelosEstados(draft.estados, estado as VueloEstado),
                      })
                    }
                  >
                    {VUELO_ESTADO_LABELS[estado]}
                  </FilterChip>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Los no disponibles quedan ocultos hasta que los actives.
            </p>
          </section>

          <section>
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              <ArrowUpDown size={13} strokeWidth={1.75} />
              Ordenar por
            </p>
            <SegmentedControl
              ariaLabel="Ordenar por"
              value={draft.sort}
              options={[
                {
                  id: "precio",
                  label: "Precio",
                  onClick: () => setDraft({ ...draft, sort: "precio" as VuelosSort }),
                },
                {
                  id: "fecha",
                  label: "Fecha",
                  onClick: () => setDraft({ ...draft, sort: "fecha" as VuelosSort }),
                },
              ]}
            />
          </section>
        </div>
        <SheetFooter>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-full border border-line px-4 text-sm font-medium"
            onClick={() => {
              const cleared = { ...EMPTY_VUELOS_FILTERS, sort: draft.sort };
              setDraft(cleared);
              apply(cleared);
              setOpen(false);
            }}
          >
            Limpiar
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
            onClick={() => {
              apply(draft);
              setOpen(false);
            }}
          >
            Ver resultados
          </button>
        </SheetFooter>
      </Sheet>
    </div>
  );
}
