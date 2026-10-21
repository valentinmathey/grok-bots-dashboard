"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  ChartPie,
  Check,
  CircleDollarSign,
  ExternalLink,
  Lightbulb,
  LineChart,
  MessageCircle,
  Newspaper,
  Percent,
  Pin,
  Play,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { ChartFrame } from "@/components/stats/ChartFrame";
import { registerCharts } from "@/components/stats/chart-setup";
import { chartDefaults, useChartTheme } from "@/components/stats/useChartTheme";
import { MarkdownBody } from "@/components/MarkdownBody";
import { formatDate, formatMoney } from "@/lib/format";
import {
  DEFAULT_INFORME_DISCLAIMER,
  INFORME_PLATFORM_LABEL,
  INFORME_PROFILE_LABEL,
  INFORME_RISK_LABEL,
  INFORME_SECTION_LABELS,
  INFORME_VERDICT_LABEL,
  findTechnicalBlock,
  inflationLineAmount,
  inflationScale,
  informeLead,
  leftoverTechnicalBlocks,
  moneyActions,
  parseAgendaFallback,
  parseTasasRows,
  parseTechnicalBlocks,
  sortRatesByMonthly,
  sortReferentes,
} from "@/lib/informe";
import type { InformeDetails, InformePlatform, InformeRisk } from "@/lib/rich-details";

registerCharts();

type Indicator = InformeDetails["indicators"][number];
type IconType = typeof Sparkles;

export function formatIndicatorValue(value: number, unit?: string) {
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

function formatPct(value: number, digits = 1) {
  const number = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : digits,
  }).format(value);
  return `${number}%`;
}

function SectionHead({ icon: Icon, children }: { icon: IconType; children: string }) {
  return (
    <h4 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
      <Icon size={16} strokeWidth={1.75} className="text-accent" />
      {children}
    </h4>
  );
}

function RiskBadge({ risk }: { risk: InformeRisk }) {
  const cls =
    risk === "bajo"
      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
      : risk === "medio"
        ? "bg-amber-500/15 text-amber-900 dark:text-amber-200"
        : "bg-red-500/15 text-red-800 dark:text-red-200";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {INFORME_RISK_LABEL[risk]}
    </span>
  );
}

function OptionalLink({ href, children }: { href?: string; children: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-accent"
    >
      {children}
      <ExternalLink size={13} strokeWidth={1.75} />
    </a>
  );
}

function PlatformIcon({ platform }: { platform: InformePlatform }) {
  if (platform === "instagram") return <MessageCircle size={14} strokeWidth={1.75} />;
  if (platform === "youtube" || platform === "tiktok") {
    return <Play size={14} strokeWidth={1.75} />;
  }
  if (platform === "nota") return <Newspaper size={14} strokeWidth={1.75} />;
  return <span className="text-[11px] font-bold">𝕏</span>;
}

