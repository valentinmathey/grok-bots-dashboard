"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Clock,
  ExternalLink,
  Minus,
  Plane,
  Sparkles,
} from "lucide-react";
import {
  cardCollapseProps,
  ExpandableBody,
  ExpandableHeader,
  useExpandable,
} from "@/components/ExpandableCard";
import { PostCardHeader, type PostCardBot } from "@/components/PostCardHeader";
import { MarkdownBody } from "@/components/MarkdownBody";
import { formatMoney } from "@/lib/format";
import {
  asVuelo,
  CATEGORIA_LABELS,
  equipajeLabel,
  escalasLabel,
  formatFlag,
  formatLoose,
  formatUsd,
  formatVueloFechas,
  hasVueloDetalle,
  ofertaHref,
  ORIGEN_LABELS,
  precioResumen,
  VARIACION_LABELS,
  type LooseNumber,
  type VueloDetails,
  type VueloVariacion,
} from "@/lib/vuelos";
import type { Post } from "@/lib/types";

function VariacionChip({ details }: { details: VueloDetails }) {
  const variacion: VueloVariacion | undefined = details.variacion;
  if (!variacion) return null;
  const styles: Record<VueloVariacion, string> = {
    bajo: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    subio: "bg-rose-500/15 text-rose-800 dark:text-rose-200",
    nuevo: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
    igual: "bg-chip text-muted",
  };
  const Icon =
    variacion === "bajo"
      ? ArrowDownRight
      : variacion === "subio"
        ? ArrowUpRight
        : variacion === "nuevo"
          ? Sparkles
          : Minus;
  const prev =
    typeof details.precio_usd_previo === "number" && (variacion === "bajo" || variacion === "subio")
      ? ` · era ${formatUsd(details.precio_usd_previo)}`
      : "";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${styles[variacion]}`}
    >
      <Icon size={12} strokeWidth={1.75} />
      {VARIACION_LABELS[variacion]}
      {prev}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex min-w-0 justify-between gap-3 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function moneyValue(value: LooseNumber | undefined, currency: string): string | null {
  if (value === undefined) return null;
  if (value === "sin confirmar") return "Sin confirmar";
  return currency === "USD" ? formatUsd(value) : formatMoney(value, currency);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <section>
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</h4>
      <dl className="mt-1.5 space-y-1">{children}</dl>
    </section>
  );
}

function DetalleVuelo({ details }: { details: VueloDetails }) {
  const bag = details.equipaje_detalle;
  const carry = bag && typeof bag.carry_on === "object" ? bag.carry_on : null;
  const valijas =
    bag && typeof bag.valijas_despachadas === "object" ? bag.valijas_despachadas : null;
  const tarifa = details.tarifa && typeof details.tarifa === "object" ? details.tarifa : null;
  const hasBag =
    bag &&
    (bag.articulo_personal != null ||
      bag.mochila != null ||
      bag.carry_on != null ||
      bag.valijas_despachadas != null ||
      bag.costo_extra != null);
  const hasTarifa = Boolean(tarifa || (typeof details.tarifa === "string" && details.tarifa));
  const hasPrecio =
    details.precio_ars != null ||
    details.tipo_cambio != null ||
    details.incluye_impuestos != null ||
    details.incluye_percepciones != null ||
    details.precio_ida != null ||
    details.precio_vuelta != null ||
    details.precio_total_ida_vuelta != null;
  const hasCompra = details.low_cost != null || Boolean(details.sitio_compra) || Boolean(details.link_directo);
  const hasResumen =
    Boolean(details.equipaje && details.equipaje !== "sin confirmar") ||
    Boolean(details.escalas && details.escalas !== "sin confirmar") ||
    Boolean(details.notas);

  return (
    <div className="space-y-4">
      {hasResumen ? (
        <Section title="Detalle">
          <Detail label="Escalas" value={formatLoose(details.escalas)} />
          <Detail label="Equipaje" value={formatLoose(details.equipaje)} />
          <Detail label="Notas" value={formatLoose(details.notas)} />
        </Section>
      ) : null}

      {hasBag ? (
        <Section title="Equipaje">
          <Detail label="Artículo personal / mochila" value={formatLoose(bag?.articulo_personal ?? bag?.mochila)} />
          {typeof bag?.carry_on === "string" ? (
            <Detail label="Carry-on" value={formatLoose(bag.carry_on)} />
          ) : (
            <>
              <Detail label="Carry-on" value={formatFlag(carry?.incluido, "Incluido", "No incluido")} />
              <Detail
                label="Peso carry-on"
                value={
                  typeof carry?.peso_kg === "number" ? `${carry.peso_kg} kg` : formatLoose(carry?.peso_kg)
                }
              />
              <Detail label="Medidas carry-on" value={formatLoose(carry?.medidas)} />
            </>
          )}
          {typeof bag?.valijas_despachadas === "string" ? (
            <Detail label="Valijas despachadas" value={formatLoose(bag.valijas_despachadas)} />
          ) : (
            <>
              <Detail label="Valijas despachadas" value={formatLoose(valijas?.cantidad)} />
              <Detail
                label="Peso valija"
                value={typeof valijas?.kg === "number" ? `${valijas.kg} kg` : formatLoose(valijas?.kg)}
              />
              <Detail label="Valija incluida" value={formatFlag(valijas?.incluida, "Incluida", "No incluida")} />
            </>
          )}
          <Detail
            label="Costo de agregar"
            value={
              typeof bag?.costo_extra === "number"
                ? moneyValue(bag.costo_extra, bag.moneda || "USD")
                : formatLoose(bag?.costo_extra)
            }
          />
        </Section>
      ) : null}

      {hasTarifa ? (
        <Section title="Tarifa">
          {typeof details.tarifa === "string" ? (
            <Detail label="Tarifa" value={formatLoose(details.tarifa)} />
          ) : (
            <>
              <Detail label="Nombre" value={tarifa?.nombre ?? null} />
              <Detail label="Permite cambios" value={formatFlag(tarifa?.cambios)} />
              <Detail label="Reembolso" value={formatFlag(tarifa?.reembolso)} />
              <Detail label="Elección de asiento" value={formatFlag(tarifa?.eleccion_asiento, "Incluida", "No incluida")} />
            </>
          )}
        </Section>
      ) : null}

      {details.conexiones?.length ? (
        <Section title="Escalas">
          {details.conexiones.map((conexion, index) => (
            <div key={`${conexion.aeropuerto ?? "esc"}-${index}`} className="rounded-2xl bg-chip/60 px-3 py-2">
              <p className="text-sm font-medium">{conexion.aeropuerto ?? `Escala ${index + 1}`}</p>
              <dl className="mt-1 space-y-1">
                <Detail label="Espera" value={formatLoose(conexion.espera)} />
                <Detail label="Cambio de aeropuerto" value={formatFlag(conexion.cambio_aeropuerto)} />
                <Detail label="Cambio de terminal" value={formatFlag(conexion.cambio_terminal)} />
                <Detail label="Visa o tránsito" value={formatFlag(conexion.visa_transito, "Requiere", "No requiere")} />
              </dl>
            </div>
          ))}
        </Section>
      ) : null}

      {details.tramos?.length ? (
        <Section title="Tramos">
          {details.tramos.map((tramo, index) => {
            const ruta = [tramo.origen, tramo.destino].filter(Boolean).join(" → ");
            return (
              <div key={`${tramo.numero_vuelo ?? "tramo"}-${index}`} className="rounded-2xl bg-chip/60 px-3 py-2">
                <p className="text-sm font-medium">
                  {tramo.numero_vuelo ?? `Tramo ${index + 1}`}
                  {ruta ? ` · ${ruta}` : ""}
                </p>
                <dl className="mt-1 space-y-1">
                  <Detail label="Salida (hora local)" value={formatLoose(tramo.salida)} />
                  <Detail label="Llegada (hora local)" value={formatLoose(tramo.llegada)} />
                  <Detail label="Duración" value={formatLoose(tramo.duracion)} />
                </dl>
              </div>
            );
          })}
          <Detail label="Duración total" value={formatLoose(details.duracion_total)} />
        </Section>
      ) : null}

      {hasPrecio ? (
        <Section title="Precio">
          <Detail label="USD por persona" value={moneyValue(details.precio_usd, "USD")} />
          <Detail label="ARS por persona" value={moneyValue(details.precio_ars, "ARS")} />
          <Detail
            label="Tipo de cambio"
            value={
              typeof details.tipo_cambio === "number"
                ? `1 USD = ${formatMoney(details.tipo_cambio, "ARS")}`
                : formatLoose(details.tipo_cambio)
            }
          />
          <Detail label="Incluye impuestos" value={formatFlag(details.incluye_impuestos)} />
          <Detail label="Incluye percepciones" value={formatFlag(details.incluye_percepciones)} />
          <Detail label="Ida" value={moneyValue(details.precio_ida, details.moneda || "USD")} />
          <Detail label="Vuelta" value={moneyValue(details.precio_vuelta, details.moneda || "USD")} />
          <Detail
            label="Total ida y vuelta"
            value={moneyValue(details.precio_total_ida_vuelta, details.moneda || "USD")}
          />
        </Section>
      ) : null}

      {hasCompra ? (
        <Section title="Compra">
          <Detail label="Low cost" value={formatFlag(details.low_cost)} />
          <Detail label="Sitio de compra" value={details.sitio_compra ?? null} />
        </Section>
      ) : null}
    </div>
  );
}

export function VueloCard({
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
  const details = asVuelo(post.details);
  const title = details?.destino ?? post.title;
  const price = details ? precioResumen(details) : null;
  const escalas = details ? escalasLabel(details) : null;
  const duracion = details ? formatLoose(details.duracion_total) : null;
  const equipaje = details ? equipajeLabel(details) : null;
  const cta = details ? ofertaHref(details) : null;
  const ctaLabel = details?.sitio_compra ? `Ver en ${details.sitio_compra}` : "Ver oferta";
  const canExpand = Boolean(post.body_markdown?.trim() || (details && hasVueloDetalle(details)));

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
        <PostCardHeader
          open={open}
          post={post}
          bot={bot}
          allowRequest={allowRequest}
          kind={post.kind}
          title={
            href ? (
              <Link href={href} className="hover:underline">
                {title}
              </Link>
            ) : (
              title
            )
          }
          titleClassName="text-[1.15rem] font-semibold leading-snug tracking-tight"
          badges={
            details ? (
              <>
                {details.categoria ? (
                  <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 dark:text-sky-200">
                    {CATEGORIA_LABELS[details.categoria]}
                  </span>
                ) : null}
                {details.low_cost === true ? (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    Low cost
                  </span>
                ) : null}
                <VariacionChip details={details} />
              </>
            ) : null
          }
          meta={
            details ? (
              <p className="text-sm text-muted">
                {ORIGEN_LABELS[details.origen]} → {details.destino}
                {" · "}
                {details.aerolinea}
                {" · "}
                {formatVueloFechas(details)}
              </p>
            ) : null
          }
        />

        {details ? (
          <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <ul className="min-w-0 space-y-1 text-sm text-muted">
              {escalas ? (
                <li className="flex items-center gap-1.5">
                  <Plane size={14} strokeWidth={1.75} className="shrink-0" />
                  <span className="min-w-0 [overflow-wrap:anywhere] break-words">{escalas}</span>
                </li>
              ) : null}
              {duracion ? (
                <li className="flex items-center gap-1.5">
                  <Clock size={14} strokeWidth={1.75} className="shrink-0" />
                  <span className="min-w-0 [overflow-wrap:anywhere] break-words">{duracion}</span>
                </li>
              ) : null}
              {equipaje ? (
                <li className="flex items-start gap-1.5">
                  <Briefcase size={14} strokeWidth={1.75} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 [overflow-wrap:anywhere] break-words line-clamp-3">{equipaje}</span>
                </li>
              ) : null}
            </ul>
            {price ? (
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-[1.35rem] font-semibold tabular-nums tracking-tight text-foreground">
                  {price.main}
                </p>
                {price.secondary ? <p className="text-xs text-muted">{price.secondary}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </ExpandableHeader>

      {cta ? (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5" data-no-collapse>
          <a
            href={cta}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
          >
            {ctaLabel}
            <ExternalLink size={15} strokeWidth={1.75} />
          </a>
        </div>
      ) : null}

      <ExpandableBody open={open} id={bodyId}>
        {canExpand ? (
          <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">
            {details && hasVueloDetalle(details) ? <DetalleVuelo details={details} /> : null}
            {post.body_markdown?.trim() ? <MarkdownBody markdown={post.body_markdown} /> : null}
          </div>
        ) : null}
      </ExpandableBody>
    </article>
  );
}
