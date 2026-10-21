import {
  INFORME_SECTION_IDS,
  type InformeDetails,
  type InformePlatform,
  type InformeProfile,
  type InformeRisk,
  type InformeSectionId,
  type InformeVerdict,
} from "@/lib/rich-details";

export const DEFAULT_INFORME_DISCLAIMER = "No es asesoramiento financiero";

export const INFORME_SECTION_LABELS: Record<InformeSectionId, string> = {
  dia_en_3_lineas: "El día en 3 líneas",
  dolar_simple: "Dólar hoy",
  vs_inflacion: "¿Tus pesos le ganan a la inflación?",
  idea_prudente: "Qué haría alguien prudente hoy",
  tecnica_sueldo: "Técnica para usar tu sueldo",
  referentes: "Qué dicen los referentes",
  palabra_del_dia: "Palabra del día",
  inflation: "Inflación",
  rates: "Tasas",
  ideas: "Ideas de inversión",
  assets: "Mercado",
  agenda: "Agenda",
  highlights: "Highlights",
  risks: "Riesgos",
  outlook: "Outlook",
  disclaimer: "Disclaimer",
  otras_secciones: "Otras secciones",
};

export const INFORME_VERDICT_LABEL: Record<InformeVerdict, string> = {
  si: "Sí",
  no: "No",
  empata: "Empata",
};

export const INFORME_RISK_LABEL: Record<InformeRisk, string> = {
  bajo: "Riesgo bajo",
  medio: "Riesgo medio",
  alto: "Riesgo alto",
};

export const INFORME_PROFILE_LABEL: Record<InformeProfile, string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arriesgado: "Arriesgado",
};

export const INFORME_PLATFORM_LABEL: Record<InformePlatform, string> = {
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  nota: "Nota",
};

export const INFORME_DOLAR_KEYS = new Set([
  "dolar_oficial",
  "dolar_blue",
  "dolar_mep",
  "dolar_ccl",
  "dolar_cripto",
]);

export type TechnicalBlock = { id: string; heading: string; body: string };
export type ParsedRateRow = { entity: string; tna?: string; monthly?: string };
export type ParsedAgendaItem = { label: string; title: string };

const TECHNICAL_SKIP = new Set([
  "highlights",
  "riesgos",
  "risks",
  "outlook",
  "fuentes",
  "sources",
]);

export function informeThreeLines(details: InformeDetails): string[] {
  if (details.dia_en_3_lineas?.lines.length) {
    return details.dia_en_3_lineas.lines;
  }
  if (details.highlights?.length) {
    return details.highlights.slice(0, 3);
  }
  const summary = details.summary_simple?.trim();
  if (!summary) return [];
  const parts = summary
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
  return parts.length ? parts : [summary];
}

export function informeHeadline(details: InformeDetails, fallback: string): string {
  return informeThreeLines(details)[0] ?? details.summary_simple?.slice(0, 140) ?? fallback;
}

export function informeLead(details: InformeDetails): string {
  if (details.dia_en_3_lineas?.lines.length) {
    return details.dia_en_3_lineas.lines.join(" ");
  }
  return details.summary_simple?.trim() ?? "";
}

export function moneyActions(details: InformeDetails): string[] {
  const items: string[] = [];
  if (details.idea_prudente) {
    items.push(`${details.idea_prudente.title}: ${details.idea_prudente.text}`);
  }
  if (details.vs_inflacion) {
    const block = details.vs_inflacion;
    const verdict =
      block.verdict === "si"
        ? "Hay colocaciones que le ganan a la inflación."
        : block.verdict === "no"
          ? "Hoy las tasas quedan cortas contra la inflación."
          : "Las tasas empatan la inflación: no hay carry claro.";
    items.push(verdict);
    const best = [...block.options].sort((a, b) => b.monthly_rate_pct - a.monthly_rate_pct)[0];
    if (best) {
      items.push(`${best.name} da ${formatPlainPct(best.monthly_rate_pct)} mensual.`);
    }
  }
  for (const idea of details.ideas ?? []) {
    items.push(`${idea.name}: ${idea.how_to}`);
  }
  return items.slice(0, 6);
}