export function DolarBlock({
  dollars,
  brechaPct,
}: {
  dollars: Indicator[];
  brechaPct?: number;
}) {
  if (!dollars.length) return null;
  return (
    <section className="rounded-2xl bg-raised p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <SectionHead icon={CircleDollarSign}>Dólar</SectionHead>
        {brechaPct != null ? (
          <span className="text-xs font-medium text-muted">Brecha {formatPct(brechaPct)}</span>
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
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm leading-6">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function SimpleView({ details }: { details: InformeDetails }) {
  const lead = informeLead(details);
  const actions = moneyActions(details);
  const lines = details.dia_en_3_lineas?.lines ?? [];
  const word = details.palabra_del_dia;
  return (
    <div className="space-y-3">
      {lines.length ? (
        <section>
          <SectionHead icon={Sparkles}>{INFORME_SECTION_LABELS.dia_en_3_lineas}</SectionHead>
          <ol className="mt-2 space-y-2">
            {lines.map((line, index) => (
              <li key={line} className="flex gap-3 text-sm leading-6">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-chip text-[11px] font-semibold">
                  {index + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : lead ? (
        <p className="text-sm leading-6">{lead}</p>
      ) : (
        <p className="text-sm text-muted">Sin resumen simple.</p>
      )}
      {actions.length ? (
        <section>
          <SectionHead icon={Wallet}>Qué hacer con tu plata</SectionHead>
          <BulletList items={actions} />
        </section>
      ) : null}
      <AgendaCallout details={details} />
      {word ? (
        <section className="rounded-2xl bg-raised px-3 py-2.5">
          <SectionHead icon={BookOpen}>{INFORME_SECTION_LABELS.palabra_del_dia}</SectionHead>
          <p className="mt-2 text-lg font-semibold tracking-tight">{word.term}</p>
          <p className="mt-1 text-sm leading-6">{word.definition}</p>
          <OptionalLink href={word.link}>Fuente</OptionalLink>
        </section>
      ) : null}
    </div>
  );
}

export function TechnicalView({ details }: { details: InformeDetails }) {
  const blocks = useMemo(
    () => parseTechnicalBlocks(details.summary_technical),
    [details.summary_technical],
  );
  const dolarText = details.dolar_simple?.text || findTechnicalBlock(blocks, "dolar")?.body;
  const inflation = details.inflation;
  const inflationText = inflation ? undefined : findTechnicalBlock(blocks, "inflacion")?.body;
  const rates = details.rates?.length ? sortRatesByMonthly(details.rates) : [];
  const parsedRates = rates.length
    ? []
    : parseTasasRows(findTechnicalBlock(blocks, "tasas")?.body ?? "");
  const assets = details.assets ?? [];
  const mercadoText = assets.length ? undefined : findTechnicalBlock(blocks, "mercado")?.body;
  const leftover = leftoverTechnicalBlocks(blocks);

  return (
    <div className="space-y-3">
      {dolarText ? (
        <section>
          <SectionHead icon={CircleDollarSign}>Dólar</SectionHead>
          <p className="mt-1.5 text-sm leading-6">{dolarText}</p>
        </section>
      ) : null}
      {inflation ? (
        <InflationBlock details={details} />
      ) : inflationText ? (
        <section>
          <SectionHead icon={TrendingUp}>Inflación</SectionHead>
          <p className="mt-1.5 text-sm leading-6">{inflationText}</p>
        </section>
      ) : null}
      {rates.length ? (
        <RatesMiniTable rows={rates} />
      ) : parsedRates.length ? (
        <ParsedRatesTable rows={parsedRates} />
      ) : null}
      {assets.length ? (
        <Mercado details={details} />
      ) : mercadoText ? (
        <section>
          <SectionHead icon={LineChart}>Mercado</SectionHead>
          <p className="mt-1.5 text-sm leading-6">{mercadoText}</p>
        </section>
      ) : null}
      <AgendaList details={details} fallback={findTechnicalBlock(blocks, "agenda")?.body} />
      {leftover.map((block) => (
        <section key={`${block.id}-${block.heading}`}>
          <SectionHead icon={Newspaper}>{block.heading}</SectionHead>
          <p className="mt-1.5 text-sm leading-6">{block.body}</p>
        </section>
      ))}
      {!dolarText &&
      !inflation &&
      !inflationText &&
      !rates.length &&
      !parsedRates.length &&
      !assets.length &&
      !mercadoText &&
      !details.agenda?.length &&
      !findTechnicalBlock(blocks, "agenda") &&
      !leftover.length ? (
        details.summary_technical ? (
          <MarkdownBody markdown={details.summary_technical} />
        ) : (
          <p className="text-sm text-muted">Sin parte técnica.</p>
        )
      ) : null}
    </div>
  );
}

export function InflationBlock({ details }: { details: InformeDetails }) {
  const block = details.inflation;
  if (!block) return null;
  return (
    <section>
      <SectionHead icon={TrendingUp}>{INFORME_SECTION_LABELS.inflation}</SectionHead>
      <p className="mt-1 text-xs text-muted">{block.month}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[
          { label: "Mensual", value: block.monthly_pct },
          { label: "Interanual", value: block.yoy_pct },
          { label: "Acumulada", value: block.ytd_pct },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-line p-2.5">
            <p className="text-[11px] text-muted">{item.label}</p>
            <p className="text-lg font-semibold tabular-nums">{formatPct(item.value)}</p>
          </article>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">
        {block.rem_next_pct != null ? `REM próximo: ${formatPct(block.rem_next_pct)}. ` : null}
        Próximo dato: {formatDate(`${block.next_release_date}T12:00:00-03:00`)}
      </p>
    </section>
  );
}

function RatesMiniTable({ rows }: { rows: NonNullable<InformeDetails["rates"]> }) {
  return (
    <section>
      <SectionHead icon={Percent}>{INFORME_SECTION_LABELS.rates}</SectionHead>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-2 font-medium">Entidad</th>
              <th className="pb-2 font-medium">TNA</th>
              <th className="pb-2 font-medium">Mensual</th>
              <th className="pb-2 font-medium">Vs. inflación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.instrument}-${row.provider}`} className="border-t border-line">
                <td className="py-2.5">
                  <p className="font-medium">{row.provider}</p>
                  <p className="text-[11px] text-muted">
                    {row.instrument}
                    {row.term ? ` · ${row.term}` : ""}
                  </p>
                </td>
                <td className="py-2.5 tabular-nums">{formatPct(row.tna_pct)}</td>
                <td className="py-2.5 tabular-nums">{formatPct(row.monthly_pct)}</td>
                <td className="py-2.5">
                  {row.beats_inflation ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <Check size={14} strokeWidth={1.75} />
                      Gana
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                      <X size={14} strokeWidth={1.75} />
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ParsedRatesTable({ rows }: { rows: ReturnType<typeof parseTasasRows> }) {
  if (!rows.length) return null;
  return (
    <section>
      <SectionHead icon={Percent}>Tasas</SectionHead>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-2 font-medium">Entidad</th>
              <th className="pb-2 font-medium">TNA</th>
              <th className="pb-2 font-medium">Mensual</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.entity} className="border-t border-line">
                <td className="py-2.5 font-medium">{row.entity}</td>
                <td className="py-2.5 tabular-nums">{row.tna ?? "—"}</td>
                <td className="py-2.5 tabular-nums">{row.monthly ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function Mercado({ details }: { details: InformeDetails }) {
  const assets = details.assets ?? [];
  if (!assets.length) return null;
  return (
    <section>
      <SectionHead icon={LineChart}>{INFORME_SECTION_LABELS.assets}</SectionHead>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="pb-2 font-medium">Ticker</th>
              <th className="pb-2 font-medium">Precio</th>
              <th className="pb-2 font-medium">Cambio</th>
              <th className="pb-2 font-medium">Nota</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.ticker} className="border-t border-line">
                <td className="py-2.5">
                  <p className="font-semibold">{asset.ticker}</p>
                  <p className="text-[11px] text-muted">
                    {asset.name} · {asset.type}
                  </p>
                </td>
                <td className="py-2.5 tabular-nums">{formatMoney(asset.price, asset.currency)}</td>
                <td
                  className={`py-2.5 tabular-nums font-medium ${
                    asset.change_pct > 0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : asset.change_pct < 0
                        ? "text-red-700 dark:text-red-300"
                        : "text-muted"
                  }`}
                >
                  {asset.change_pct > 0 ? "+" : ""}
                  {formatPct(asset.change_pct)}
                </td>
                <td className="py-2.5 text-muted">{asset.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AgendaCallout({ details }: { details: InformeDetails }) {
  if (details.agenda?.length) {
    return (
      <section className="rounded-2xl bg-raised px-3 py-2.5">
        <SectionHead icon={CalendarDays}>Agenda de la semana</SectionHead>
        <ul className="mt-2 space-y-1.5 text-sm leading-6">
          {details.agenda.slice(0, 4).map((item) => (
            <li key={`${item.date}-${item.title}`}>
              <span className="font-semibold">
                {formatDate(`${item.date}T12:00:00-03:00`)}
                {item.time ? ` · ${item.time}` : ""}
              </span>
              {` ${item.title}`}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (details.outlook) {
    return (
      <section className="rounded-2xl bg-raised px-3 py-2.5">
        <SectionHead icon={CalendarDays}>Agenda de la semana</SectionHead>
        <p className="mt-1.5 text-sm leading-6">{details.outlook}</p>
      </section>
    );
  }
  return null;
}

export function AgendaList({
  details,
  fallback,
}: {
  details: InformeDetails;
  fallback?: string;
}) {
  if (details.agenda?.length) {
    return (
      <section>
        <SectionHead icon={CalendarDays}>{INFORME_SECTION_LABELS.agenda}</SectionHead>
        <ol className="mt-2 space-y-2">
          {details.agenda.map((item) => (
            <li key={`${item.date}-${item.title}`} className="rounded-2xl border border-line px-3 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {formatDate(`${item.date}T12:00:00-03:00`)}
                {item.time ? ` · ${item.time}` : ""}
              </p>
              <p className="mt-0.5 font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm leading-6 text-muted">{item.description}</p>
              ) : null}
              <OptionalLink href={item.link}>Ver</OptionalLink>
            </li>
          ))}
        </ol>
      </section>
    );
  }
  const parsed = fallback ? parseAgendaFallback(fallback) : [];
  if (!parsed.length) return null;
  return (
    <section>
      <SectionHead icon={CalendarDays}>Agenda</SectionHead>
      <ol className="mt-2 space-y-2">
        {parsed.map((item) => (
          <li key={`${item.label}-${item.title}`} className="rounded-2xl border border-line px-3 py-2.5">
            {item.label ? (
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{item.label}</p>
            ) : null}
            <p className="mt-0.5 font-semibold">{item.title}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function VsInflacion({ details }: { details: InformeDetails }) {
  const block = details.vs_inflacion;
  if (!block) return null;
  const inflationAmount = inflationLineAmount(block.example_amount, block.inflation_pct);
  const scale = inflationScale(
    block.example_amount,
    inflationAmount,
    block.options.map((option) => option.result_amount),
  );
  const markerLeft = scale.pct(inflationAmount);
  const verdictCls =
    block.verdict === "si"
      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
      : block.verdict === "no"
        ? "bg-red-500/15 text-red-800 dark:text-red-200"
        : "bg-amber-500/15 text-amber-900 dark:text-amber-200";

  return (
    <section className="rounded-2xl border border-line p-3">
      <SectionHead icon={TrendingUp}>{INFORME_SECTION_LABELS.vs_inflacion}</SectionHead>
      <div className={`mt-2 rounded-2xl px-3 py-3 text-center ${verdictCls}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wide">¿Le ganan?</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">
          {INFORME_VERDICT_LABEL[block.verdict]}
        </p>
        <p className="mt-1 text-xs">
          Sobre {formatMoney(block.example_amount, "ARS")} · inflación {formatPct(block.inflation_pct)}
        </p>
      </div>
      {block.options.length ? (
        <div className="mt-3">
          <div className="relative pt-5">
            <span
              className="absolute top-0 whitespace-nowrap rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
              style={{
                left: `${Math.min(86, Math.max(14, markerLeft))}%`,
                transform: "translateX(-50%)",
              }}
            >
              Inflación {formatPct(block.inflation_pct)}
            </span>
            <div
              className="pointer-events-none absolute bottom-0 top-4 z-10 w-[3px] -translate-x-1/2 rounded-full bg-red-500"
              style={{ left: `${markerLeft}%` }}
              aria-hidden
            />
            <div className="space-y-3">
              {block.options.map((option) => {
                const diff = Math.round(option.result_amount - inflationAmount);
                const wins = diff > 0;
                const ties = diff === 0;
                const barCls = wins ? "bg-emerald-500" : ties ? "bg-amber-500" : "bg-red-400";
                const diffCls = wins
                  ? "text-emerald-700 dark:text-emerald-300"
                  : ties
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-red-700 dark:text-red-300";
                const diffText = ties
                  ? "empata"
                  : `${wins ? "+" : "−"}${formatMoney(Math.abs(diff), "ARS")}`;
                return (
                  <div key={option.name}>
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                      <span className="min-w-0 font-medium">
                        {option.name} · {formatPct(option.monthly_rate_pct)}
                      </span>
                      <span className="shrink-0 text-right tabular-nums">
                        {formatMoney(option.result_amount, "ARS")}{" "}
                        <span className={`font-semibold ${diffCls}`}>{diffText}</span>
                      </span>
                    </div>
                    <div className="relative h-3 overflow-hidden rounded-full bg-chip">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full ${barCls}`}
                        style={{ width: `${Math.max(2, scale.pct(option.result_amount))}%` }}
                        title={`${option.name}: ${formatMoney(option.result_amount, "ARS")}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted">
            <span>{formatMoney(Math.round(scale.min), "ARS")}</span>
            <span>{formatMoney(Math.round(scale.max), "ARS")}</span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-muted">
            Cuánto valdrían {formatMoney(block.example_amount, "ARS")} al final del período. La raya
            roja marca lo que necesitás para empatar la inflación ({formatMoney(inflationAmount, "ARS")}):
            verde le gana, rojo pierde, y al lado ves la diferencia. La escala está ampliada para que se
            noten las diferencias.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export function TecnicaSueldo({ details }: { details: InformeDetails }) {
  const block = details.tecnica_sueldo;
  const theme = useChartTheme();
  const defaults = chartDefaults(theme);
  const colors = ["#7c3aed", "#0f766e", "#ea580c", "#0284c7", "#db2777", "#ca8a04", "#4338ca", "#0e7490"];
  if (!block) return null;

  return (
    <section className="rounded-2xl border border-line p-3">
      <SectionHead icon={ChartPie}>{INFORME_SECTION_LABELS.tecnica_sueldo}</SectionHead>
      <p className="mt-1 font-semibold">{block.name}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{block.description}</p>
      <div className="mt-3 grid items-center gap-3 sm:grid-cols-[minmax(0,180px)_1fr]">
        <ChartFrame height={180}>
          <Doughnut
            data={{
              labels: block.allocation.map((row) => row.label),
              datasets: [
                {
                  data: block.allocation.map((row) => row.pct),
                  backgroundColor: block.allocation.map((_, index) => colors[index % colors.length]),
                  borderColor: theme.card,
                  borderWidth: 2,
                },
              ],
            }}
            options={{
              ...defaults,
              cutout: "68%",
              plugins: {
                ...defaults.plugins,
                legend: { display: false },
              },
            }}
          />
        </ChartFrame>
        <ul className="space-y-1.5 text-sm">
          {block.allocation.map((row, index) => (
            <li key={row.label} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: colors[index % colors.length] }}
                />
                {row.label}
              </span>
              <span className="tabular-nums font-medium">{formatPct(row.pct, 0)}</span>
            </li>
          ))}
        </ul>
      </div>
      {block.example ? (
        <div className="mt-3 rounded-2xl bg-raised px-3 py-2.5 text-sm">
          <p className="text-xs font-medium text-muted">
            Ejemplo sobre {formatMoney(block.example.salary, "ARS")}
          </p>
          <ul className="mt-1.5 space-y-1">
            {block.example.breakdown.map((row) => (
              <li key={row.label} className="flex justify-between gap-3">
                <span>{row.label}</span>
                <span className="tabular-nums">{formatMoney(row.amount, "ARS")}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <OptionalLink href={block.link}>Ver la técnica</OptionalLink>
    </section>
  );
}

export function Referentes({ details }: { details: InformeDetails }) {
  const items = details.referentes?.length ? sortReferentes(details.referentes) : [];
  if (!items.length) return null;
  return (
    <section className="rounded-2xl border border-line p-3">
      <SectionHead icon={Users}>{INFORME_SECTION_LABELS.referentes}</SectionHead>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={`${item.url}-${item.name}`}>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-line p-3 hover:bg-raised"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {item.name}
                    {item.role ? <span className="font-normal text-muted"> · {item.role}</span> : null}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                    <PlatformIcon platform={item.platform} />
                    {INFORME_PLATFORM_LABEL[item.platform]}
                    {" · "}
                    {formatDate(`${item.date}T12:00:00-03:00`)}
                  </p>
                </div>
                {item.pinned ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    <Pin size={11} strokeWidth={1.75} />
                    Fijo
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 text-sm leading-6">{item.summary}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function IdeasCards({ details }: { details: InformeDetails }) {
  if (!details.ideas?.length) return null;
  return (
    <section className="rounded-2xl border border-line p-3">
      <SectionHead icon={Lightbulb}>{INFORME_SECTION_LABELS.ideas}</SectionHead>
      <div className="mt-2 space-y-2">
        {details.ideas.map((idea) => (
          <article key={idea.name} className="rounded-2xl border border-line p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="font-semibold">{idea.name}</p>
              <span className="rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium">
                {INFORME_PROFILE_LABEL[idea.profile]}
              </span>
              <RiskBadge risk={idea.risk} />
            </div>
            <p className="mt-1.5 text-sm leading-6">{idea.what_it_is}</p>
            {idea.expected_return ? (
              <p className="mt-1 text-sm font-medium">Retorno: {idea.expected_return}</p>
            ) : null}
            <p className="mt-1 text-sm leading-6 text-muted">
              <span className="font-semibold text-foreground">Cómo. </span>
              {idea.how_to}
            </p>
            <OptionalLink href={idea.link}>Ver idea</OptionalLink>
          </article>
        ))}
      </div>
    </section>
  );
}

export function OtrasSecciones({ details }: { details: InformeDetails }) {
  if (!details.otras_secciones?.length) return null;
  return (
    <div className="space-y-3">
      {details.otras_secciones.map((section) => (
        <section key={section.titulo} className="rounded-2xl border border-line p-3">
          <SectionHead icon={Newspaper}>{section.titulo}</SectionHead>
          <div className="mt-1.5 text-sm">
            <MarkdownBody markdown={section.markdown} />
          </div>
        </section>
      ))}
    </div>
  );
}

export function SharedLists({ details }: { details: InformeDetails }) {
  if (!details.highlights?.length && !details.risks?.length) return null;
  return (
    <>
      {details.highlights?.length ? (
        <section>
          <SectionHead icon={Sparkles}>Highlights</SectionHead>
          <BulletList items={details.highlights} />
        </section>
      ) : null}
      {details.risks?.length ? (
        <section>
          <SectionHead icon={AlertTriangle}>Riesgos</SectionHead>
          <BulletList items={details.risks} />
        </section>
      ) : null}
    </>
  );
}

export function ExtraInformeSections({ details }: { details: InformeDetails }) {
  return (
    <>
      <VsInflacion details={details} />
      <TecnicaSueldo details={details} />
      <Referentes details={details} />
      <IdeasCards details={details} />
      <OtrasSecciones details={details} />
    </>
  );
}

export function SourcesCollapse({ details }: { details: InformeDetails }) {
  if (!details.sources?.length) return null;
  return (
    <details className="text-sm text-muted">
      <summary className="cursor-pointer font-medium text-foreground">
        Ver fuentes ({details.sources.length})
      </summary>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {details.sources.map((source) =>
          source.url ? (
            <a
              key={`${source.name}-${source.url}`}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-line bg-chip px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-accent"
            >
              <span className="truncate">{source.name}</span>
              <ExternalLink size={11} strokeWidth={1.75} />
            </a>
          ) : (
            <span
              key={source.name}
              className="inline-flex max-w-full items-center rounded-full border border-line bg-chip px-2.5 py-1 text-[11px] font-medium"
            >
              {source.name}
            </span>
          ),
        )}
      </div>
    </details>
  );
}

export function InformeDisclaimer({ details }: { details: InformeDetails }) {
  const text = details.disclaimer?.trim() || DEFAULT_INFORME_DISCLAIMER;
  return <p className="text-xs italic text-muted">{text}</p>;
}
