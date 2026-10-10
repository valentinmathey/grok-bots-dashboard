"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  ExternalLink,
  MapPin,
  Star,
  TrendingDown,
  Users,
} from "lucide-react";
import { AmenityChip } from "@/components/AmenityChip";
import { KindBadge } from "@/components/KindBadge";
import { MarkdownBody } from "@/components/MarkdownBody";
import { MediaImage } from "@/components/MediaImage";
import {
  asAlojamiento,
  hasPriceDrop,
  PLATFORM_LABELS,
  type AlojamientoDetails,
} from "@/lib/details";
import { formatMoney } from "@/lib/format";
import { uniquePostMedia } from "@/lib/images";
import type { Post } from "@/lib/types";

function platformCta(details: AlojamientoDetails): string {
  if (details.platform === "airbnb") return "Ver en Airbnb";
  if (details.platform === "booking") return "Ver en Booking";
  return "Ver el anuncio";
}

export function AlojamientoCard({
  post,
  href,
  defaultOpen = false,
}: {
  post: Post;
  href?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const details = asAlojamiento(post.details) ?? {};
  const media = uniquePostMedia(post);
  const cover = media[0] ?? null;
  const drop = hasPriceDrop(details);
  const currency = details.currency || "BRL";
  const location = [details.neighborhood, details.city].filter(Boolean).join(" · ");
  const maps = details.maps_url;

  return (
    <article
      id={`post-${post.id}`}
      className="surface group min-w-0 scroll-mt-20 overflow-hidden rounded-3xl transition-transform duration-200"
    >
      <div className="relative">
        {cover ? (
          <MediaImage
            src={cover.url}
            alt={cover.alt || post.title}
            className="max-h-56 sm:max-h-64"
          />
        ) : (
          <div className="h-36 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--bot-fill,var(--accent))_28%,var(--bg-card)),var(--bg-card))]" />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-wrap gap-1.5">
            {details.platform ? (
              <span className="rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                {PLATFORM_LABELS[details.platform]}
              </span>
            ) : null}
            {details.superhost ? (
              <span className="rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                Superhost
              </span>
            ) : null}
            {drop ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                <TrendingDown size={12} strokeWidth={1.75} />
                Bajó de precio
              </span>
            ) : null}
          </div>
          {details.score != null ? (
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-ink shadow-sm">
              {details.score.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[1.08rem] font-semibold leading-snug tracking-tight">
            {href ? (
              <Link href={href} className="hover:underline">
                {post.title}
              </Link>
            ) : (
              post.title
            )}
          </h3>
          <KindBadge kind={post.kind} />
        </div>

        {location || maps ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-muted">
            <MapPin size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" />
            <span className="min-w-0">
              {location || details.address || details.search_area || "Ubicación"}
              {maps ? (
                <>
                  {" · "}
                  <a
                    href={maps}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-accent underline-offset-2 hover:underline"
                  >
                    Mapa
                  </a>
                </>
              ) : null}
            </span>
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            {details.price_per_person != null ? (
              <p className="text-[1.65rem] font-semibold leading-none tracking-tight">
                {formatMoney(details.price_per_person, currency)}
                <span className="ml-1 text-sm font-medium text-muted">/ persona</span>
              </p>
            ) : null}
            {details.price_total != null ? (
              <p className="mt-1.5 text-sm text-muted">
                Total {formatMoney(details.price_total, currency)}
                {details.nights ? ` · ${details.nights} noches` : ""}
                {details.guests ? ` · ${details.guests} huéspedes` : ""}
              </p>
            ) : details.price_as_shown ? (
              <p className="mt-1.5 text-sm text-muted">{details.price_as_shown}</p>
            ) : null}
          </div>
          {details.rating != null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-chip px-2.5 py-1 text-sm font-semibold">
              <Star size={14} strokeWidth={1.75} className="text-amber-500" />
              {details.rating.toFixed(2)}
              {details.reviews_count != null ? (
                <span className="font-normal text-muted">({details.reviews_count})</span>
              ) : null}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground/80">
          {details.bedrooms != null ? (
            <span className="inline-flex items-center gap-1.5">
              <DoorOpen size={15} strokeWidth={1.75} />
              {details.bedrooms} hab.
            </span>
          ) : null}
          {details.beds != null ? (
            <span className="inline-flex items-center gap-1.5">
              <BedDouble size={15} strokeWidth={1.75} />
              {details.beds} camas
            </span>
          ) : null}
          {details.bathrooms != null ? (
            <span className="inline-flex items-center gap-1.5">
              <Bath size={15} strokeWidth={1.75} />
              {details.bathrooms} baños
            </span>
          ) : null}
          {details.capacity != null ? (
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} strokeWidth={1.75} />
              hasta {details.capacity}
            </span>
          ) : null}
        </div>

        {details.amenities?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {details.amenities.slice(0, open ? 24 : 6).map((amenity) => (
              <AmenityChip key={amenity} value={amenity} />
            ))}
          </div>
        ) : null}

        {open ? (
          <div className="mt-4 space-y-4 border-t border-line pt-4">
            {media.length > 1 ? (
              <div className="grid grid-cols-2 gap-2">
                {media.slice(1).map((image) => (
                  <MediaImage
                    key={image.url}
                    src={image.url}
                    alt={image.alt || post.title}
                    className="max-h-40"
                  />
                ))}
              </div>
            ) : null}

            {details.is_combination && details.units?.length ? (
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Combinación
                </h4>
                <ul className="mt-2 space-y-2">
                  {details.units.map((unit) => (
                    <li
                      key={unit.name}
                      className="flex items-start justify-between gap-3 rounded-2xl bg-raised px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{unit.name}</p>
                        {unit.capacity ? (
                          <p className="text-xs text-muted">Hasta {unit.capacity} personas</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        {unit.price != null ? (
                          <p className="font-semibold tabular-nums">
                            {formatMoney(unit.price, currency)}
                          </p>
                        ) : null}
                        {unit.url ? (
                          <a
                            href={unit.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-accent"
                          >
                            Ver
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {(details.pros?.length || details.cons?.length) ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {details.pros?.length ? (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                      A favor
                    </h4>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm">
                      {details.pros.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {details.cons?.length ? (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-rose-700 dark:text-rose-300">
                      En contra
                    </h4>
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm">
                      {details.cons.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {post.body_markdown?.trim() ? <MarkdownBody markdown={post.body_markdown} /> : null}

            {details.listing_url ? (
              <a
                href={details.listing_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-accent-ink"
              >
                {platformCta(details)}
                <ExternalLink size={15} strokeWidth={1.75} />
              </a>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent"
        >
          {open ? <ChevronUp size={16} strokeWidth={1.75} /> : <ChevronDown size={16} strokeWidth={1.75} />}
          {open ? "Ver menos" : "Ver detalle"}
        </button>
      </div>
    </article>
  );
}
