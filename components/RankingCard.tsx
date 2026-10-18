"use client";

import { foldStore, storeGroupName } from "@/lib/store-group";
import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ExternalLink, PackageCheck, TrendingDown } from "lucide-react";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  useExpandable,
} from "@/components/ExpandableCard";
import { CardCover, CardHeaderPad } from "@/components/CollapsedCover";
import { SegmentedControl } from "@/components/FilterChip";
import { MarkdownBody } from "@/components/MarkdownBody";
import { PostCardHeader, type PostCardBot } from "@/components/PostCardHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { collapsedCover } from "@/lib/images";
import {
  asRanking,
  installmentsLabel,
  rankingLowest,
  rankingBestCardOffer,
  rankingBestOffer,
  rankingDropPct,
  type RankingOffer,
} from "@/lib/rich-details";
import type { Post } from "@/lib/types";

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

function StoreButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 text-xs font-semibold"
    >
      <ExternalLink size={13} strokeWidth={1.75} />
      Ir a la tienda
    </a>
  );
}

function offerVariant(offer: RankingOffer, group: string): string | null {
  const rest = offer.store.trim();
  return foldStore(rest) === foldStore(group) ? null : rest;
}

function OfferBadges({
  best,
  cardBest,
}: {
  best?: boolean;
  cardBest?: boolean;
}) {
  if (!best && !cardBest) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {best ? (
        <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
          Mejor precio
        </span>
      ) : null}
      {cardBest ? (
        <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-semibold">
          Mejor con tarjeta
        </span>
      ) : null}
    </div>
  );
}

