import { BA_TIMEZONE } from "@/lib/event-time";

export const DATE_PRESETS = [
  { id: "hoy", label: "Hoy" },
  { id: "semana", label: "Esta semana" },
  { id: "mes", label: "Este mes" },
  { id: "proximos30", label: "Próximos 30 días" },
] as const;

export type DatePresetId = (typeof DATE_PRESETS)[number]["id"];
export type DateRange = { from: string; to: string };

/** YYYY-MM-DD de `now` en hora Argentina. */
export function todayYmd(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!));
}

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(ymd: string, days: number): string {
  const date = parseYmd(ymd);
  date.setUTCDate(date.getUTCDate() + days);
  return toYmd(date);
}

/** Rango de un preset (semana lunes→domingo), calculado en hora Argentina. */
export function presetRange(id: DatePresetId, now: Date = new Date()): DateRange {
  const today = todayYmd(now);
  switch (id) {
    case "hoy":
      return { from: today, to: today };
    case "semana": {
      const weekday = (parseYmd(today).getUTCDay() + 6) % 7; // 0 = lunes
      const from = addDays(today, -weekday);
      return { from, to: addDays(from, 6) };
    }
    case "mes": {
      const date = parseYmd(today);
      const from = toYmd(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
      const to = toYmd(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
      return { from, to };
    }
    case "proximos30":
      return { from: today, to: addDays(today, 30) };
  }
}

export function matchingPreset(
  range: { from?: string; to?: string },
  now: Date = new Date(),
): DatePresetId | null {
  if (!range.from || !range.to) return null;
  for (const preset of DATE_PRESETS) {
    const r = presetRange(preset.id, now);
    if (r.from === range.from && r.to === range.to) return preset.id;
  }
  return null;
}

/** `2026-10-12` → `12/10/2026`. */
export function formatDmy(ymd?: string): string {
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}
