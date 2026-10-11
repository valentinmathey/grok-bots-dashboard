"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  useExpandable,
} from "@/components/ExpandableCard";
import { CardCover, CardHeaderPad } from "@/components/CollapsedCover";
import { SegmentedControl } from "@/components/FilterChip";
import {
  DolarBlock,
  ExtraInformeSections,
  InformeDisclaimer,
  SharedLists,
  SimpleView,
  SourcesCollapse,
  TechnicalView,
  formatIndicatorValue,
} from "@/components/InformeSections";
import { MarkdownBody } from "@/components/MarkdownBody";
import { PostCardHeader, type PostCardBot } from "@/components/PostCardHeader";
import { formatDate } from "@/lib/format";
import { collapsedCover } from "@/lib/images";
import { hasInformeToggle, informeHeadline, splitInformeIndicators } from "@/lib/informe";
import { asInforme, type InformeDetails } from "@/lib/rich-details";
import type { Post } from "@/lib/types";

function directionIcon(direction?: "up" | "down" | "flat") {
  if (direction === "down") return ArrowDownRight;
  if (direction === "flat") return ArrowRight;
  return ArrowUpRight;
}

function directionClass(direction?: "up" | "down" | "flat") {
  if (direction === "down") return "text-emerald-700 dark:text-emerald-300";
  if (direction === "up") return "text-red-700 dark:text-red-300";
  return "text-muted";
}

function formatPct(value: number) {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function IndicatorTile({ item }: { item: InformeDetails["indicators"][number] }) {
  const Icon = directionIcon(item.direction);
  return (
    <article className="rounded-2xl border border-line p-3">
      <p className="text-[11px] font-medium text-muted">{item.label || item.key}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
        {formatIndicatorValue(item.value, item.unit)}
      </p>
      <p className={`mt-0.5 inline-flex items-center gap-0.5 text-xs font-medium ${directionClass(item.direction)}`}>
        <Icon size={12} strokeWidth={1.75} />
        {item.change_pct != null
          ? `${item.change_pct > 0 ? "+" : ""}${formatPct(item.change_pct)}%`
          : item.change_abs != null
            ? `${item.change_abs > 0 ? "+" : ""}${item.change_abs}`
            : "sin cambio"}
      </p>
    </article>
  );
}

export function InformeCard({
  post,
  href,
  defaultOpen = false,
  bot,
  allowRequest = true,
}: {
  post: Post;
  href?: string;
  defaultOpen?: boolean;
  bot?: PostCardBot | null;
  allowRequest?: boolean;
}) {
  const { open, toggle, headerRef } = useExpandable(defaultOpen);
  const bodyId = useId();
  const details = asInforme(post.details);
  const [tab, setTab] = useState<"simple" | "tecnico">("simple");
  if (!details) return null;

  const { dollars, others } = splitInformeIndicators(details);
  const headline = informeHeadline(details, post.title);
  const showToggle = hasInformeToggle(details);

  return (
    <article
      id={`post-${post.id}`}
      className="surface min-w-0 scroll-mt-20 overflow-hidden rounded-3xl"
      {...cardCollapseProps(open, toggle)}
    >
      <CardCover src={collapsedCover(post)?.url} alt={post.title} />
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
            kind="informe"
            title={
              href ? (
                <Link href={href} className="hover:underline">
                  {post.title}
                </Link>
              ) : (
                post.title
              )
            }
            titleClassName="text-[1.1rem] font-semibold leading-snug tracking-tight"
            meta={
              <p className="text-xs text-muted">
                {details.date ? formatDate(`${details.date}T12:00:00-03:00`) : null}
                {details.brecha_pct != null
                  ? `${details.date ? " · " : ""}Brecha ${details.brecha_pct.toFixed(1)}%`
                  : ""}
              </p>
            }
            subtitle={!open ? <p className="mt-2 text-sm leading-6 text-muted">{headline}</p> : null}
          />
        </CardHeaderPad>
      </ExpandableHeader>
      <ExpandableBody open={open} id={bodyId} className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
        <DolarBlock dollars={dollars} brechaPct={details.brecha_pct} />
        {others.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {others.map((item) => (
              <IndicatorTile key={item.key} item={item} />
            ))}
          </div>
        ) : null}
        {showToggle ? (
          <div className="space-y-3">
            <SegmentedControl
              ariaLabel="Vista del informe"
              value={tab}
              options={[
                { id: "simple", label: "En simple", onClick: () => setTab("simple") },
                { id: "tecnico", label: "Técnico", onClick: () => setTab("tecnico") },
              ]}
            />
            {tab === "simple" ? <SimpleView details={details} /> : <TechnicalView details={details} />}
          </div>
        ) : null}
        <SharedLists details={details} />
        <ExtraInformeSections details={details} />
        <InformeDisclaimer details={details} />
        <SourcesCollapse details={details} />
        {post.body_markdown.trim() ? (
          <details className="text-sm text-muted">
            <summary className="cursor-pointer font-medium text-foreground">Ver en markdown</summary>
            <div className="mt-2">
              <MarkdownBody markdown={post.body_markdown} />
            </div>
          </details>
        ) : null}
      </ExpandableBody>
    </article>
  );
}
