"use client";

import { useId } from "react";
import Link from "next/link";
import { LineChart, Newspaper, Sparkles, Target, Workflow } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  ExpandChevron,
  useExpandable,
} from "@/components/ExpandableCard";
import { MarkdownBody } from "@/components/MarkdownBody";
import { PostCardHeader, type PostCardBot } from "@/components/PostCardHeader";
import { TimeStamp } from "@/components/TimeStamp";
import {
  asResumen,
  deadlineChipLabel,
  oportunidadCategoryLabel,
  type ResumenDetails,
} from "@/lib/details";
import { formatDate, formatEventWhen, formatMoney, kindLabel } from "@/lib/format";
import { persistResumenOpen } from "@/lib/resumen-collapse";
import type { Post } from "@/lib/types";

function postHref(slug: string, postId?: string | null) {
  return postId ? `/bots/${slug}#post-${postId}` : `/bots/${slug}`;
}

function botLead(bot: ResumenDetails["bots"][number]): string {
  const bits = [
    bot.new_posts ? `${bot.new_posts} ${bot.new_posts === 1 ? "nuevo" : "nuevos"}` : null,
    bot.upcoming_events?.length
      ? `${bot.upcoming_events.length} ${bot.upcoming_events.length === 1 ? "evento" : "eventos"}`
      : null,
    bot.alojamientos?.new_count
      ? `${bot.alojamientos.new_count} aloj.`
      : null,
    bot.oportunidades?.open_count
      ? `${bot.oportunidades.open_count} abiertas`
      : null,
    bot.ranking?.product_name ?? (bot.ranking?.new_count ? "ranking" : null),
    bot.newsletter?.headline ?? (bot.newsletter?.new_count ? "newsletter" : null),
    bot.informe?.new_count ? "informe" : null,
    bot.workflow?.workflow_name ?? (bot.workflow?.new_count ? "workflow" : null),
  ].filter(Boolean);
  return bits.slice(0, 2).join(" · ") || "Sin novedades";
}

