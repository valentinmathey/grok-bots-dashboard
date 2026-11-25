"use client";

import { ExternalLink } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import {
  AEROLINEA_TIPO_LABELS,
  formatDatoConFuente,
  formatFuentes,
  formatLoose,
  formatPiezaEquipaje,
  formatTramoOperador,
  type AerolineaFicha,
  type VueloDetails,
  type VueloAerolineaTipo,
} from "@/lib/vuelos";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === "") return null;
  return (
    <div className="flex min-w-0 justify-between gap-3 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium [overflow-wrap:anywhere] break-words">{children}</dd>
    </div>
  );
}

function LinkValue({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex max-w-full items-center justify-end gap-1 text-accent underline-offset-2 hover:underline"
    >
      <span className="min-w-0 [overflow-wrap:anywhere] break-words">{children}</span>
      <ExternalLink size={13} strokeWidth={1.75} className="shrink-0" />
    </a>
  );
}

function Dato({
  label,
  value,
}: {
  label: string;
  value: ReturnType<typeof formatDatoConFuente>;
}) {
  if (!value.texto && !value.fuente && !value.url) return null;
  return (
    <Row label={label}>
      <span className="inline-flex min-w-0 flex-col items-end gap-0.5">
        {value.texto ? <span>{value.texto}</span> : null}
        {value.fuente ? (
          value.url ? (
            <LinkValue href={value.url}>{`Fuente: ${value.fuente}`}</LinkValue>
          ) : (
            <span className="text-xs font-normal text-muted">Fuente: {value.fuente}</span>
          )
        ) : value.url ? (
          <LinkValue href={value.url}>Fuente</LinkValue>
        ) : null}
      </span>
    </Row>
  );
}

export function AerolineaFichaSheet({
  open,
  onClose,
  ficha,
  details,
}: {
  open: boolean;
  onClose: () => void;
  ficha: AerolineaFicha | null;
  details?: VueloDetails | null;
}) {
  const info = ficha?.info ?? null;
  const tipo =
    info?.tipo && info.tipo !== "sin confirmar"
      ? AEROLINEA_TIPO_LABELS[info.tipo as VueloAerolineaTipo] ?? info.tipo
      : formatLoose(info?.tipo);
  const bag = info?.equipaje_estandar;
  const bagText = typeof bag === "string" ? formatLoose(bag) : null;
  const bagObj = bag && typeof bag === "object" ? bag : null;
  const fuentes = formatFuentes(info?.fuentes);
  const politica =
    info?.politica_equipaje_url && info.politica_equipaje_url !== "sin confirmar"
      ? info.politica_equipaje_url
      : null;
  const tramos = details?.tramos?.filter(
    (tramo) => tramo.codeshare != null || formatTramoOperador(tramo),
  );
  const hasInfo = Boolean(
    ficha &&
      (ficha.iata ||
        info ||
        (tramos && tramos.length)),
  );

  return (
    <Sheet open={open} onClose={onClose} title={ficha?.label ?? "Aerolínea"} desktopDialog>
      <div className="space-y-4 px-4 pb-4">
        <dl className="space-y-1.5">
          <Row label="Nombre">{ficha?.nombre ?? null}</Row>
          <Row label="Código IATA">{ficha?.iata ?? formatLoose(details?.aerolinea_iata)}</Row>
          <Row label="Tipo">{tipo}</Row>
          <Row label="Alianza">{formatLoose(info?.alianza)}</Row>
        </dl>

        {bagText || bagObj ? (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              Equipaje estándar
            </h3>
            <dl className="mt-1.5 space-y-1.5">
              {bagText ? <Row label="Resumen">{bagText}</Row> : null}
              <Row label="Mochila">{formatPiezaEquipaje(bagObj?.mochila)}</Row>
              <Row label="Carry-on">{formatPiezaEquipaje(bagObj?.carry_on)}</Row>
              <Row label="Valija">{formatPiezaEquipaje(bagObj?.valija)}</Row>
            </dl>
          </section>
        ) : null}

        <dl className="space-y-1.5">
          <Dato label="Puntualidad" value={formatDatoConFuente(info?.puntualidad)} />
          <Dato label="Reputación" value={formatDatoConFuente(info?.reputacion)} />
          <Row label="Política de equipaje">
            {politica ? <LinkValue href={politica}>Ver política</LinkValue> : formatLoose(info?.politica_equipaje_url)}
          </Row>
        </dl>

        {fuentes.length ? (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Fuentes</h3>
            <ul className="mt-1.5 space-y-1 text-sm">
              {fuentes.map((fuente, index) => (
                <li key={`${fuente.label}-${index}`} className="min-w-0 text-right [overflow-wrap:anywhere] break-words">
                  {fuente.url ? (
                    <LinkValue href={fuente.url}>{fuente.label}</LinkValue>
                  ) : (
                    fuente.label
                  )}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tramos?.length ? (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              En este vuelo
            </h3>
            <dl className="mt-1.5 space-y-1.5">
              {tramos.map((tramo, index) => {
                const ruta = [tramo.origen, tramo.destino].filter(Boolean).join(" → ");
                const label = tramo.numero_vuelo ?? (ruta || `Tramo ${index + 1}`);
                const operador = formatTramoOperador(tramo);
                const codeshare =
                  typeof tramo.codeshare === "boolean"
                    ? tramo.codeshare
                      ? "Codeshare"
                      : null
                    : formatLoose(tramo.codeshare);
                const value = [codeshare, operador ? `opera ${operador}` : null].filter(Boolean).join(" · ");
                return (
                  <Row key={`${label}-${index}`} label={label}>
                    {value || null}
                  </Row>
                );
              })}
            </dl>
          </section>
        ) : null}

        {!hasInfo ? (
          <p className="text-sm text-muted">
            Todavía no hay una ficha de esta aerolínea. Cuando Vuelos publique tipo, alianza,
            equipaje estándar o fuentes, aparecen acá.
          </p>
        ) : (
          <p className="text-xs text-muted">
            Datos tomados de la publicación más reciente que los incluye.
          </p>
        )}
      </div>
    </Sheet>
  );
}
