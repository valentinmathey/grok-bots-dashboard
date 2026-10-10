/** America/Argentina/Buenos_Aires es UTC−3 todo el año (sin DST). */
export const BA_TIMEZONE = "America/Argentina/Buenos_Aires";
export const BA_OFFSET = "-03:00";

export type ParseEventResult =
  | { ok: true; iso: string; date: Date }
  | { ok: false; message: string };

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_DT =
  /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;

export function parseEventInstant(value: string): ParseEventResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, message: "Falta la fecha del evento" };
  }

  if (DATE_ONLY.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00.000${BA_OFFSET}`);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, message: "La fecha del evento no es válida" };
    }
    return { ok: true, iso: date.toISOString(), date };
  }

  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, message: "Usá ISO 8601 o YYYY-MM-DD" };
    }
    return { ok: true, iso: date.toISOString(), date };
  }

  const local = LOCAL_DT.exec(trimmed);
  if (local) {
    const [, ymd, hh, mm, ss] = local;
    const date = new Date(`${ymd}T${hh}:${mm}:${ss ?? "00"}${BA_OFFSET}`);
    if (Number.isNaN(date.getTime())) {
      return { ok: false, message: "La fecha del evento no es válida" };
    }
    return { ok: true, iso: date.toISOString(), date };
  }

  return { ok: false, message: "Usá ISO 8601 o YYYY-MM-DD (hora Argentina)" };
}

/** `undefined` = no vino el campo; `null` = limpiar; `"invalid"` = mal formado. */
export function normalizeEventInstant(
  value: string | null | undefined,
): string | null | undefined | "invalid" {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value.trim() === "") {
    return null;
  }
  const parsed = parseEventInstant(value);
  return parsed.ok ? parsed.iso : "invalid";
}

export function baCalendarDate(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${lookup("year")}-${lookup("month")}-${lookup("day")}`;
}

export function baStartOfDay(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000${BA_OFFSET}`);
}

export function baEndOfDay(ymd: string): Date {
  return new Date(`${ymd}T23:59:59.999${BA_OFFSET}`);
}

export function baStartOfToday(now = new Date()): Date {
  return baStartOfDay(baCalendarDate(now));
}

export function baWallAt(daysFromToday: number, hour: number, minute = 0, now = new Date()): Date {
  return new Date(
    baStartOfToday(now).getTime() +
      daysFromToday * 86_400_000 +
      (hour * 60 + minute) * 60_000,
  );
}

export function isDateOnlyMidnightBa(iso: string): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return lookup("hour") === "00" && lookup("minute") === "00" && lookup("second") === "00";
}

export type EventStamp = {
  event_at?: string | null;
  event_end_at?: string | null;
};

export function isEventUpcoming(post: EventStamp, now = new Date()): boolean {
  if (!post.event_at) {
    return false;
  }
  if (new Date(post.event_at).getTime() >= baStartOfToday(now).getTime()) {
    return true;
  }
  return Boolean(
    post.event_end_at && new Date(post.event_end_at).getTime() >= now.getTime(),
  );
}

export function isEventToday(post: EventStamp, now = new Date()): boolean {
  if (!post.event_at) {
    return false;
  }
  const today = baCalendarDate(now);
  const start = baCalendarDate(post.event_at);
  if (start === today) {
    return true;
  }
  if (post.event_end_at) {
    const end = baCalendarDate(post.event_end_at);
    return start <= today && end >= today;
  }
  return false;
}

export function isEventPast(post: EventStamp, now = new Date()): boolean {
  return Boolean(post.event_at) && !isEventUpcoming(post, now);
}

export function eventSortAscending(
  sort: "newest" | "oldest",
  scope: "upcoming" | "past",
): boolean {
  if (scope === "upcoming") {
    return sort !== "oldest";
  }
  return sort === "oldest";
}

/** Suma días a un YYYY-MM-DD de calendario (sin DST). */
export function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
