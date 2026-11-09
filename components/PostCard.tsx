"use client";

import { useId } from "react";
import Link from "next/link";
import { CalendarDays, Hash, MapPin, Package, Ticket, Users } from "lucide-react";
import { AlojamientoCard } from "@/components/AlojamientoCard";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  useExpandable,
} from "@/components/ExpandableCard";
import { ImportanceBadge } from "@/components/ImportanceBadge";
import { InformeCard } from "@/components/InformeCard";
import { MarkdownBody } from "@/components/MarkdownBody";
import { MediaImage } from "@/components/MediaImage";
import { NewsletterCard } from "@/components/NewsletterCard";
import { OportunidadesCard } from "@/components/OportunidadesCard";
import { CardCover, CardHeaderPad } from "@/components/CollapsedCover";
import { PostCardHeader, type PostCardBot } from "@/components/PostCardHeader";
import { RankingCard } from "@/components/RankingCard";
import { ResumenCard } from "@/components/ResumenCard";
import { WorkflowCard } from "@/components/WorkflowCard";
import { isEventPast, isEventToday } from "@/lib/event-time";
import { filtersToSearchParams, type FeedQuery } from "@/lib/filters";
import { hasEventFacts, parseEventFacts } from "@/lib/event-facts";
import { formatDateTime, formatEventWhen, previewPlain } from "@/lib/format";
import { collapsedCover, uniquePostMedia } from "@/lib/images";
import {
  asInforme,
  asNewsletter,
  asRanking,
  asWorkflow,
  looksLikeRanking,
} from "@/lib/rich-details";
import type { Post, PostKind } from "@/lib/types";

export type PostCardChrome = {
  bot?: PostCardBot | null;
  allowRequest?: boolean;
};

export function PostCard({
  post,
  filterBasePath,
  href,
  defaultOpen = false,
  query,
  bot,
  allowRequest = true,
}: {
  post: Post;
  filterBasePath: string;
  href?: string;
  defaultOpen?: boolean;
  query?: FeedQuery;
  bot?: PostCardBot | null;
  allowRequest?: boolean;
}) {
  const chrome: PostCardChrome = { bot, allowRequest };
  if (post.kind === "alojamiento") {
    return <AlojamientoCard post={post} href={href} defaultOpen={defaultOpen} {...chrome} />;
  }
  if (post.kind === "resumen") {
    return <ResumenCard post={post} {...chrome} />;
  }
  if (post.kind === "oportunidades") {
    return (
      <OportunidadesCard
        post={post}
        href={href}
        defaultOpen={defaultOpen}
        query={query}
        {...chrome}
      />
    );
  }
  if (
    (post.kind === "ranking" || (post.kind === "report" && looksLikeRanking(post.details))) &&
    asRanking(post.details)
  ) {
    return <RankingCard post={post} href={href} defaultOpen={defaultOpen} {...chrome} />;
  }
  if (post.kind === "newsletter" && asNewsletter(post.details)) {
    return <NewsletterCard post={post} href={href} defaultOpen={defaultOpen} {...chrome} />;
  }
  if (post.kind === "informe" && asInforme(post.details)) {
    return <InformeCard post={post} href={href} defaultOpen={defaultOpen} {...chrome} />;
  }
  if (post.kind === "workflow" && asWorkflow(post.details)) {
    return <WorkflowCard post={post} href={href} defaultOpen={defaultOpen} {...chrome} />;
  }
  return (
    <StandardPostCard
      post={post}
      filterBasePath={filterBasePath}
      href={href}
      defaultOpen={defaultOpen}
      {...chrome}
    />
  );
}

