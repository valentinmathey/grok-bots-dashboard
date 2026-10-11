"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  useExpandable,
} from "@/components/ExpandableCard";
import { CardCover, CardHeaderPad } from "@/components/CollapsedCover";
import { MarkdownBody } from "@/components/MarkdownBody";
import { PostCardHeader, type PostCardBot } from "@/components/PostCardHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { collapsedCover } from "@/lib/images";
import { asInforme, type InformeDetails } from "@/lib/rich-details";
import type { Post } from "@/lib/types";

const DOLAR_KEYS = new Set([
  "dolar_oficial",
  "dolar_blue",
  "dolar_mep",
  "dolar_ccl",
  "dolar_cripto",
]);

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

function formatIndicatorValue(value: number, unit?: string) {
  if (unit === "ARS" || unit === "USD") return formatMoney(value, unit);
  const digits = Math.abs(value) >= 100 ? 0 : 2;
  const number = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : digits,
  }).format(value);
  if (!unit) return number;
  if (unit === "%") return `${number}%`;
  return `${number} ${unit}`;
}

function IndicatorTile({
  item,
}: {
  item: InformeDetails["indicators"][number];
}) {
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
          ? `${item.change_pct > 0 ? "+" : ""}${item.change_pct.toFixed(1)}%`
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

  const dollars = details.indicators.filter((item) => DOLAR_KEYS.has(item.key));
  const others = details.indicators.filter((item) => !DOLAR_KEYS.has(item.key));
  const headline = details.summary_simple?.slice(0, 140) || post.title;

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
        {dollars.length ? (
          <section className="rounded-2xl bg-raised p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">Dólar</h4>
              {details.brecha_pct != null ? (
                <span className="text-xs font-medium text-muted">
                  Brecha {details.brecha_pct.toFixed(1)}%
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {dollars.map((item) => (
                <article key={item.key} className="rounded-2xl border border-line bg-card p-2.5">
                  <p className="text-[11px] text-muted">{item.label || item.key}</p>
                  <p className="text-base font-semibold tabular-nums">
                    {formatIndicatorValue(item.value, item.unit ?? "ARS")}
                  </p>
                  {item.buy != null || item.sell != null ? (
                    <p className="text-[11px] text-muted">
                      {item.buy != null ? `C ${formatMoney(item.buy, item.unit ?? "ARS")}` : ""}
                      {item.buy != null && item.sell != null ? " · " : ""}
                      {item.sell != null ? `V ${formatMoney(item.sell, item.unit ?? "ARS")}` : ""}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {others.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {others.map((item) => (
              <IndicatorTile key={item.key} item={item} />
            ))}
          </div>
        ) : null}
        {details.summary_simple || details.summary_technical ? (
          <div>
            <div className="mb-2 flex gap-1 rounded-full bg-chip p-1">
              <button
                type="button"
                onClick={() => setTab("simple")}
                className={`min-h-8 flex-1 rounded-full text-xs font-medium ${
                  tab === "simple" ? "bg-card shadow-sm" : "text-muted"
                }`}
              >
                En simple
              </button>
              <button
                type="button"
                onClick={() => setTab("tecnico")}
                className={`min-h-8 flex-1 rounded-full text-xs font-medium ${
                  tab === "tecnico" ? "bg-card shadow-sm" : "text-muted"
                }`}
              >
                Técnico
              </button>
            </div>
            {tab === "simple" ? (
              <p className="text-sm leading-6">{details.summary_simple || "Sin resumen simple."}</p>
            ) : details.summary_technical ? (
              <MarkdownBody markdown={details.summary_technical} />
            ) : (
              <p className="text-sm text-muted">Sin parte técnica.</p>
            )}
          </div>
        ) : null}
        {details.highlights?.length ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Highlights</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-6">
              {details.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {details.risks?.length ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Riesgos</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-6">
              {details.risks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {details.outlook ? (
          <p className="rounded-2xl bg-raised px-3 py-2.5 text-sm leading-6">{details.outlook}</p>
        ) : null}
        {details.sources?.length ? (
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {details.sources.map((source) =>
              source.url ? (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-accent"
                >
                  {source.name}
                  <ExternalLink size={11} strokeWidth={1.75} />
                </a>
              ) : (
                <span key={source.name}>{source.name}</span>
              ),
            )}
          </p>
        ) : null}
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
