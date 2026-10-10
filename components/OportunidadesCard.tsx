"use client";

import { useId, useMemo } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Briefcase,
  Bug,
  Building2,
  CalendarClock,
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
  ExpandChevron,
  useExpandable,
} from "@/components/ExpandableCard";
import { FavoriteStar } from "@/components/FavoriteStar";
import { KindBadge } from "@/components/KindBadge";
import { MarkdownBody } from "@/components/MarkdownBody";
import {
  asOportunidades,
  deadlineChipLabel,
  deadlineTone,
  filterOportunidadItems,
  OPORTUNIDAD_CATEGORIES,
  OPORTUNIDAD_EFFORT_LABELS,
  OPORTUNIDAD_MODALITY_LABELS,
  oportunidadCategoryLabel,
  sortOportunidadItems,
  type OportunidadCategory,
  type OportunidadItem,
  type OportunidadesDetails,
} from "@/lib/details";
import type { FeedQuery } from "@/lib/filters";
import { formatDateTime } from "@/lib/format";
import type { Post } from "@/lib/types";

const CATEGORY_ICONS: Record<
  OportunidadCategory,
  typeof Sparkles
> = {
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
    tone === "closed"
      ? "bg-chip text-muted"
      : tone === "urgent"
        ? "bg-red-500/15 text-red-800 dark:text-red-200"
        : tone === "soon"
          ? "bg-amber-500/18 text-amber-900 dark:text-amber-200"
          : "bg-chip text-foreground/80";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      <CalendarClock size={11} strokeWidth={1.75} />
      {label}
    </span>
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
  const modality = item.modality
    ? OPORTUNIDAD_MODALITY_LABELS[item.modality]
    : null;
  const place = [modality, item.location].filter(Boolean).join(" · ");
  const effort = item.effort
    ? item.effort_text?.trim() || OPORTUNIDAD_EFFORT_LABELS[item.effort]
    : item.effort_text?.trim() || null;

  return (
    <article
      className={`min-w-0 rounded-2xl border p-3.5 sm:p-4 ${
        highlight
          ? "border-accent/40 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_14%,transparent),transparent_72%)]"
          : "border-line/80 bg-raised/60"
      } ${closed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-chip text-accent">
          <Icon size={16} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h4 className="min-w-0 text-[0.98rem] font-semibold leading-snug tracking-tight">
              {item.name}
            </h4>
            <FavoriteStar
              postId={postId}
              itemKey={`opp:${item.url}`}
              label={item.name}
              url={item.url}
            />
            {item.prize_text ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                <Award size={11} strokeWidth={1.75} />
                {item.prize_text}
              </span>
            ) : null}
          </div>
          {item.organization ? (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
              <Building2 size={12} strokeWidth={1.75} />
              {item.organization}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <DeadlineChip deadline={item.deadline} />
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
          {item.how_to ? (
            <p className="mt-2 text-sm leading-5 text-muted">{item.how_to}</p>
          ) : null}
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink sm:w-auto"
          >
            Ver oportunidad
            <ExternalLink size={14} strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </article>
  );
}

export function OportunidadesCard({
  post,
  href,
  defaultOpen = false,
  query,
}: {
  post: Post;
  href?: string;
  defaultOpen?: boolean;
  query?: FeedQuery;
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
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {details.period_label ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                {details.period_label}
              </p>
            ) : (
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
                Lote
              </p>
            )}
            <h3 className="mt-1 text-[1.15rem] font-semibold leading-snug tracking-tight sm:text-[1.25rem]">
              {href ? (
                <Link href={href} className="hover:underline">
                  {post.title}
                </Link>
              ) : (
                post.title
              )}
            </h3>
            <p className="mt-1.5 text-sm text-muted">
              {visible.length} {visible.length === 1 ? "oportunidad" : "oportunidades"}
              {recommendedCount ? ` · ${recommendedCount} recomendadas` : ""}
              {` · ${openCount} abiertas`}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-1">
            <KindBadge kind={post.kind} />
            <ExpandChevron open={open} />
          </div>
        </div>
        {!open && recommended.length > 0 ? (
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
        ) : null}
      </ExpandableHeader>

      <ExpandableBody open={open} id={bodyId} className="space-y-5 px-4 pb-4 sm:px-5 sm:pb-5">
          {recommended.length > 0 && !query?.recommended ? (
            <section>
              <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold tracking-tight">
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
                    <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold tracking-tight">
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