function StandardPostCard({
  post,
  filterBasePath,
  href,
  defaultOpen = false,
  bot,
  allowRequest = true,
}: {
  post: Post;
  filterBasePath: string;
  href?: string;
  defaultOpen?: boolean;
  bot?: PostCardBot | null;
  allowRequest?: boolean;
}) {
  const { open, toggle, headerRef } = useExpandable(defaultOpen);
  const bodyId = useId();
  const media = uniquePostMedia(post);
  const cover = collapsedCover(post);
  const extraMedia = media.filter((image) => image.url !== cover?.url);
  const eventIso = post.event_at ?? null;
  const eventFacts = eventIso
    ? parseEventFacts(
        post.body_markdown,
        post.details && typeof post.details === "object"
          ? (post.details as Record<string, unknown>)
          : null,
      )
    : {};
  const preview =
    eventIso && hasEventFacts(eventFacts) ? "" : previewPlain(post.body_markdown);
  const today = eventIso ? isEventToday(post) : false;
  const past = eventIso ? isEventPast(post) : false;

  function filterHref(next: { kind?: PostKind; product?: string; tag?: string }) {
    const query = filtersToSearchParams(next).toString();
    return query ? `${filterBasePath}?${query}` : filterBasePath;
  }

  return (
    <article
      id={`post-${post.id}`}
      className="surface min-w-0 scroll-mt-20 overflow-hidden rounded-3xl"
      {...cardCollapseProps(open, toggle)}
    >
      <CardCover src={cover?.url} alt={cover?.alt ?? post.title} />
      <ExpandableHeader
        open={open}
        onToggle={toggle}
        headerRef={headerRef}
        controlsId={bodyId}
      >
        <CardHeaderPad>
        <PostCardHeader
          open={open}
          post={post}
          bot={bot}
          allowRequest={allowRequest}
          kind={post.kind}
          title={
            href ? (
              <Link href={href} className="hover:underline">
                {post.title}
              </Link>
            ) : (
              post.title
            )
          }
          meta={
            eventIso ? (
              <>
                {today ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
                    Hoy
                  </span>
                ) : null}
                {past ? (
                  <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-muted">
                    Pasado
                  </span>
                ) : null}
                <ImportanceBadge details={post.details as Record<string, unknown>} />
                <time
                  dateTime={eventIso}
                  title={formatEventWhen(eventIso, post.event_end_at)}
                  className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums"
                >
                  <CalendarDays size={14} strokeWidth={1.75} />
                  {formatEventWhen(eventIso, post.event_end_at)}
                </time>
              </>
            ) : (
              <time
                dateTime={post.created_at}
                title={formatDateTime(post.created_at)}
                className="inline-flex items-center gap-1 text-xs text-muted"
              >
                <CalendarDays size={12} strokeWidth={1.75} />
                {formatDateTime(post.created_at)}
              </time>
            )
          }
          subtitle={
            !open && preview ? (
              <p className="mt-3 text-sm leading-6 text-muted">{preview}</p>
            ) : null
          }
          extra={
            <>
              {!open && hasEventFacts(eventFacts) ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {eventFacts.place ? (
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">
                      <MapPin size={11} strokeWidth={1.75} className="shrink-0" />
                      <span className="truncate">{eventFacts.place}</span>
                    </span>
                  ) : null}
                  {eventFacts.price ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">
                      <Ticket size={11} strokeWidth={1.75} />
                      {eventFacts.price}
                    </span>
                  ) : null}
                  {eventFacts.modality ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">
                      <Users size={11} strokeWidth={1.75} />
                      {eventFacts.modality}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {post.product ? (
                  <Link
                    href={filterHref({ product: post.product })}
                    className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-foreground/80 hover:bg-accent/15"
                  >
                    <Package size={11} strokeWidth={1.75} />
                    {post.product}
                  </Link>
                ) : null}
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={filterHref({ tag })}
                    className="inline-flex items-center gap-0.5 text-[11px] text-muted hover:text-foreground"
                  >
                    <Hash size={10} strokeWidth={1.75} />
                    {tag}
                  </Link>
                ))}
              </div>
            </>
          }
        />
        </CardHeaderPad>
      </ExpandableHeader>
      <ExpandableBody open={open} id={bodyId} className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
        {extraMedia.length > 0 ? (
          <div className={`grid gap-2 ${extraMedia.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {extraMedia.map((image) => (
              <MediaImage
                key={image.url}
                src={image.url}
                alt={image.alt || post.title}
                className="max-h-64"
              />
            ))}
          </div>
        ) : null}
        <MarkdownBody markdown={post.body_markdown} />
        {eventIso ? (
          <p className="text-xs text-muted">
            Publicado <time dateTime={post.created_at}>{formatDateTime(post.created_at)}</time>
          </p>
        ) : null}
      </ExpandableBody>
    </article>
  );
}