function BotResumenRow({ bot }: { bot: ResumenDetails["bots"][number] }) {
  const { open, toggle, headerRef } = useExpandable(false);
  const bodyId = useId();
  const events = bot.upcoming_events?.slice(0, 3) ?? [];
  const moreEvents = (bot.upcoming_events?.length ?? 0) - events.length;
  const kinds = bot.kinds?.slice(0, 3) ?? [];

  return (
    <section className="rounded-2xl border border-line/80">
      <ExpandableHeader
        open={open}
        onToggle={toggle}
        headerRef={headerRef}
        controlsId={bodyId}
        className="px-3 py-2.5"
      >
        <div className="flex items-center gap-2.5">
          <BotAvatar
            bot={{
              slug: bot.slug,
              name: bot.name,
              avatar_color: bot.avatar_color,
              avatar_url: bot.avatar_url,
            }}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">{bot.name}</p>
            <p className="truncate text-[11px] text-muted">{botLead(bot)}</p>
          </div>
          <ExpandChevron open={open} compact />
        </div>
      </ExpandableHeader>
      <ExpandableBody open={open} id={bodyId} className="space-y-2 px-3 pb-3">
        {bot.status ? (
          <p className="line-clamp-2 text-xs text-muted">{bot.status}</p>
        ) : null}
        {events.length ? (
          <ul className="space-y-1 text-sm">
            {events.map((event) => (
              <li key={`${event.title}-${event.event_at}`} className="flex justify-between gap-3">
                <Link
                  href={postHref(bot.slug, event.post_id)}
                  className="min-w-0 truncate font-medium hover:underline"
                >
                  {event.title}
                </Link>
                <span className="shrink-0 text-[11px] text-muted">
                  {formatEventWhen(event.event_at, event.event_end_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {moreEvents > 0 ? (
          <Link href={`/bots/${bot.slug}`} className="text-xs font-medium text-accent">
            Ver más ({moreEvents})
          </Link>
        ) : null}
        {bot.alojamientos?.best ? (
          <p className="text-sm">
            <Sparkles size={12} strokeWidth={1.75} className="mr-1 inline text-accent" />
            <Link
              href={postHref(bot.slug, bot.alojamientos.best.post_id)}
              className="font-medium hover:underline"
            >
              {bot.alojamientos.best.title}
            </Link>
            {bot.alojamientos.best.score != null
              ? ` · ${bot.alojamientos.best.score.toFixed(1)}`
              : ""}
          </p>
        ) : null}
        {bot.oportunidades ? (
          <div className="space-y-1 text-sm">
            <p>
              <Target size={12} strokeWidth={1.75} className="mr-1 inline text-accent" />
              {bot.oportunidades.open_count} abiertas
              {bot.oportunidades.recommended_count
                ? ` · ${bot.oportunidades.recommended_count} recomendadas`
                : ""}
            </p>
            {bot.oportunidades.next_deadlines?.slice(0, 3).map((item) => (
              <p key={`${item.name}-${item.deadline}`} className="flex justify-between gap-3 text-xs">
                <Link
                  href={postHref(bot.slug, item.post_id)}
                  className="min-w-0 truncate hover:underline"
                >
                  {item.name}
                </Link>
                <span className="shrink-0 text-muted">
                  {item.category ? `${oportunidadCategoryLabel(item.category)} · ` : ""}
                  {deadlineChipLabel(item.deadline)}
                </span>
              </p>
            ))}
          </div>
        ) : null}
        {bot.ranking ? (
          <p className="text-sm">
            <LineChart size={12} strokeWidth={1.75} className="mr-1 inline text-accent" />
            <Link href={postHref(bot.slug, bot.ranking.post_id)} className="font-medium hover:underline">
              {bot.ranking.product_name ?? "Ranking"}
            </Link>
            {bot.ranking.best_price != null
              ? ` · ${formatMoney(bot.ranking.best_price, bot.ranking.currency || "ARS")}`
              : ""}
            {bot.ranking.drop_pct != null ? ` · bajó ${bot.ranking.drop_pct}%` : ""}
          </p>
        ) : null}
        {bot.newsletter ? (
          <p className="text-sm">
            <Newspaper size={12} strokeWidth={1.75} className="mr-1 inline text-accent" />
            <Link
              href={postHref(bot.slug, bot.newsletter.post_id)}
              className="font-medium hover:underline"
            >
              {bot.newsletter.headline ?? "Newsletter"}
            </Link>
          </p>
        ) : null}
        {bot.informe ? (
          <p className="text-sm">
            <LineChart size={12} strokeWidth={1.75} className="mr-1 inline text-accent" />
            <Link href={postHref(bot.slug, bot.informe.post_id)} className="font-medium hover:underline">
              {bot.informe.headline ?? "Informe"}
            </Link>
            {bot.informe.brecha_pct != null ? ` · brecha ${bot.informe.brecha_pct.toFixed(1)}%` : ""}
          </p>
        ) : null}
        {bot.workflow ? (
          <p className="text-sm">
            <Workflow size={12} strokeWidth={1.75} className="mr-1 inline text-accent" />
            <Link href={postHref(bot.slug, bot.workflow.post_id)} className="font-medium hover:underline">
              {bot.workflow.workflow_name ?? "Workflow"}
            </Link>
            {bot.workflow.status ? ` · ${bot.workflow.status}` : ""}
          </p>
        ) : null}
        {kinds.length ? (
          <p className="text-xs text-muted">
            {kinds.map((item, index) => (
              <span key={item.kind}>
                {index > 0 ? " · " : null}
                <Link
                  href={`/bots/${bot.slug}?kind=${encodeURIComponent(item.kind)}`}
                  className="hover:underline"
                >
                  {kindLabel(item.kind)}
                </Link>
                {` (${item.count})`}
              </span>
            ))}
          </p>
        ) : null}
        {bot.products?.length ? (
          <p className="text-xs text-muted">
            {bot.products.slice(0, 3).map((item, index) => (
              <span key={item.name}>
                {index > 0 ? " · " : null}
                <Link
                  href={`/bots/${bot.slug}?product=${encodeURIComponent(item.name)}`}
                  className="hover:underline"
                >
                  {item.name}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
        <p>
          <Link href={`/bots/${bot.slug}`} className="text-xs font-medium text-accent">
            Ver bot
          </Link>
        </p>
      </ExpandableBody>
    </section>
  );
}

export function ResumenCard({
  post,
  details: detailsProp,
  compact = false,
  live = false,
  initialOpen,
  updatedAt,
  archiveHref,
  bot,
  allowRequest = true,
}: {
  post?: Post;
  details?: ResumenDetails | null;
  compact?: boolean;
  live?: boolean;
  initialOpen?: boolean;
  updatedAt?: string;
  archiveHref?: string;
  bot?: PostCardBot | null;
  allowRequest?: boolean;
}) {
  const bodyId = useId();
  const { open, setOpen, headerRef } = useExpandable(
    live ? (initialOpen ?? true) : !compact,
  );
  const details = detailsProp ?? (post ? asResumen(post.details) : null);
  const updated = updatedAt ?? details?.generated_at;
  const totalNew = details?.bots.reduce((sum, bot) => sum + bot.new_posts, 0) ?? 0;
  const totalEvents =
    details?.bots.reduce((sum, bot) => sum + (bot.upcoming_events?.length ?? 0), 0) ?? 0;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (live) persistResumenOpen(next);
  }

  return (
    <article
      id={post ? `post-${post.id}` : undefined}
      className="surface min-w-0 scroll-mt-20 overflow-hidden rounded-3xl"
      {...cardCollapseProps(open, toggle)}
    >
      <ExpandableHeader
        open={open}
        onToggle={toggle}
        headerRef={headerRef}
        controlsId={bodyId}
        className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_70%)] p-4 sm:p-5"
      >
        <PostCardHeader
          open={open}
          post={post}
          bot={bot}
          allowRequest={Boolean(post) && allowRequest}
          showFavorite={Boolean(post)}
          kind={post?.kind}
          titleAs="h2"
          titleClassName="mt-1 text-[1.35rem] font-semibold tracking-tight sm:text-2xl"
          title={live ? "Esta semana · últimos 7 días" : (post?.title ?? "Resumen")}
          meta={
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              {live ? "En vivo" : "Resumen semanal"}
            </p>
          }
          subtitle={
            <>
              {details ? (
                <p className="mt-1 text-sm text-muted">
                  {formatDate(`${details.period_from}T12:00:00.000Z`)} —{" "}
                  {formatDate(`${details.period_to}T12:00:00.000Z`)}
                  {updated ? (
                    <>
                      {" · Actualizado "}
                      <TimeStamp iso={updated} />
                    </>
                  ) : null}
                </p>
              ) : null}
              {live && !open && details ? (
                <p className="mt-2 truncate text-sm text-muted">
                  {totalNew} {totalNew === 1 ? "nuevo" : "nuevos"} · {totalEvents}{" "}
                  {totalEvents === 1 ? "evento" : "eventos"}
                </p>
              ) : null}
            </>
          }
        />
      </ExpandableHeader>

      <ExpandableBody open={Boolean(details) && open} id={bodyId}>
        {details ? (
        <div className="space-y-2 px-3 pb-3 pt-3.5 sm:px-4 sm:pb-4 sm:pt-5">
          {details.bots.map((bot) => (
            <BotResumenRow key={bot.bot_id} bot={bot} />
          ))}
          {post?.body_markdown?.trim() && !live ? (
            <details className="text-sm text-muted">
              <summary className="cursor-pointer font-medium text-foreground">
                Ver en markdown
              </summary>
              <div className="mt-2">
                <MarkdownBody markdown={post.body_markdown} />
              </div>
            </details>
          ) : null}
          {archiveHref ? (
            <p className="text-right text-xs">
              <Link href={archiveHref} className="font-medium text-accent">
                Ver resúmenes anteriores
              </Link>
            </p>
          ) : null}
        </div>
        ) : null}
      </ExpandableBody>
    </article>
  );
}

export function resumenFromPost(post: Post): ResumenDetails | null {
  return asResumen(post.details);
}
