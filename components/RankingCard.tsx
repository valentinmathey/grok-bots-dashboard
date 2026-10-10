"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, TrendingDown } from "lucide-react";
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
import { formatMoney } from "@/lib/format";
import {
  asRanking,
  rankingBestOffer,
  rankingDropPct,
  type RankingOffer,
} from "@/lib/rich-details";
import type { Post } from "@/lib/types";

function initials(store: string) {
  return store
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 120;
  const height = 28;
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y =
        max === min ? height / 2 : height - ((value - min) / (max - min)) * (height - 2) - 1;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-28 text-accent" aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function OfferCard({
  offer,
  currency,
  best,
}: {
  offer: RankingOffer;
  currency: string;
  best?: boolean;
}) {
  return (
    <article className={`rounded-2xl border p-3 ${best ? "border-accent/40 bg-accent/5" : "border-line"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-chip text-[11px] font-bold">
          {initials(offer.store)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{offer.store}</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatMoney(offer.price, currency)}
            </p>
          </div>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted">
            {offer.installments_text ? <span>{offer.installments_text}</span> : null}
            {offer.shipping_text ? <span>{offer.shipping_text}</span> : null}
            {offer.in_stock === false ? (
              <span className="text-danger">Sin stock</span>
            ) : offer.in_stock ? (
              <span>En stock</span>
            ) : null}
          </div>
          <a
            href={offer.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-accent"
          >
            Ir a la tienda
            <ExternalLink size={13} strokeWidth={1.75} />
          </a>
        </div>
      </div>
    </article>
  );
}

export function RankingCard({
  post,
  href,
  defaultOpen = false,
}: {
  post: Post;
  href?: string;
  defaultOpen?: boolean;
}) {
  const { open, toggle, headerRef } = useExpandable(defaultOpen);
  const bodyId = useId();
  const details = asRanking(post.details);
  const [sort, setSort] = useState<"price" | "store">("price");
  const currency = details?.currency || "ARS";
  const best = details ? rankingBestOffer(details) : null;
  const drop = details ? rankingDropPct(details) : null;
  const offers = useMemo(() => {
    const list = [...(details?.offers ?? [])];
    if (sort === "store") {
      list.sort((a, b) => a.store.localeCompare(b.store, "es"));
    } else {
      list.sort((a, b) => a.price - b.price);
    }
    return list;
  }, [details?.offers, sort]);

  if (!details) return null;

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
        className="p-4 sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {details.product_image_url ? (
              <MediaImage
                src={details.product_image_url}
                alt={details.product_name}
                className="mb-3 max-h-40"
              />
            ) : null}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[1.1rem] font-semibold leading-snug tracking-tight">
                {href ? (
                  <Link href={href} className="hover:underline">
                    {details.product_name}
                  </Link>
                ) : (
                  details.product_name
                )}
              </h3>
              <KindBadge kind="ranking" />
            </div>
            {best ? (
              <p className="mt-2 text-[1.45rem] font-semibold tabular-nums tracking-tight">
                {formatMoney(best.price, currency)}
                <span className="ml-1 text-sm font-medium text-muted">mejor precio</span>
              </p>
            ) : null}
            {drop != null ? (
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <TrendingDown size={14} strokeWidth={1.75} />
                Bajó {drop}%
              </p>
            ) : null}
            {details.price_history?.length ? (
              <div className="mt-2">
                <Sparkline values={details.price_history.map((item) => item.best_price)} />
              </div>
            ) : null}
          </div>
          <ExpandChevron open={open} />
        </div>
      </ExpandableHeader>
      <ExpandableBody open={open} id={bodyId} className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
        {details.verdict ? (
          <p className="rounded-2xl bg-raised px-3 py-2.5 text-sm leading-6">{details.verdict}</p>
        ) : null}
        <div className="flex gap-1 rounded-full bg-chip p-1">
          <button
            type="button"
            onClick={() => setSort("price")}
            className={`min-h-8 flex-1 rounded-full text-xs font-medium ${
              sort === "price" ? "bg-card shadow-sm" : "text-muted"
            }`}
          >
            Precio
          </button>
          <button
            type="button"
            onClick={() => setSort("store")}
            className={`min-h-8 flex-1 rounded-full text-xs font-medium ${
              sort === "store" ? "bg-card shadow-sm" : "text-muted"
            }`}
          >
            Tienda
          </button>
        </div>
        <div className="space-y-2 sm:hidden">
          {offers.map((offer) => (
            <OfferCard
              key={`${offer.store}-${offer.url}`}
              offer={offer}
              currency={currency}
              best={offer === best || offer.url === best?.url}
            />
          ))}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-2 font-medium">Tienda</th>
                <th className="pb-2 font-medium">Precio</th>
                <th className="pb-2 font-medium">Cuotas</th>
                <th className="pb-2 font-medium">Envío</th>
                <th className="pb-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={`${offer.store}-${offer.url}`} className="border-t border-line">
                  <td className="py-2.5 font-medium">{offer.store}</td>
                  <td className="py-2.5 tabular-nums">{formatMoney(offer.price, currency)}</td>
                  <td className="py-2.5 text-muted">{offer.installments_text ?? "—"}</td>
                  <td className="py-2.5 text-muted">{offer.shipping_text ?? "—"}</td>
                  <td className="py-2.5 text-right">
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-accent"
                    >
                      Ir a la tienda
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
