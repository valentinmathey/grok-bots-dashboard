"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { Sheet } from "@/components/Sheet";
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
  const [open, setOpen] = useState(false);
  const applied = countAgendaFilters(query);

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Vista</p>
        <div
          role="tablist"
          aria-label="Vista"
          className="grid w-full min-w-0 grid-cols-2 gap-1 rounded-2xl bg-chip p-1 lg:max-w-xs"
        >
          <Link
            href={agendaHref(query, { view: "lista" })}
            role="tab"
            aria-selected={query.view === "lista"}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              query.view === "lista"
                ? "bg-accent font-semibold text-accent-ink"
                : "font-medium text-muted hover:bg-card hover:text-foreground"
            }`}
          >
            Lista
          </Link>
          <Link
            href={agendaHref(query, { view: "calendario" })}
            role="tab"
            aria-selected={query.view === "calendario"}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              query.view === "calendario"
                ? "bg-accent font-semibold text-accent-ink"
                : "font-medium text-muted hover:bg-card hover:text-foreground"
            }`}
          >
            Calendario
          </Link>
        </div>
      </div>

      <div className="hidden min-w-0 lg:block">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Actividades
        </p>
        <ActivityChips query={query} bots={bots} />
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-card px-3 text-sm font-medium lg:hidden"
      >
        <SlidersHorizontal size={16} strokeWidth={1.75} />
        Filtros
        {applied > 0 ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
            {applied}
          </span>
        ) : null}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Filtros">
        <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Actividades
            </p>
            <ActivityChips query={query} bots={bots} />
          </div>
        </div>
      </Sheet>
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
    <div className="flex w-full min-w-0 flex-wrap gap-2">
      {TYPES.map((type) => {
        const active = type.id ? query.type === type.id : !query.type;
        return (
          <Link
            key={type.label}
            href={agendaHref(query, { type: type.id })}
            className={chipClass(active)}
            aria-pressed={active}
          >
            {active ? <span aria-hidden>✓</span> : null}
            {type.label}
          </Link>
        );
      })}
      <Link
        href={agendaHref(query, { fav: !query.fav })}
        className={chipClass(Boolean(query.fav))}
        aria-pressed={Boolean(query.fav)}
      >
        {query.fav ? <span aria-hidden>✓</span> : null}
        Solo favoritos
      </Link>
      {bots.map((bot) => {
        const active = query.bots.includes(bot.slug);
        const next = active
          ? query.bots.filter((slug) => slug !== bot.slug)
          : [...query.bots, bot.slug];
        return (
          <Link
            key={bot.slug}
            href={agendaHref(query, { bots: next })}
            className={chipClass(active)}
            aria-pressed={active}
          >
            <BotAvatar bot={bot} size="xs" />
            {bot.name}
          </Link>
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
    </div>
  );
}

function chipClass(active: boolean) {
  return `inline-flex max-w-full min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
    active
      ? "border-accent bg-accent text-accent-ink"
      : "border-line bg-card text-foreground hover:bg-chip"
  }`;
}