function formatPlainPct(value: number): string {
  const digits = value % 1 === 0 ? 0 : 2;
  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : Math.min(2, digits),
  }).format(value)}%`;
}

export function sortReferentes(
  items: NonNullable<InformeDetails["referentes"]>,
): NonNullable<InformeDetails["referentes"]> {
  const pinned = items.filter((item) => item.pinned);
  const rest = items.filter((item) => !item.pinned);
  return [...pinned, ...rest];
}

export function sortRatesByMonthly(
  rows: NonNullable<InformeDetails["rates"]>,
): NonNullable<InformeDetails["rates"]> {
  return [...rows].sort((a, b) => b.monthly_pct - a.monthly_pct);
}

export function groupInformeSources(
  sources: NonNullable<InformeDetails["sources"]>,
): Array<{ section?: InformeSectionId; label: string; items: NonNullable<InformeDetails["sources"]> }> {
  const known = new Set<string>(INFORME_SECTION_IDS);
  const groups = new Map<string, NonNullable<InformeDetails["sources"]>>();
  for (const source of sources) {
    const key = source.section && known.has(source.section) ? source.section : "";
    const list = groups.get(key) ?? [];
    list.push(source);
    groups.set(key, list);
  }
  const ordered: Array<{
    section?: InformeSectionId;
    label: string;
    items: NonNullable<InformeDetails["sources"]>;
  }> = [];
  for (const id of INFORME_SECTION_IDS) {
    const items = groups.get(id);
    if (items?.length) {
      ordered.push({ section: id, label: INFORME_SECTION_LABELS[id], items });
    }
  }
  const general = groups.get("");
  if (general?.length) {
    ordered.push({ label: "General", items: general });
  }
  return ordered;
}

export function inflationLineAmount(exampleAmount: number, inflationPct: number): number {
  return exampleAmount * (1 + inflationPct / 100);
}

/**
 * Escala con zoom para las barras de "¿le ganan a la inflación?": arranca en el
 * monto inicial (o un poco abajo del menor) y termina un poco arriba del mayor o
 * de la inflación, para que las diferencias chicas se vean.
 */
export function inflationScale(exampleAmount: number, inflationAmount: number, values: number[]) {
  const lo = Math.min(exampleAmount, inflationAmount, ...values);
  const hi = Math.max(exampleAmount, inflationAmount, ...values);
  const span = Math.max(hi - lo, Math.abs(exampleAmount) * 0.005, 1);
  const min = lo < exampleAmount ? lo - span * 0.1 : exampleAmount;
  const max = hi + span * 0.12;
  const pct = (value: number) => Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  return { min, max, pct };
}

export function isInformeSectionId(value: string): value is InformeSectionId {
  return (INFORME_SECTION_IDS as readonly string[]).includes(value);
}

export function normalizeTechnicalHeading(heading: string): string {
  const raw = heading
    .trim()
    .toLowerCase()
    .replace(/:$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const base = raw.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (base.includes("dolar") || base.includes("blue") && base.includes("oficial")) return "dolar";
  if (base.startsWith("inflacion") || base.includes("inflacion")) return "inflacion";
  if (base.startsWith("tasa") || base.includes("tna")) return "tasas";
  if (base.startsWith("mercado") || base.includes("merval") || base.includes("riesgo pais")) {
    return "mercado";
  }
  if (base.startsWith("agenda")) return "agenda";
  if (base.startsWith("highlight")) return "highlights";
  if (base.startsWith("riesgo") && !base.includes("pais")) return "risks";
  return base || "notas";
}

export function parseTechnicalBlocks(markdown?: string): TechnicalBlock[] {
  if (!markdown?.trim()) return [];
  const text = markdown.trim();
  const matches = [...text.matchAll(/\*\*([^*]+)\*\*:?\s*/g)];
  if (!matches.length) {
    return [{ id: "notas", heading: "Notas", body: text }];
  }
  const blocks: TechnicalBlock[] = [];
  const firstIndex = matches[0]?.index ?? 0;
  if (firstIndex > 0) {
    const preamble = text.slice(0, firstIndex).trim();
    if (preamble) blocks.push({ id: "notas", heading: "Notas", body: preamble });
  }
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    if (!match) continue;
    const start = (match.index ?? 0) + match[0].length;
    const next = matches[index + 1];
    const end = next?.index ?? text.length;
    const body = text.slice(start, end).trim();
    const heading = match[1]?.trim() ?? "";
    if (!heading && !body) continue;
    blocks.push({
      id: normalizeTechnicalHeading(heading),
      heading: heading.replace(/:$/, ""),
      body,
    });
  }
  return blocks;
}

export function findTechnicalBlock(
  blocks: TechnicalBlock[],
  id: string,
): TechnicalBlock | undefined {
  return blocks.find((block) => block.id === id && block.body);
}

export function leftoverTechnicalBlocks(blocks: TechnicalBlock[]): TechnicalBlock[] {
  const known = new Set(["dolar", "inflacion", "tasas", "mercado", "agenda", ...TECHNICAL_SKIP]);
  return blocks.filter((block) => block.body && !known.has(block.id));
}

export function parseTasasRows(body: string): ParsedRateRow[] {
  return body
    .split(/\s*·\s*/)
    .map((chunk) => chunk.trim().replace(/[.;]+$/, "").trim())
    .filter(Boolean)
    .map((chunk) => {
      const match = chunk.match(/^(.+?)\s+([\d.,~]+%?)\s*\/\s*([\d.,~\-]+%?)\s*$/);
      if (match) {
        return { entity: match[1].trim(), tna: match[2], monthly: match[3] };
      }
      return { entity: chunk };
    });
}

export function parseAgendaFallback(body: string): ParsedAgendaItem[] {
  return body
    .split(/\s*·\s*/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const match = chunk.match(
        /^((?:lun|mar|mie|mié|jue|vie|sab|sáb|dom)[a-zA-Záéíóú]*\.?\s+\d{1,2})\s+(.+)$/i,
      );
      if (match) return { label: match[1], title: match[2] };
      return { label: "", title: chunk };
    });
}

export function hasInformeToggle(details: InformeDetails): boolean {
  return Boolean(
    details.summary_simple ||
      details.summary_technical ||
      details.dia_en_3_lineas ||
      details.dolar_simple ||
      details.idea_prudente ||
      details.vs_inflacion ||
      details.inflation ||
      details.rates?.length ||
      details.ideas?.length ||
      details.assets?.length ||
      details.agenda?.length ||
      details.palabra_del_dia,
  );
}

export function splitInformeIndicators(details: InformeDetails) {
  return {
    dollars: details.indicators.filter((item) => INFORME_DOLAR_KEYS.has(item.key)),
    others: details.indicators.filter((item) => !INFORME_DOLAR_KEYS.has(item.key)),
  };
}
