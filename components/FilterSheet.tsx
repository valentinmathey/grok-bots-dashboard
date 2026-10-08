"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  countActiveFilters,
  filtersToSearchParams,
  type FeedQuery,
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
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded-full px-3 text-sm ${
        active
          ? "bg-accent text-accent-ink"
          : "bg-chip text-foreground/80 hover:bg-line"
      }`}
    >
      {children}
    </button>
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

  function toggleSort(sort: SortOrder) {
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
    push(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setDraft(query);
            setOpen(true);
          }}
          className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-medium sm:flex-none sm:px-4"
        >
          Filtros
          {active > 0 ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
              {active}
            </span>
          ) : null}
        </button>
        <div className="flex shrink-0 rounded-full bg-chip p-1">
          <button
            type="button"
            onClick={() => toggleSort("newest")}
            className={`min-h-8 rounded-full px-3 text-xs font-medium ${
              query.sort === "newest" ? "bg-card text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Nuevas
          </button>
          <button
            type="button"
            onClick={() => toggleSort("oldest")}
            className={`min-h-8 rounded-full px-3 text-xs font-medium ${
              query.sort === "oldest" ? "bg-card text-foreground shadow-sm" : "text-muted"
            }`}
          >
            Antiguas
          </button>
        </div>
      </div>

      {chipFilters.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {chipFilters.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => removeChip(chip.key)}
              className="inline-flex min-h-8 items-center gap-1 rounded-full bg-chip px-2.5 text-xs"
            >
              {chip.label}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar filtros"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-card p-5 pb-8 shadow-2xl sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Filtros</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted"
              >
                Cerrar
              </button>
            </div>

            {facets.products.length > 0 ? (
              <section className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
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

            <section className="mt-5 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
              <label className="text-xs">
                <span className="mb-1 block font-medium text-muted">Desde</span>
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
                <span className="mb-1 block font-medium text-muted">Hasta</span>
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