function OfferCard({
  offer,
  label,
  currency,
  best,
  cardBest,
}: {
  offer: RankingOffer;
  label?: string | null;
  currency: string;
  best?: boolean;
  cardBest?: boolean;
}) {
  const title = label === undefined ? offer.store : label;
  return (
    <article
      className={`rounded-2xl border p-3 ${
        best ? "border-accent/40 border-l-[3px] border-l-accent bg-accent/5" : "border-line"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className={`min-w-0 truncate ${label === undefined ? "font-semibold" : "text-sm font-medium"}`}>
          {title ?? <span className="text-muted">Oferta</span>}
        </p>
        <p className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">
          {formatMoney(offer.price, currency)}
          <span className="ml-1 text-[11px] font-medium text-muted">contado</span>
        </p>
      </div>
      <OfferBadges best={best} cardBest={cardBest} />
      {installmentsLabel(offer, currency, formatMoney) ? (
        <p
          className={`mt-1.5 text-xs ${offer.installments?.interest_free ? "font-semibold text-emerald-700 dark:text-emerald-300" : "text-muted"}`}
        >
          💳 {installmentsLabel(offer, currency, formatMoney)}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {offer.shipping_text ? (
          <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">
            {offer.shipping_text}
          </span>
        ) : null}
        {offer.in_stock === false ? (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:text-red-200">
            Sin stock
          </span>
        ) : offer.in_stock ? (
          <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">En stock</span>
        ) : null}
      </div>
      <div className="mt-3">
        <StoreButton href={offer.url} />
      </div>
    </article>
  );
}

function OfferRow({
  offer,
  label,
  currency,
  best,
  cardBest,
}: {
  offer: RankingOffer;
  label: string | null;
  currency: string;
  best: boolean;
  cardBest: boolean;
}) {
  return (
    <tr className={`border-t border-line ${best ? "border-l-[3px] border-l-accent bg-accent/5" : ""}`}>
      <td className="py-2.5 pl-3 pr-2 align-top">
        <p className="text-sm">{label ?? <span className="text-muted">Oferta</span>}</p>
        <OfferBadges best={best} cardBest={cardBest} />
      </td>
      <td className="whitespace-nowrap py-2.5 pr-2 align-top font-semibold tabular-nums">
        {formatMoney(offer.price, currency)}
      </td>
      <td
        className={`py-2.5 pr-2 align-top ${offer.installments?.interest_free ? "font-medium text-emerald-700 dark:text-emerald-300" : "text-muted"}`}
      >
        {installmentsLabel(offer, currency, formatMoney) ?? "—"}
      </td>
      <td className="py-2.5 pr-2 align-top text-muted">
        {offer.shipping_text ?? "—"}
        {offer.in_stock === false ? <span className="ml-1 text-red-700 dark:text-red-300">· Sin stock</span> : null}
      </td>
      <td className="py-2.5 align-top">
        <StoreButton href={offer.url} />
      </td>
    </tr>
  );
}

export function RankingCard({
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
  const details = asRanking(post.details);
  const [sort, setSort] = useState<"price" | "store">("price");
  const currency = details?.currency || "ARS";
  const best = details ? rankingBestOffer(details) : null;
  const cardBest = details ? rankingBestCardOffer(details) : null;
  const drop = details ? rankingDropPct(details) : null;
  const lowest = details ? rankingLowest(details) : null;
  const cover = details ? collapsedCover(post, details.product_image_url) : null;
  const offers = useMemo(() => {
    const list = [...(details?.offers ?? [])];
    if (sort === "store") {
      list.sort((a, b) => a.store.localeCompare(b.store, "es"));
    } else {
      list.sort((a, b) => a.price - b.price);
    }
    return list;
  }, [details?.offers, sort]);
  const groups = useMemo(() => {
    if (sort !== "store") return [];
    const map = new Map<string, RankingOffer[]>();
    for (const offer of details?.offers ?? []) {
      const name = storeGroupName(offer.store);
      map.set(name, [...(map.get(name) ?? []), offer]);
    }
    return [...map.entries()]
      .map(([name, list]) => ({ name, offers: [...list].sort((a, b) => a.price - b.price) }))
      .sort((a, b) => a.offers[0].price - b.offers[0].price || a.name.localeCompare(b.name, "es"));
  }, [details?.offers, sort]);

  if (!details) return null;

  function isBest(offer: RankingOffer) {
    return Boolean(best && offer.url === best.url && offer.price === best.price);
  }
  function isCardBest(offer: RankingOffer) {
    return Boolean(cardBest && offer.url === cardBest.url);
  }

  return (
    <article
      id={`post-${post.id}`}
      className="surface min-w-0 scroll-mt-20 overflow-hidden rounded-3xl"
      {...cardCollapseProps(open, toggle)}
    >
      <CardCover src={cover?.url} alt={details.product_name} fit="contain" />
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
            kind="ranking"
            title={
              href ? (
                <Link href={href} className="hover:underline">
                  {details.product_name}
                </Link>
              ) : (
                details.product_name
              )
            }
            titleClassName="text-[1.1rem] font-semibold leading-snug tracking-tight"
            subtitle={
              <>
                {best ? (
                  <p className="mt-2 text-[1.25rem] font-semibold tabular-nums tracking-tight sm:text-[1.45rem]">
                    <span className="whitespace-nowrap">{formatMoney(best.price, currency)}</span>
                    <span className="ml-1 text-sm font-medium text-muted">
                      mejor precio{best.store ? ` · ${best.store}` : ""}
                    </span>
                  </p>
                ) : null}
                {drop != null || details.back_in_stock ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {drop != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <TrendingDown size={12} strokeWidth={1.75} />
                        Bajó {drop}%
                      </span>
                    ) : null}
                    {details.back_in_stock ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300">
                        <PackageCheck size={12} strokeWidth={1.75} />
                        Volvió el stock
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {lowest && best ? (
                  <p className="mt-1 text-xs text-muted">
                    {best.price <= lowest.price ? "Precio más bajo visto" : `Mínimo histórico ${formatMoney(lowest.price, currency)}`}
                    {best.price > lowest.price && lowest.store ? ` en ${lowest.store}` : ""}
                    {best.price > lowest.price && lowest.date ? ` (${formatDate(lowest.date)})` : ""}
                    {details.checked_at ? ` · actualizado ${formatDate(details.checked_at)}` : ""}
                  </p>
                ) : null}
                {details.price_history?.length ? (
                  <div className="mt-2">
                    <Sparkline values={details.price_history.map((item) => item.best_price)} />
                  </div>
                ) : null}
              </>
            }
          />
        </CardHeaderPad>
      </ExpandableHeader>
      <ExpandableBody open={open} id={bodyId} className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
        {details.verdict ? (
          <p className="rounded-2xl bg-raised px-3 py-2.5 text-sm leading-6">{details.verdict}</p>
        ) : null}
        <div className="flex flex-col gap-2 min-[700px]:flex-row min-[700px]:items-center min-[700px]:justify-end">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <ArrowUpDown size={13} strokeWidth={1.75} />
            Ordenar por
          </p>
          <SegmentedControl
            ariaLabel="Ordenar por"
            className="min-[700px]:w-auto min-[700px]:min-w-[240px]"
            value={sort}
            options={[
              { id: "price", label: "Precio", onClick: () => setSort("price") },
              { id: "store", label: "Tienda", onClick: () => setSort("store") },
            ]}
          />
        </div>
        {sort === "store" ? (
          <div className="space-y-3 min-[700px]:hidden">
            {groups.map((group) => (
              <section key={group.name} className="overflow-hidden rounded-2xl border border-line">
                <header className="flex items-baseline justify-between gap-3 bg-raised px-3 py-2">
                  <p className="min-w-0 truncate font-semibold">{group.name}</p>
                  <p className="shrink-0 text-xs text-muted">
                    {group.offers.length > 1
                      ? `${group.offers.length} ofertas · desde ${formatMoney(group.offers[0].price, currency)}`
                      : "1 oferta"}
                  </p>
                </header>
                <div className="space-y-2 p-2">
                  {group.offers.map((offer) => (
                    <OfferCard
                      key={`${offer.store}-${offer.url}`}
                      offer={offer}
                      label={offerVariant(offer, group.name)}
                      currency={currency}
                      best={isBest(offer)}
                      cardBest={isCardBest(offer)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
        <div className={`space-y-2 min-[700px]:hidden ${sort === "store" ? "hidden" : ""}`}>
          {offers.map((offer) => (
            <OfferCard
              key={`${offer.store}-${offer.url}`}
              offer={offer}
              currency={currency}
              best={isBest(offer)}
              cardBest={isCardBest(offer)}
            />
          ))}
        </div>
        <div className="hidden overflow-x-auto min-[700px]:block">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[18%]" />
            </colgroup>
            <thead className="text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="pb-2 font-medium">Tienda</th>
                <th className="pb-2 font-medium">Contado</th>
                <th className="pb-2 font-medium">Cuotas</th>
                <th className="pb-2 font-medium">Envío</th>
                <th className="pb-2 font-medium">
                  <span className="sr-only">Acción</span>
                </th>
              </tr>
            </thead>
            {sort === "store"
              ? groups.map((group) => (
                  <tbody key={group.name}>
                    <tr className="border-t border-line bg-raised">
                      <td colSpan={5} className="px-2 py-2">
                        <span className="font-semibold">{group.name}</span>
                        <span className="ml-2 text-xs text-muted">
                          {group.offers.length > 1
                            ? `${group.offers.length} ofertas · desde ${formatMoney(group.offers[0].price, currency)}`
                            : "1 oferta"}
                        </span>
                      </td>
                    </tr>
                    {group.offers.map((offer) => (
                      <OfferRow
                        key={`${offer.store}-${offer.url}`}
                        offer={offer}
                        label={offerVariant(offer, group.name)}
                        currency={currency}
                        best={isBest(offer)}
                        cardBest={isCardBest(offer)}
                      />
                    ))}
                  </tbody>
                ))
              : null}
            <tbody className={sort === "store" ? "hidden" : ""}>
              {offers.map((offer) => {
                const bestRow = isBest(offer);
                const cardRow = isCardBest(offer);
                return (
                  <tr
                    key={`${offer.store}-${offer.url}`}
                    className={`border-t border-line ${
                      bestRow ? "border-l-[3px] border-l-accent bg-accent/5" : ""
                    }`}
                  >
                    <td className="py-2.5 pr-2 align-top">
                      <p className="font-medium">{offer.store}</p>
                      <OfferBadges best={bestRow} cardBest={cardRow} />
                    </td>
                    <td className="whitespace-nowrap py-2.5 pr-2 align-top font-semibold tabular-nums">
                      {formatMoney(offer.price, currency)}
                    </td>
                    <td
                      className={`py-2.5 pr-2 align-top ${offer.installments?.interest_free ? "font-medium text-emerald-700 dark:text-emerald-300" : "text-muted"}`}
                    >
                      {installmentsLabel(offer, currency, formatMoney) ?? "—"}
                    </td>
                    <td className="py-2.5 pr-2 align-top text-muted">
                      {offer.shipping_text ?? "—"}
                    </td>
                    <td className="py-2.5 align-top">
                      <StoreButton href={offer.url} />
                    </td>
                  </tr>
                );
              })}
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
