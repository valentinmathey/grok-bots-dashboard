"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Briefcase,
  Bug,
  CalendarClock,
  CalendarPlus,
  CreditCard,
  ExternalLink,
  GraduationCap,
  Landmark,
  Laptop,
  MapPin,
  Sparkles,
  Star,
  Tag,
  Trophy,
  Zap,
} from "lucide-react";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  useExpandable,
} from "@/components/ExpandableCard";
import { FavoriteStar } from "@/components/FavoriteStar";
import { PostCardHeader, type PostCardBot } from "@/components/PostCardHeader";
import { MarkdownBody } from "@/components/MarkdownBody";
import {
  asOportunidades,
  deadlineChipLabel,
  deadlineTone,
  effortChipLabel,
  filterOportunidadItems,
  OPORTUNIDAD_CATEGORIES,
  OPORTUNIDAD_MODALITY_LABELS,
  opportunityCalendarUrl,
  opportunitySourceHost,
  oportunidadCategoryLabel,
  sortOportunidadItems,
  splitPrizePills,
  type OportunidadCategory,
  type OportunidadItem,
  type OportunidadesDetails,
} from "@/lib/details";
import type { FeedQuery } from "@/lib/filters";
import { formatDateTime } from "@/lib/format";
import type { Post } from "@/lib/types";

const CATEGORY_ICONS: Record<OportunidadCategory, typeof Sparkles> = {
  hackaton: Laptop,
  bounty: Bug,
  beca: GraduationCap,
  curso: BookOpen,
  grant: Landmark,
  creditos: CreditCard,
  concurso: Trophy,
  empleo: Briefcase,
  freelance: Laptop,
  oferta: Tag,
  otro: Sparkles,
};

function DeadlineChip({ deadline }: { deadline?: string }) {
  const tone = deadlineTone(deadline);
  const label = deadlineChipLabel(deadline);
  const cls =
    tone === "closed" || tone === "none"
      ? "bg-chip text-muted"
      : tone === "urgent"
        ? "bg-red-500/15 text-red-800 dark:text-red-200"
        : tone === "soon"
          ? "bg-amber-500/18 text-amber-900 dark:text-amber-200"
          : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      <CalendarClock size={11} strokeWidth={1.75} />
      {label}
    </span>
  );
}

function HowTo({ text }: { text: string }) {
  const [more, setMore] = useState(false);
  const long = text.length > 140;

  return (
    <div className="mt-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Qué harías</p>
      <p className={`mt-1 text-sm leading-5 text-muted ${more || !long ? "" : "line-clamp-3"}`}>
        {text}
      </p>
      {long ? (
        <button
          type="button"
          data-no-collapse
          onClick={(event) => {
            event.stopPropagation();
            setMore((value) => !value);
          }}
          className="mt-0.5 text-xs font-medium text-accent"
        >
          {more ? "ver menos" : "ver más"}
        </button>
      ) : null}
    </div>
  );
}

