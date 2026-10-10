"use client";

import { useId } from "react";
import Link from "next/link";
import { CalendarDays, Hash, Package } from "lucide-react";
import { AlojamientoCard } from "@/components/AlojamientoCard";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  ExpandChevron,
  useExpandable,
} from "@/components/ExpandableCard";
import { KindBadge } from "@/components/KindBadge";
import { MarkdownBody } from "@/components/MarkdownBody";
import { MediaImage } from "@/components/MediaImage";
import { OportunidadesCard } from "@/components/OportunidadesCard";
import { ResumenCard } from "@/components/ResumenCard";
import { isEventPast, isEventToday } from "@/lib/event-time";
import { filtersToSearchParams, type FeedQuery } from "@/lib/filters";
import { formatDateTime, formatEventWhen, previewPlain } from "@/lib/format";
import { uniquePostMedia } from "@/lib/images";
import type { Post, PostKind } from "@/lib/types";

export function PostCard({
  post,
  filterBasePath,
  href,
  defaultOpen = false,
  query,
}: {
  post: Post;
  filterBasePath: string;
  href?: string;
  defaultOpen?: boolean;
  query?: FeedQuery;
}) {
  if (post.kind === "alojamiento") {
    return <AlojamientoCard post={post} href={href} defaultOpen={defaultOpen} />;
  }
  if (post.kind === "resumen") {
    return <ResumenCard post={post} />;
  }
  if (post.kind === "oportunidades") {
    return (
      <OportunidadesCard
        post={post}
        href={href}
        defaultOpen={defaultOpen}
        query={query}
      />
    );
  }
  return (
    <StandardPostCard
      post={post}
      filterBasePath={filterBasePath}
      href={href}
      defaultOpen={defaultOpen}
    />
  );
}

function StandardPostCard({
  post,
  filterBasePath,
  href,
  defaultOpen = false,
}: {
  post: Post;
  filterBasePath: string;
  href?: string;
  defaultOpen?: boolean;
}) {
  const { open, toggle, headerRef } = useExpandable(defaultOpen);
  const bodyId = useId();
  const preview = previewPlain(post.body_markdown);
  const media = uniquePostMedia(post);
  const cover = media[0] ?? null;
  const eventIso = post.event_at ?? null;
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
      {cover && !open ? (
        <MediaImage src={cover.url} alt={cover.alt || post.title} className="max-h-52" />
      ) : null}
      <ExpandableHeader
        open={open}
        onToggle={toggle}
        headerRef={headerRef}
        controlsId={bodyId}
        className="p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
              <h3 className="min-w-0 text-[1.05rem] font-semibold leading-snug tracking-tight break-words">
                {href ? (
                  <Link href={href} className="hover:underline">
                    {post.title}
                  </Link>
                ) : (
                  post.title
                )}
              </h3>
              {eventIso ? (
                <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
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
                  <time
                    dateTime={eventIso}
                    title={formatEventWhen(eventIso, post.event_end_at)}
                    className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums"
                  >
                    <CalendarDays size={14} strokeWidth={1.75} />
                    {formatEventWhen(eventIso, post.event_end_at)}
                  </time>
                </div>
              ) : (
                <time
                  dateTime={post.created_at}
                  title={formatDateTime(post.created_at)}
                  className="inline-flex items-center gap-1 text-xs text-muted sm:shrink-0 sm:pt-0.5"
                >
                  <CalendarDays size={12} strokeWidth={1.75} />
                  {formatDateTime(post.created_at)}
                </time>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Link href={filterHref({ kind: post.kind })} className="hover:opacity-80">
                <KindBadge kind={post.kind} />
              </Link>
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
            {!open ? (
              <p className="mt-3 text-sm leading-6 text-muted">{preview}</p>
            ) : null}
          </div>
          <ExpandChevron open={open} />
        </div>
      </ExpandableHeader>
      <ExpandableBody open={open} id={bodyId} className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
        {media.length > 0 ? (
          <div className={`grid gap-2 ${media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
            {media.map((image) => (
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
