import { addCalendarDays, baStartOfDay } from "@/lib/event-time";
import type { AgendaEntry, AgendaType } from "@/lib/agenda";

export type CalendarDay = {
  ymd: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
};

export type CalendarSpan = {
  id: string;
  entry: AgendaEntry;
  lane: number;
  colStart: number;
  colEnd: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

export type CalendarWeek = {
  days: CalendarDay[];
  spans: CalendarSpan[];
  pills: AgendaEntry[][];
  extra: number[];
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"] as const;

export function weekdayLabels() {
  return WEEKDAYS;
}

export function mondayOnOrBefore(ymd: string): string {
  const date = baStartOfDay(ymd);
  const weekday = (date.getUTCDay() + 6) % 7;
  return addCalendarDays(ymd, -weekday);
}

export function sundayOnOrAfter(ymd: string): string {
  const date = baStartOfDay(ymd);
  const weekday = (date.getUTCDay() + 6) % 7;
  return addCalendarDays(ymd, 6 - weekday);
}

export function monthBounds(month: string): { start: string; end: string } {
  const [year, mon] = month.split("-").map(Number);
  const start = `${month}-01`;
  const last = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const end = `${month}-${String(last).padStart(2, "0")}`;
  return { start, end };
}

export function entryCoversDay(entry: AgendaEntry, ymd: string): boolean {
  const end = entry.endDate ?? entry.date;
  return entry.date <= ymd && end >= ymd;
}

export function isMultiDay(entry: AgendaEntry): boolean {
  return Boolean(entry.endDate && entry.endDate > entry.date);
}

export function capitalizeEs(value: string): string {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase("es-AR") + value.slice(1);
}

export function formatMonthTitle(month: string): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, mon - 1, 1));
  const name = new Intl.DateTimeFormat("es-AR", { month: "long", timeZone: "UTC" }).format(date);
  return `${capitalizeEs(name)} ${year}`;
}

export function formatAgendaDayHeading(
  ymd: string,
  today: string,
  tomorrow: string,
): string {
  if (ymd === today) return "Hoy";
  if (ymd === tomorrow) return "Mañana";
  const date = baStartOfDay(ymd);
  const weekday = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
  const rest = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
  return `${capitalizeEs(weekday)} ${rest}`;
}

function assignLane(occupied: boolean[][], colStart: number, colEnd: number): number {
  let lane = 0;
  while (true) {
    const row = occupied[lane] ?? (occupied[lane] = Array.from({ length: 7 }, () => false));
    let free = true;
    for (let col = colStart; col <= colEnd; col++) {
      if (row[col]) {
        free = false;
        break;
      }
    }
    if (free) {
      for (let col = colStart; col <= colEnd; col++) row[col] = true;
      return lane;
    }
    lane += 1;
  }
}

export function buildMonthGrid(
  month: string,
  today: string,
  entries: AgendaEntry[],
  pillLimit = 3,
): CalendarWeek[] {
  const { start, end } = monthBounds(month);
  const gridStart = mondayOnOrBefore(start);
  const gridEnd = sundayOnOrAfter(end);
  const days: CalendarDay[] = [];
  for (let ymd = gridStart; ymd <= gridEnd; ymd = addCalendarDays(ymd, 1)) {
    const date = baStartOfDay(ymd);
    const weekday = (date.getUTCDay() + 6) % 7;
    days.push({
      ymd,
      day: Number(ymd.slice(8)),
      inMonth: ymd >= start && ymd <= end,
      isToday: ymd === today,
      isWeekend: weekday >= 5,
    });
  }

  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const slice = days.slice(i, i + 7);
    const weekStart = slice[0]!.ymd;
    const weekEnd = slice[6]!.ymd;
    const occupied: boolean[][] = [];
    const spans: CalendarSpan[] = [];
    const spanningIds = new Set<string>();

    for (const entry of entries) {
      if (!isMultiDay(entry)) continue;
      const spanEnd = entry.endDate!;
      if (spanEnd < weekStart || entry.date > weekEnd) continue;
      const colStart = Math.max(
        0,
        slice.findIndex((day) => day.ymd === (entry.date < weekStart ? weekStart : entry.date)),
      );
      const last = entry.date < weekStart ? weekStart : entry.date;
      const clippedEnd = spanEnd > weekEnd ? weekEnd : spanEnd;
      const colEnd = slice.findIndex((day) => day.ymd === clippedEnd);
      const lane = assignLane(occupied, colStart, colEnd === -1 ? 6 : colEnd);
      spanningIds.add(entry.id);
      spans.push({
        id: `${entry.id}-${weekStart}`,
        entry,
        lane,
        colStart,
        colEnd: colEnd === -1 ? 6 : colEnd,
        continuesBefore: entry.date < weekStart,
        continuesAfter: spanEnd > weekEnd,
      });
    }

    const pills: AgendaEntry[][] = slice.map((day) =>
      entries.filter((entry) => !spanningIds.has(entry.id) && entryCoversDay(entry, day.ymd)),
    );
    const extra = pills.map((list) => Math.max(0, list.length - pillLimit));
    weeks.push({
      days: slice,
      spans,
      pills: pills.map((list) => list.slice(0, pillLimit)),
      extra,
    });
  }

  return weeks;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, mon - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type AgendaQuery = {
  view: "lista" | "calendario";
  type?: AgendaType;
  fav?: boolean;
  bots: string[];
  month: string;
};

export function parseAgendaView(value?: string): "lista" | "calendario" {
  return value === "mes" || value === "calendario" ? "calendario" : "lista";
}

export function parseBotSlugs(value?: string): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export function agendaHref(query: AgendaQuery, next: Partial<AgendaQuery> = {}): string {
  const merged: AgendaQuery = {
    view: next.view ?? query.view,
    type: "type" in next ? next.type : query.type,
    fav: next.fav ?? query.fav,
    bots: next.bots ?? query.bots,
    month: next.month ?? query.month,
  };
  const params = new URLSearchParams();
  if (merged.view === "calendario") params.set("view", "calendario");
  if (merged.type) params.set("type", merged.type);
  if (merged.fav) params.set("fav", "1");
  if (merged.bots.length) params.set("bots", merged.bots.join(","));
  if (merged.view === "calendario") params.set("month", merged.month);
  const qs = params.toString();
  return qs ? `/agenda?${qs}` : "/agenda";
}

export function countAgendaFilters(query: Pick<AgendaQuery, "type" | "fav" | "bots">): number {
  return (query.type ? 1 : 0) + (query.fav ? 1 : 0) + query.bots.length;
}

export function stripDateFromTitle(title: string): string {
  return title
    .replace(/\s*\((?:lun|mar|mié|mie|jue|vie|sáb|sab|dom)[a-zá.]*\s+\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\)\s*$/i, "")
    .replace(/\s*\(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\)\s*$/, "")
    .trim();
}

export function formatAgendaTime(iso?: string, allDay?: boolean): string | undefined {
  if (!iso || allDay) return undefined;
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
    hourCycle: "h23",
  }).format(date);
  if (time === "00:00") return undefined;
  return time;
}
