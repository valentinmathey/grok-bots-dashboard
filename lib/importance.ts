import { z } from "zod";

export const IMPORTANCE_LEVELS = ["imperdible", "destacado", "bueno", "normal"] as const;
export type ImportanceLevel = (typeof IMPORTANCE_LEVELS)[number];

/** Chips de filtro (multi-select). "normal" también, por si quieren ocultar lo marcado. */
export const IMPORTANCE_FILTER_LEVELS = IMPORTANCE_LEVELS;

export const IMPORTANCE_LABELS: Record<ImportanceLevel, string> = {
  imperdible: "Imperdible",
  destacado: "Destacado",
  bueno: "Bueno",
  normal: "Normal",
};

export const IMPORTANCE_BADGE: Record<
  Exclude<ImportanceLevel, "normal">,
  { emoji: string; label: string; className: string }
> = {
  imperdible: {
    emoji: "🔥",
    label: "Imperdible",
    className: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  },
  destacado: {
    emoji: "⭐",
    label: "Destacado",
    className: "bg-amber-400/20 text-amber-900 dark:text-amber-300",
  },
  bueno: {
    emoji: "👍",
    label: "Bueno",
    className: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
  },
};

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha YYYY-MM-DD");

/** Campos opcionales de importancia para details de eventos. */
export const importanceFields = {
  importance: z.enum(IMPORTANCE_LEVELS).optional(),
  importance_reason: z.string().trim().max(120).optional(),
  buy_before: ymd.optional(),
};

export function isImportanceLevel(value: unknown): value is ImportanceLevel {
  return (IMPORTANCE_LEVELS as readonly string[]).includes(String(value));
}

export function readImportance(details: Record<string, unknown> | null | undefined): {
  level: ImportanceLevel | null;
  reason: string | null;
  buyBefore: string | null;
} {
  const d = details ?? {};
  const level = isImportanceLevel(d.importance) ? d.importance : null;
  const reason =
    typeof d.importance_reason === "string" && d.importance_reason.trim()
      ? d.importance_reason.trim()
      : null;
  const buyBefore =
    typeof d.buy_before === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.buy_before)
      ? d.buy_before
      : null;
  return { level, reason, buyBefore };
}

/** Multi-select: el post entra si su importance está en la lista (o es null y no se filtró). */
export function matchesImportance(
  details: Record<string, unknown> | null | undefined,
  selected: readonly string[] | undefined,
): boolean {
  if (!selected?.length) return true;
  const { level } = readImportance(details);
  if (!level) return false;
  return selected.includes(level);
}

/** "Comprar antes del 18/11" (día/mes, hora Mendoza / calendario AR). */
export function buyBeforeLabel(ymdValue: string): string {
  const [y, m, d] = ymdValue.split("-").map(Number);
  if (!y || !m || !d) return `Comprar antes del ${ymdValue}`;
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `Comprar antes del ${dd}/${mm}`;
}

export function parseImportanceList(value: string | string[] | undefined): ImportanceLevel[] | undefined {
  const raw = Array.isArray(value) ? value.join(",") : value;
  if (!raw?.trim()) return undefined;
  const list = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(isImportanceLevel);
  return list.length ? [...new Set(list)] : undefined;
}
