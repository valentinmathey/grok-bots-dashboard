"use client";

import { useEffect, useMemo, useState } from "react";
import { hashPostId, scrollToPostSettled } from "@/lib/scroll-to-post";
import {
  Building2,
  ChevronDown,
  ExternalLink,
  LayoutList,
  MapPin,
  SlidersHorizontal,
  Tag,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import { FilterChip } from "@/components/FilterChip";
import { SegmentedControl } from "@/components/FilterChip";
import { Sheet, SheetFooter } from "@/components/Sheet";
import { baCalendarDate } from "@/lib/event-time";
import { formatDate, formatTime } from "@/lib/format";
import {
  AUDIENCES,
  AUDIENCE_LABELS,
  EMPTY_MZA_FILTERS,
  GRAN_MENDOZA,
  MZA_ZONES,
  TICKET_LABELS,
  VALLE_SAN_RAFAEL,
  ZONE_LABELS,
  bucketMzaPosts,
  countMzaFilters,
  countdownLabel,
  dayHeading,
  matchesMzaFilters,
  mzaCategoryKey,
  mzaCategoryLabels,
  mzaEmoji,
  promoExpiryLabel,
  type MzaFilters,
  type MzaKind,
  type MzaZone,
} from "@/lib/mendoza";
import type { Post } from "@/lib/types";

type D = Record<string, unknown>;
const str = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

const PRICE_STEPS = [5000, 10000, 20000, 40000];

function formatArs(n: number) {
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

function priceLabel(d: D) {
  if (typeof d.price_from === "number")
    return d.price_from === 0 ? "Gratis" : `Desde ${formatArs(d.price_from)}`;
  return str(d.price_text);
}

type Money = { label?: string; price?: number; currency?: string };
type Presale = Money & { until?: string; status?: string; remaining?: number };

function money(price: number | undefined, currency?: string) {
  if (typeof price !== "number") return null;
  if (price === 0) return "Gratis";
  return currency === "USD"
    ? `US$${Math.round(price).toLocaleString("es-AR")}`
    : formatArs(price);
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v)
    ? (v.filter(
        (x) => x && (typeof x === "object" || typeof x === "string"),
      ) as T[])
    : [];
}

function timeOf(v: string) {
  if (/^\d{1,2}:\d{2}$/.test(v)) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : formatTime(d);
}

function untilLabel(v?: string) {
  if (!v) return null;
  const d = new Date(/T/.test(v) ? v : `${v}T12:00:00-03:00`);
  return Number.isNaN(d.getTime())
    ? null
    : `hasta ${formatDate(d)}${/T/.test(v) ? ` ${formatTime(d)}` : ""}`;
}

const PRESALE_LABELS: Record<string, string> = {
  vigente: "Vigente",
  agotada: "Agotada",
  proxima: "Próxima",
};

function presaleChip(p: Presale) {
  return [
    `Preventa ${p.label ?? ""}`.trim(),
    money(p.price, p.currency),
    typeof p.remaining === "number"
      ? `quedan ${p.remaining}`
      : untilLabel(p.until),
  ]
    .filter(Boolean)
    .join(" · ");
}

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function AgendaViva({
  kind,
  posts,
  nowIso,
  baselineIso: _baselineIso,
}: {
  kind: MzaKind;
  posts: Post[];
  nowIso: string;
  baselineIso: string | null;
}) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const today = baCalendarDate(now);
  const [tab, setTab] = useState<"proximos" | "pasados">("proximos");
  const [view, setView] = useState<"dia" | "categoria">("dia");
  const [filters, setFilters] = useState<MzaFilters>(EMPTY_MZA_FILTERS);
  const [draft, setDraft] = useState<MzaFilters>(EMPTY_MZA_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const visible = posts.filter((post) =>
    matchesMzaFilters(post, kind, filters),
  );
  const buckets = bucketMzaPosts(visible, now);
  const active = countMzaFilters(filters);
  const catKey = mzaCategoryKey(kind);
  const catLabels = mzaCategoryLabels(kind);
  const venues = useMemo(
    () =>
      [
        ...new Set(
          posts
            .map((p) => str((p.details as D)?.venue))
            .filter(Boolean) as string[],
        ),
      ].sort(),
    [posts],
  );

  const upcomingAll = [
    ...buckets.days.flatMap((g) => g.posts),
    ...buckets.undated,
  ];
  const byCategory = new Map<string, Post[]>();
  for (const post of upcomingAll) {
    const key = String((post.details as D)?.[catKey] ?? "otro");
    byCategory.set(key, [...(byCategory.get(key) ?? []), post]);
  }

  // Deep link (#post-<id>): elegir la pestaña donde está, sacar filtros que lo
  // oculten, abrir la card y centrarla (re-centrando mientras se asienta el layout).
  const [target, setTarget] = useState<string | null>(null);
  const [scrollTick, setScrollTick] = useState(0);
  useEffect(() => {
    function applyHash() {
      const id = hashPostId(window.location.hash);
      setTarget(id);
      if (!id) return;
      const post = posts.find((p) => p.id === id);
      if (!post) {
        // No es de esta agenda (otro kind): lo buscamos en el feed clásico.
        const url = new URL(window.location.href);
        if (url.searchParams.get("vista") !== "feed") {
          url.searchParams.set("vista", "feed");
          window.location.replace(url.toString());
        }
        return;
      }
      if (!matchesMzaFilters(post, kind, filters)) {
        setFilters(EMPTY_MZA_FILTERS);
        setDraft(EMPTY_MZA_FILTERS);
      }
      const isPast = bucketMzaPosts([post], now).past.length > 0;
      setTab(isPast ? "pasados" : "proximos");
      setScrollTick((n) => n + 1);
    }
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
    // Solo al montar y en hashchange; posts/filtros se leen en ese momento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!target || !scrollTick) return;
    let cancel: (() => void) | null = null;
    const frame = requestAnimationFrame(() => {
      cancel = scrollToPostSettled(target);
    });
    return () => {
      cancelAnimationFrame(frame);
      cancel?.();
    };
  }, [target, scrollTick]);

  const card = (post: Post) => (
    <MzaCard
      key={post.id}
      post={post}
      kind={kind}
      today={today}
      defaultOpen={post.id === target}
    />
  );

  return (
    <div className="space-y-4">
      <SegmentedControl
        value={tab}
        ariaLabel="Próximos o pasados"
        options={[
          {
            id: "proximos",
            label: "Próximos",
            onClick: () => setTab("proximos"),
          },
          {
            id: "pasados",
            label: `Pasados (${buckets.past.length})`,
            onClick: () => setTab("pasados"),
          },
        ]}
      />

      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setDraft(filters);
            setSheetOpen(true);
          }}
          className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-medium"
        >
          <SlidersHorizontal size={16} strokeWidth={1.75} />
          Filtros
          {active ? (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-ink">
              {active}
            </span>
          ) : null}
        </button>
        {tab === "proximos" ? (
          <label className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-full border border-line bg-card px-3 text-sm font-medium">
            <LayoutList size={14} strokeWidth={1.75} />
            <span className="sr-only">Agrupar</span>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as "dia" | "categoria")}
              className="min-w-0 flex-1 bg-transparent font-medium"
            >
              <option value="dia">Por día</option>
              <option value="categoria">Por categoría</option>
            </select>
          </label>
        ) : null}
      </div>

      {tab === "pasados" ? (
        <Group title="Pasados" empty="Todavía no hay pasados.">
          {buckets.past.map(card)}
        </Group>
      ) : (
        <>
          {buckets.changes.length ? (
            <section className="rounded-3xl border border-amber-500/40 bg-amber-500/5 p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-400">
                Cambios
              </h2>
              <div className="space-y-2">{buckets.changes.map(card)}</div>
            </section>
          ) : null}

          {kind === "gastro" && buckets.promos.length ? (
            <Group title="Promos vigentes">{buckets.promos.map(card)}</Group>
          ) : null}

          {view === "categoria" ? (
            [...byCategory.entries()].map(([cat, list]) => (
              <Group
                key={cat}
                title={`${mzaEmoji(kind, { [catKey]: cat })} ${catLabels[cat] ?? cat}`}
              >
                {list.map(card)}
              </Group>
            ))
          ) : (
            <>
              {buckets.days.map((group) => (
                <Group key={group.day} title={dayHeading(group.day, today)}>
                  {group.posts.map(card)}
                </Group>
              ))}
              {buckets.undated.length ? (
                <Group title="Sin fecha">{buckets.undated.map(card)}</Group>
              ) : null}
            </>
          )}

          {!buckets.days.length &&
          !buckets.undated.length &&
          !buckets.promos.length &&
          !buckets.changes.length ? (
            <p className="surface rounded-3xl px-4 py-8 text-center text-sm text-muted">
              {active
                ? "No hay nada con estos filtros."
                : "No hay nada próximo por ahora."}
            </p>
          ) : null}
        </>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtros"
      >
        <div className="space-y-5 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Filtrar
          </p>
          <FilterSection
            title="Zona"
            icon={<MapPin size={13} strokeWidth={1.75} />}
          >
            <FilterChip
              size="sm"
              selected={GRAN_MENDOZA.every((z) => draft.zones.includes(z))}
              check={GRAN_MENDOZA.every((z) => draft.zones.includes(z))}
              onClick={() => {
                const all = GRAN_MENDOZA.every((z) => draft.zones.includes(z));
                setDraft({
                  ...draft,
                  zones: all
                    ? draft.zones.filter(
                        (z) => !GRAN_MENDOZA.includes(z as MzaZone),
                      )
                    : [...new Set([...draft.zones, ...GRAN_MENDOZA])],
                });
              }}
            >
              Gran Mendoza
            </FilterChip>
            {[...GRAN_MENDOZA, ...VALLE_SAN_RAFAEL].map((zone) => (
              <FilterChip
                key={zone}
                size="sm"
                selected={draft.zones.includes(zone)}
                onClick={() =>
                  setDraft({ ...draft, zones: toggle(draft.zones, zone) })
                }
              >
                {ZONE_LABELS[zone]}
              </FilterChip>
            ))}
            <FilterChip
              size="sm"
              selected={draft.zones.includes("fuera-de-zona")}
              className={
                draft.zones.includes("fuera-de-zona")
                  ? ""
                  : "!bg-chip text-muted"
              }
              onClick={() =>
                setDraft({
                  ...draft,
                  zones: toggle(draft.zones, "fuera-de-zona"),
                })
              }
            >
              {ZONE_LABELS["fuera-de-zona"]}
            </FilterChip>
          </FilterSection>

          <FilterSection
            title="Público"
            icon={<Users size={13} strokeWidth={1.75} />}
          >
            {AUDIENCES.map((a) => (
              <FilterChip
                size="sm"
                key={a}
                selected={draft.audience.includes(a)}
                check={draft.audience.includes(a)}
                onClick={() =>
                  setDraft({ ...draft, audience: toggle(draft.audience, a) })
                }
              >
                {AUDIENCE_LABELS[a]}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection
            title="Precio"
            icon={<Wallet size={13} strokeWidth={1.75} />}
          >
            <FilterChip
              size="sm"
              selected={draft.free}
              check={draft.free}
              onClick={() =>
                setDraft({ ...draft, free: !draft.free, maxPrice: null })
              }
            >
              Gratis
            </FilterChip>
            {PRICE_STEPS.map((max) => (
              <FilterChip
                size="sm"
                key={max}
                selected={draft.maxPrice === max}
                onClick={() =>
                  setDraft({
                    ...draft,
                    free: false,
                    maxPrice: draft.maxPrice === max ? null : max,
                  })
                }
              >
                Hasta {formatArs(max)}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection
            title={
              kind === "evento-mza"
                ? "Categoría"
                : kind === "gastro"
                  ? "Tipo"
                  : "Género"
            }
            icon={<Tag size={13} strokeWidth={1.75} />}
          >
            {Object.entries(catLabels).map(([id, label]) => (
              <FilterChip
                key={id}
                size="sm"
                selected={draft.categories.includes(id)}
                onClick={() =>
                  setDraft({
                    ...draft,
                    categories: toggle(draft.categories, id),
                  })
                }
              >
                {mzaEmoji(kind, { [catKey]: id })} {label}
              </FilterChip>
            ))}
          </FilterSection>

          <FilterSection
            title="Lugar"
            icon={<Building2 size={13} strokeWidth={1.75} />}
          >
            <input
              list="mza-venues"
              value={draft.venue}
              onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
              placeholder={
                kind === "recital"
                  ? "Buscá un estadio, teatro o bar…"
                  : "Buscá un lugar…"
              }
              className="min-h-11 w-full rounded-2xl border border-line bg-raised px-3 text-base sm:text-sm"
            />
            <datalist id="mza-venues">
              {venues.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </FilterSection>
        </div>
        <SheetFooter>
          <button
            type="button"
            onClick={() => setDraft(EMPTY_MZA_FILTERS)}
            className="min-h-11 flex-1 rounded-full border border-line px-4 text-sm font-medium"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => {
              setFilters(draft);
              setSheetOpen(false);
            }}
            className="min-h-11 flex-1 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
          >
            Aplicar
          </button>
        </SheetFooter>
      </Sheet>
    </div>
  );
}

function FilterSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-line pt-4 first-of-type:border-0 first-of-type:pt-0">
      <h3 className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {icon}
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function Group({
  title,
  empty,
  children,
}: {
  title: string;
  empty?: string;
  children: React.ReactNode;
}) {
  const list = Array.isArray(children) ? children : [children];
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </h2>
      {list.length ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <p className="text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}

function MzaCard({
  post,
  kind,
  today,
  defaultOpen = false,
}: {
  post: Post;
  kind: MzaKind;
  today: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [wasTarget, setWasTarget] = useState(defaultOpen);
  if (defaultOpen !== wasTarget) {
    setWasTarget(defaultOpen);
    if (defaultOpen) setOpen(true);
  }
  const d = (post.details ?? {}) as D;
  const status = String(d.status ?? "activo");
  const cancelled = status === "cancelado";
  const day = post.event_at ? baCalendarDate(post.event_at) : null;
  const countdown = day ? countdownLabel(day, today) : null;
  const promoTo = str(d.promo_to);
  const expiry = promoTo ? promoExpiryLabel(promoTo, today) : null;
  const zone = str(d.zone) as MzaZone | undefined;
  const place = [
    str(d.venue),
    zone && (MZA_ZONES as readonly string[]).includes(zone)
      ? ZONE_LABELS[zone]
      : str(d.city),
  ]
    .filter(Boolean)
    .join(" · ");
  const price = priceLabel(d);
  const audience = Array.isArray(d.audience) ? (d.audience as string[]) : [];
  const ticket = kind === "recital" ? str(d.ticket_status) : undefined;
  const ticketUrl = str(d.ticket_url);
  const prices = arr<Money>(d.prices);
  const presales = arr<Presale>(d.presales);
  const activePresale = presales.find((p) => p.status === "vigente");
  const promos = arr<string>(d.promos).filter((x) => typeof x === "string");
  const combos = arr<Money>(d.combos);
  const lineup = arr<string>(d.lineup).filter((x) => typeof x === "string");
  const ageMin = typeof d.age_min === "number" ? d.age_min : undefined;
  const openBar = d.open_bar === true;
  const earlyBird =
    d.early_bird && typeof d.early_bird === "object"
      ? (d.early_bird as Presale)
      : undefined;
  const soldOut = ticket === "agotado" || status === "agotado";
  const image = str(d.image_url) ?? post.cover_image_url ?? undefined;
  const time = post.event_at ? formatTime(post.event_at) : null;
  const timeLabel = time && time !== "00:00" ? time : null;

  return (
    <article id={`post-${post.id}`} className="surface scroll-mt-20 rounded-2xl p-3">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
        }}
        className="flex w-full items-start gap-3 text-left"
        aria-expanded={open}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className={`h-14 w-14 shrink-0 object-cover ${kind === "evento-mza" ? "rounded-xl" : "rounded-full"}`}
            loading="lazy"
          />
        ) : (
          <span
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-chip text-2xl"
            aria-hidden
          >
            {mzaEmoji(kind, d)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-1.5">
            {countdown && !cancelled ? (
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {countdown}
              </span>
            ) : null}
            {status === "cambiado" ? (
              <span className="rounded-full bg-amber-400/25 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                Cambiado
              </span>
            ) : null}
            {cancelled ? (
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
                Cancelado
              </span>
            ) : null}
            {ticket ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${soldOut ? "bg-red-500/15 text-red-700 dark:text-red-400" : "bg-chip text-muted"}`}
              >
                <Ticket size={11} className="mr-1 inline -translate-y-px" />
                {soldOut ? "Agotado" : (TICKET_LABELS[ticket] ?? ticket)}
              </span>
            ) : null}
            {expiry ? (
              <span className="rounded-full bg-chip px-2 py-0.5 text-xs font-medium text-muted">
                {expiry}
              </span>
            ) : null}
            {activePresale && !cancelled ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {presaleChip(activePresale)}
              </span>
            ) : null}
            {earlyBird && earlyBird.status !== "agotada" && !cancelled ? (
              <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-400">
                {[
                  earlyBird.status === "proxima"
                    ? "Early bird (próx.)"
                    : "Early bird",
                  money(earlyBird.price, earlyBird.currency),
                  untilLabel(earlyBird.until),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            ) : null}
            {openBar ? (
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
                🍹 Barra libre
              </span>
            ) : null}
            {ageMin ? (
              <span className="rounded-full bg-chip px-2 py-0.5 text-xs font-medium text-muted">
                +{ageMin}
              </span>
            ) : null}
          </span>
          <span
            className={`mt-1 block text-sm font-semibold leading-5 ${cancelled ? "line-through opacity-70" : ""}`}
          >
            <span aria-hidden className="mr-1">
              {mzaEmoji(kind, d)}
            </span>
            {post.title}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {[
              day
                ? `${dayHeading(day, today)}${timeLabel ? ` · ${timeLabel}` : ""}`
                : null,
              place || null,
              price || null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
          {kind === "evento-mza" && lineup.length ? (
            <span className="mt-0.5 block truncate text-xs font-medium">
              🎧 {lineup.join(" · ")}
            </span>
          ) : null}
          {str(d.change_note) && (status === "cambiado" || cancelled) ? (
            <span className="mt-1 block text-xs font-medium text-amber-800 dark:text-amber-300">
              {str(d.change_note)}
            </span>
          ) : null}
        </span>
        <ChevronDown
          size={16}
          className={`mt-1 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
          {audience.length ? (
            <p className="flex flex-wrap gap-1.5">
              {audience.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-chip px-2 py-0.5 text-xs"
                >
                  {AUDIENCE_LABELS[a as keyof typeof AUDIENCE_LABELS] ?? a}
                </span>
              ))}
            </p>
          ) : null}
          {kind === "recital" &&
          Array.isArray(d.support) &&
          d.support.length ? (
            <p className="text-xs text-muted">
              Teloneros: {(d.support as string[]).join(", ")}
            </p>
          ) : null}
          {lineup.length ? (
            <p className="text-xs text-muted">Lineup: {lineup.join(", ")}</p>
          ) : null}
          {str(d.doors_at) || str(d.dress_code) || ageMin ? (
            <p className="text-xs text-muted">
              {[
                str(d.doors_at)
                  ? `Puertas: ${timeOf(str(d.doors_at) as string)}`
                  : null,
                ageMin ? `Edad mínima: ${ageMin}` : null,
                str(d.dress_code) ? `Dress code: ${str(d.dress_code)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          {prices.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Entradas
              </p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {prices.map((p, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{p.label}</span>
                    <span className="font-medium tabular-nums">
                      {money(p.price, p.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {earlyBird ? (
            <p className="text-sm">
              🐦 Early bird
              {money(earlyBird.price, earlyBird.currency)
                ? `: ${money(earlyBird.price, earlyBird.currency)}`
                : ""}{" "}
              <span className="text-xs text-muted">
                {[
                  PRESALE_LABELS[earlyBird.status ?? ""] ?? earlyBird.status,
                  untilLabel(earlyBird.until),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </p>
          ) : null}
          {presales.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Preventas
              </p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {presales.map((p, i) => (
                  <li
                    key={i}
                    className={`flex justify-between gap-3 ${p.status === "agotada" ? "text-muted line-through" : ""}`}
                  >
                    <span>
                      {p.label}{" "}
                      <span className="text-xs text-muted">
                        {[
                          PRESALE_LABELS[p.status ?? ""] ?? p.status,
                          typeof p.remaining === "number"
                            ? `quedan ${p.remaining}`
                            : null,
                          untilLabel(p.until),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="font-medium tabular-nums">
                      {money(p.price, p.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {openBar || str(d.open_bar_text) ? (
            <p className="text-sm">
              🍹 Barra libre
              {str(d.open_bar_text) ? `: ${str(d.open_bar_text)}` : ""}
            </p>
          ) : null}
          {combos.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Combos
              </p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {combos.map((c, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span>{c.label}</span>
                    <span className="font-medium tabular-nums">
                      {money(c.price, c.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {promos.length ? (
            <p className="flex flex-wrap gap-1.5">
              {promos.map((x, i) => (
                <span
                  key={i}
                  className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent"
                >
                  🎁 {x}
                </span>
              ))}
            </p>
          ) : null}
          {str(d.ticketera) ? (
            <p className="text-xs text-muted">Ticketera: {str(d.ticketera)}</p>
          ) : null}
          {kind === "gastro" ? (
            <p className="text-xs text-muted">
              {[
                str(d.cuisine),
                str(d.price_range),
                str(d.hours),
                str(d.promo_days),
              ]
                .filter(Boolean)
                .join(" · ")}
              {promoTo
                ? ` · Hasta ${formatDate(`${promoTo}T12:00:00-03:00`)}`
                : ""}
            </p>
          ) : null}
          {str(d.address) ? (
            <p className="flex items-center gap-1 text-xs text-muted">
              <MapPin size={12} /> {str(d.address)}
            </p>
          ) : null}
          {str(d.note) ? (
            <p className="text-sm leading-6">{str(d.note)}</p>
          ) : null}
          {post.body_markdown ? (
            <p className="line-clamp-6 whitespace-pre-line text-sm leading-6 text-muted">
              {post.body_markdown.replace(/[*_#>`]/g, "").trim()}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            {kind !== "gastro" && ticketUrl && !soldOut && !cancelled ? (
              <a
                href={ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
              >
                <Ticket size={16} /> Comprar entradas
              </a>
            ) : null}
            {str(d.source_url) ? (
              <a
                href={str(d.source_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium"
              >
                <ExternalLink size={14} /> Ver fuente
              </a>
            ) : null}
            {kind === "gastro" && str(d.instagram) ? (
              <a
                href={`https://instagram.com/${(str(d.instagram) as string).replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-medium"
              >
                {str(d.instagram)?.startsWith("@")
                  ? str(d.instagram)
                  : `@${str(d.instagram)}`}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