function OpportunityItemCard({
  item,
  highlight = false,
  postId,
}: {
  item: OportunidadItem;
  highlight?: boolean;
  postId: string;
}) {
  const closed = deadlineTone(item.deadline) === "closed";
  const Icon = CATEGORY_ICONS[item.category];
  const modality = item.modality ? OPORTUNIDAD_MODALITY_LABELS[item.modality] : null;
  const place = [modality, item.location].filter(Boolean).join(" · ");
  const effort = effortChipLabel(item);
  const source = opportunitySourceHost(item.url);
  const orgLine = [item.organization, source].filter(Boolean).join(" · ");
  const prizes = splitPrizePills(item.prize_text);
  const calendarUrl = opportunityCalendarUrl(item);

  return (
    <article
      className={`min-w-0 rounded-2xl border p-3.5 sm:p-4 ${
        highlight
          ? "border-accent/40 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_72%)]"
          : "border-line/80 bg-raised/60"
      } ${closed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-chip text-accent">
          <Icon size={16} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-[0.98rem] font-semibold leading-snug tracking-tight">
            {item.name}
          </h4>
          {orgLine ? <p className="mt-0.5 truncate text-sm text-muted">{orgLine}</p> : null}
        </div>
        <div className="flex shrink-0 items-start" data-no-collapse>
          <FavoriteStar
            postId={postId}
            itemKey={`opp:${item.url}`}
            label={item.name}
            url={item.url}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {prizes.map((prize) => (
            <span
              key={prize.label}
              title={prize.label}
              className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent"
            >
              <Award size={11} strokeWidth={1.75} className="shrink-0" />
              <span className="truncate">{prize.label}</span>
            </span>
          ))}
          <DeadlineChip deadline={item.deadline} />
        </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {place ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-foreground/80">
            <MapPin size={11} strokeWidth={1.75} />
            {place}
          </span>
        ) : null}
        {effort ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-foreground/80">
            <Zap size={11} strokeWidth={1.75} />
            {effort}
          </span>
        ) : null}
        {item.recommended && !highlight ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
            <Star size={11} strokeWidth={1.75} />
            Recomendada
          </span>
        ) : null}
      </div>

      {item.how_to ? <HowTo text={item.how_to} /> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink sm:flex-none"
        >
          Ver oportunidad
          <ExternalLink size={14} strokeWidth={1.75} />
        </a>
        {calendarUrl ? (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium"
          >
            <CalendarPlus size={14} strokeWidth={1.75} />
            Agregar a calendario
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function OportunidadesCard({
  post,
  href,
  defaultOpen = false,
  query,
  bot,
  allowRequest = true,
}: {
  post: Post;
  href?: string;
  defaultOpen?: boolean;
  query?: FeedQuery;
  bot?: PostCardBot | null;
  allowRequest?: boolean;
}) {
  const { open, toggle, headerRef } = useExpandable(defaultOpen);
  const bodyId = useId();
  const details: OportunidadesDetails = asOportunidades(post.details) ?? {
    items: [],
  };
  const visible = useMemo(() => {
    const filtered = filterOportunidadItems(details.items, {
      category: query?.category,
      recommended: query?.recommended,
      openOnly: query?.openOnly,
    });
    return sortOportunidadItems(filtered, query?.sort);
  }, [details.items, query?.category, query?.openOnly, query?.recommended, query?.sort]);

  const recommended = visible.filter((item) => item.recommended);
  const byCategory = OPORTUNIDAD_CATEGORIES.map((category) => ({
    category,
    items: visible.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  const openCount = details.items.filter(
    (item) => deadlineTone(item.deadline) !== "closed",
  ).length;
  const recommendedCount = details.items.filter((item) => item.recommended).length;

  return (
    <article
      id={`post-${post.id}`}
      className="surface min-w-0 scroll-mt-20 overflow-hidden rounded-3xl"
      {...cardCollapseProps(open, toggle)}
    >
      <ExpandableHeader
        open={open}
        onToggle={toggle}
        headerRef={headerRef}
        controlsId={bodyId}
        className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_70%)] p-4 sm:p-5"
      >
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
          titleClassName="mt-1 text-[1.15rem] font-semibold leading-snug tracking-tight sm:text-[1.25rem]"
          meta={
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              {details.period_label || "Lote"}
            </p>
          }
          subtitle={
            <p className="mt-1.5 text-sm text-muted">
              {visible.length} {visible.length === 1 ? "oportunidad" : "oportunidades"}
              {recommendedCount ? ` · ${recommendedCount} recomendadas` : ""}
              {` · ${openCount} abiertas`}
            </p>
          }
          extra={
            !open && recommended.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {recommended.slice(0, 3).map((item) => (
                  <span
                    key={`${item.name}-${item.url}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-full bg-card/80 px-2.5 py-1 text-[11px] font-medium"
                  >
                    <Star size={11} strokeWidth={1.75} className="shrink-0 text-accent" />
                    <span className="truncate">{item.name}</span>
                  </span>
                ))}
              </div>
            ) : null
          }
        />
      </ExpandableHeader>

      <ExpandableBody
        open={open}
        id={bodyId}
        className="space-y-6 px-4 pb-4 pt-5 sm:space-y-6 sm:px-5 sm:pb-5 sm:pt-6"
      >
        {recommended.length > 0 && !query?.recommended ? (
          <section>
            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold tracking-tight">
              <Star size={14} strokeWidth={1.75} className="text-accent" />
              Recomendadas
              <span className="text-xs font-medium text-muted">{recommended.length}</span>
            </h4>
            <div className="space-y-2.5">
              {recommended.map((item) => (
                <OpportunityItemCard
                  key={`${item.name}-${item.url}`}
                  item={item}
                  highlight
                  postId={post.id}
                />
              ))}
            </div>
          </section>
        ) : null}

        {query?.recommended
          ? recommended.length > 0 && (
              <div className="space-y-2.5">
                {recommended.map((item) => (
                  <OpportunityItemCard
                    key={`${item.name}-${item.url}`}
                    item={item}
                    highlight
                    postId={post.id}
                  />
                ))}
              </div>
            )
          : byCategory.map((group) => {
              const Icon = CATEGORY_ICONS[group.category];
              return (
                <section key={group.category}>
                  <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                    <Icon size={14} strokeWidth={1.75} className="text-accent" />
                    {oportunidadCategoryLabel(group.category)}
                    <span className="text-xs font-medium text-muted">{group.items.length}</span>
                  </h4>
                  <div className="space-y-2.5">
                    {group.items.map((item) => (
                      <OpportunityItemCard
                        key={`${item.name}-${item.url}`}
                        item={item}
                        postId={post.id}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

        {visible.length === 0 ? (
          <p className="text-sm text-muted">Nada con esos filtros en este lote.</p>
        ) : null}

        {post.body_markdown.trim() ? (
          <details className="text-sm text-muted">
            <summary className="cursor-pointer font-medium text-foreground">
              Ver en markdown
            </summary>
            <div className="mt-2">
              <MarkdownBody markdown={post.body_markdown} />
            </div>
          </details>
        ) : null}
        <p className="text-xs text-muted">
          Publicado <time dateTime={post.created_at}>{formatDateTime(post.created_at)}</time>
        </p>
      </ExpandableBody>
    </article>
  );
}
