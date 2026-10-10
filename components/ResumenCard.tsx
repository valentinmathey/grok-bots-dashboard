"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown, ChevronUp, Home, Newspaper, Sparkles } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { MarkdownBody } from "@/components/MarkdownBody";
import { asResumen, type ResumenDetails } from "@/lib/details";
import { formatDate, formatEventWhen, formatMoney } from "@/lib/format";
import type { Post } from "@/lib/types";

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-raised px-3 py-2.5">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">{value}</p>
    </div>
  );
}

export function ResumenCard({
  post,
  compact = false,
}: {
  post: Post;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(!compact);
  const details = asResumen(post.details);

  return (
    <article className="surface min-w-0 overflow-hidden rounded-3xl">
      <div className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_70%)] p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
          Resumen semanal
        </p>
        <h2 className="mt-1 text-[1.35rem] font-semibold tracking-tight sm:text-2xl">
          {post.title}
        </h2>
        {details ? (
          <p className="mt-1 text-sm text-muted">
            {formatDate(`${details.period_from}T12:00:00.000Z`)} —{" "}
            {formatDate(`${details.period_to}T12:00:00.000Z`)}
          </p>
        ) : null}
      </div>

      {details && open ? (
        <div className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
          {details.bots.map((bot) => (
            <section key={bot.bot_id} className="rounded-2xl border border-line/80 p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <BotAvatar
                  bot={{
                    slug: bot.slug,
                    name: bot.name,
                    avatar_color: bot.avatar_color,
                    avatar_url: bot.avatar_url,
                  }}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold tracking-tight">{bot.name}</h3>
                  {bot.status ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{bot.status}</p>
                  ) : (
                    <p className="mt-0.5 text-sm text-muted">Sin estado esta semana</p>
                  )}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat
                  label="Nuevos"
                  value={bot.new_posts}
                  icon={<Newspaper size={11} strokeWidth={1.75} />}
                />
                <Stat
                  label="Eventos"
                  value={bot.upcoming_events?.length ?? 0}
                  icon={<CalendarDays size={11} strokeWidth={1.75} />}
                />
                <Stat
                  label="Alojamientos"
                  value={bot.alojamientos?.new_count ?? 0}
                  icon={<Home size={11} strokeWidth={1.75} />}
                />
              </div>
              {bot.upcoming_events?.length ? (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {bot.upcoming_events.slice(0, 4).map((event) => (
                    <li key={`${event.title}-${event.event_at}`} className="flex justify-between gap-3">
                      <span className="min-w-0 truncate">{event.title}</span>
                      <span className="shrink-0 text-xs text-muted">
                        {formatEventWhen(event.event_at, event.event_end_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {bot.alojamientos?.best || bot.alojamientos?.cheapest ? (
                <div className="mt-3 space-y-1 text-sm">
                  {bot.alojamientos.best ? (
                    <p>
                      <Sparkles size={12} strokeWidth={1.75} className="mr-1 inline text-accent" />
                      Mejor score: {bot.alojamientos.best.title}
                      {bot.alojamientos.best.score != null
                        ? ` (${bot.alojamientos.best.score.toFixed(1)})`
                        : ""}
                    </p>
                  ) : null}
                  {bot.alojamientos.cheapest ? (
                    <p className="text-muted">
                      Más barato: {bot.alojamientos.cheapest.title}
                      {bot.alojamientos.cheapest.price_per_person != null
                        ? ` · ${formatMoney(bot.alojamientos.cheapest.price_per_person, bot.alojamientos.cheapest.currency || "BRL")} / pers.`
                        : ""}
                    </p>
                  ) : null}
                  {bot.alojamientos.price_drops?.length ? (
                    <p className="text-emerald-700 dark:text-emerald-300">
                      {bot.alojamientos.price_drops.length} bajaron de precio
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ))}
          {post.body_markdown?.trim() ? (
            <details className="text-sm text-muted">
              <summary className="cursor-pointer font-medium text-foreground">
                Ver en markdown
              </summary>
              <div className="mt-2">
                <MarkdownBody markdown={post.body_markdown} />
              </div>
            </details>
          ) : null}
        </div>
      ) : compact ? (
        <p className="px-4 pb-4 text-sm leading-6 text-muted sm:px-5">
          Lo que publicaron tus bots esta semana, con eventos y alojamientos destacados.
        </p>
      ) : null}

      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-center gap-1 border-t border-line px-4 py-3 text-sm font-medium text-accent"
        >
          {open ? <ChevronUp size={16} strokeWidth={1.75} /> : <ChevronDown size={16} strokeWidth={1.75} />}
          {open ? "Cerrar resumen" : "Ver el resumen"}
        </button>
      ) : null}
    </article>
  );
}

export function resumenFromPost(post: Post): ResumenDetails | null {
  return asResumen(post.details);
}
