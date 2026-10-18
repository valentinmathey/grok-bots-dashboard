import type { AgendaEntry } from "@/lib/agenda";
import { BA_TIMEZONE, baCalendarDate, isDateOnlyMidnightBa } from "@/lib/event-time";
import { stripEventFactLines } from "@/lib/event-facts";

/** Zona del feed (Mendoza: UTC−3 todo el año, sin horario de verano). */
export const ICS_TZID = BA_TIMEZONE;
const DEFAULT_DURATION_MS = 2 * 3_600_000;

// ---------- emoji por tipo ----------

const EMOJI_RULES: Array<[string, RegExp]> = [
  ["🏆", /hackat[oó]n|hackathon|competencia|competition|premio|concurso|challenge|desaf[ií]o/i],
  ["🎓", /\bcurso|bootcamp|taller|workshop|capacitaci[oó]n|diplomatura|\bbecas?\b|scholarship/i],
  ["💼", /empleo|trabajo|\bjobs?\b|networking|\bferia|career/i],
  ["🎉", /festival|fiesta|\bparty\b|after\s?office/i],
  ["🎤", /meetup|charla|\btalks?\b|conferencia|conference|\bconf\b|summit|congreso|jornada|webinar|panel/i],
  ["🤖", /\bia\b|\bai\b|inteligencia artificial|machine learning|\bml\b|\bllm|gpt|deep ?learning/i],
  ["💸", /fintech|crypto|cripto|bitcoin|blockchain|banking|banca|finanzas/i],
];

const STARTS_WITH_EMOJI = /^\p{Extended_Pictographic}/u;

export function eventEmoji(input: {
  title: string;
  tags?: string[];
  category?: string | null;
  type?: AgendaEntry["type"];
}): string {
  if (input.type === "viaje") return "✈️";
  const haystack = [input.category ?? "", ...(input.tags ?? []).map((tag) => tag.replace(/-/g, " ")), input.title].join(" · ");
  for (const [emoji, re] of EMOJI_RULES) if (re.test(haystack)) return emoji;
  return input.type === "cierre" ? "⏳" : "📅";
}

/** Emoji de una entrada de agenda (feed .ics y chip de la lista). */
export function entryEmoji(entry: AgendaEntry): string {
  return eventEmoji({
    title: entry.title,
    tags: entry.tags,
    category: detailString(entry.details, ["category", "type", "categoria"]),
    type: entry.type,
  });
}

export function summaryWithEmoji(title: string, emoji: string): string {
  const trimmed = title.trim();
  return STARTS_WITH_EMOJI.test(trimmed) ? trimmed : `${emoji} ${trimmed}`;
}

// ---------- escape y plegado ----------

export function icsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Pliega a 75 octetos (UTF-8) sin cortar caracteres multibyte. */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
      limit = 74; // la continuación arranca con un espacio
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

// ---------- fechas ----------

function ymd(value: string) {
  return value.replace(/-/g, "");
}

function addDays(dateYmd: string, days: number) {
  const date = new Date(`${dateYmd}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Hora local de Mendoza en formato ICS (YYYYMMDDTHHMMSS). */
export function localStamp(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ICS_TZID,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
}

function utcStamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function isTimed(entry: AgendaEntry): boolean {
  return Boolean(!entry.allDay && entry.startsAt && !isDateOnlyMidnightBa(entry.startsAt));
}

// ---------- texto ----------

const URL_RE = /https?:\/\/[^\s)\]>]+/i;

function cleanMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, "$1")
    .replace(/[*_`>#]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function factLine(body: string, label: RegExp): string | undefined {
  for (const raw of body.split(/\n+/)) {
    const line = raw.replace(/^[-*#>\s]+/, "").replace(/\*+/g, "").trim();
    const match = line.match(new RegExp(`^(?:${label.source})\\s*[:\\-–]\\s*(.+)$`, "i"));
    if (match?.[1]) return match[1].trim();
  }
  return undefined;
}

function detailString(details: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!details) return undefined;
  for (const key of keys) {
    const value = details[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function eventLocation(entry: AgendaEntry): string | undefined {
  const details = entry.details ?? null;
  if (entry.type === "viaje") {
    const area = detailString(details, ["area", "city"]);
    return area ? (/brasil|brazil/i.test(area) ? area : `${area}, Brasil`) : "Brasil";
  }
  const modality = detailString(details, ["modality", "modalidad", "format", "formato"]);
  const venue = detailString(details, ["venue", "location", "place", "lugar", "address", "direccion"]);
  const city = detailString(details, ["city", "ciudad"]);
  const bodyPlace = entry.body ? factLine(entry.body, /lugar|ubicaci[oó]n|location/) : undefined;
  const online =
    /online|virtual|remot/i.test(modality ?? "") ||
    (!venue && /^\s*(online|virtual)/i.test(cleanMarkdown(bodyPlace ?? ""))) ||
    (!venue && !bodyPlace && (entry.tags ?? []).some((tag) => /^(online|virtual)$/i.test(tag)));
  if (online && !venue) return "Online";
  if (venue) return city && !venue.includes(city) ? `${venue}, ${city}` : venue;
  if (bodyPlace) return cleanMarkdown(bodyPlace);
  return entry.location;
}

export function registrationUrl(entry: AgendaEntry): string | undefined {
  const fromDetails = detailString(entry.details, ["registration_url", "rsvp_url", "url", "link", "ticket_url"]);
  if (fromDetails && URL_RE.test(fromDetails)) return fromDetails;
  if (entry.link) return entry.link;
  const line = entry.body ? factLine(entry.body, /inscripci[oó]n|rsvp|entradas|registro|link/) : undefined;
  return line?.match(URL_RE)?.[0];
}

export function shortSummary(entry: AgendaEntry, max = 280): string | undefined {
  const fromDetails = detailString(entry.details, ["summary", "description", "descripcion"]);
  const raw = fromDetails ?? (entry.body ? stripEventFactLines(entry.body) : "");
  const text = cleanMarkdown(raw);
  if (!text) return undefined;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// ---------- calendario ----------

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${ICS_TZID}`,
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:-0300",
  "TZOFFSETTO:-0300",
  "TZNAME:-03",
  "END:STANDARD",
  "END:VTIMEZONE",
];

function alarm(trigger: string, description: string) {
  return ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsText(description)}`, `TRIGGER:${trigger}`, "END:VALARM"];
}

export function buildVevent(entry: AgendaEntry, options: { baseUrl: string; now?: Date }): string[] {
  const summary = summaryWithEmoji(
    entry.title,
    entryEmoji(entry),
  );
  const postUrl = `${options.baseUrl}/bots/${entry.bot.slug}#post-${entry.postId}`;
  const location = eventLocation(entry);
  const signup = registrationUrl(entry);
  const description = [shortSummary(entry), signup ? `Inscripción: ${signup}` : null, `Ver en el dashboard: ${postUrl}`]
    .filter(Boolean)
    .join("\n\n");
  const stamp = utcStamp(entry.updatedAt ? new Date(entry.updatedAt) : (options.now ?? new Date()));

  const lines = ["BEGIN:VEVENT", `UID:${entry.id}@grok-bots`, `DTSTAMP:${stamp}`];
  if (isTimed(entry)) {
    const start = new Date(entry.startsAt as string);
    const endIso =
      entry.endsAt && !isDateOnlyMidnightBa(entry.endsAt) && Date.parse(entry.endsAt) > start.getTime()
        ? entry.endsAt
        : new Date(start.getTime() + DEFAULT_DURATION_MS).toISOString();
    lines.push(`DTSTART;TZID=${ICS_TZID}:${localStamp(start)}`, `DTEND;TZID=${ICS_TZID}:${localStamp(endIso)}`);
  } else {
    const startDay = entry.startsAt ? baCalendarDate(entry.startsAt) : entry.date;
    const lastDay = entry.endDate && entry.endDate > startDay ? entry.endDate : startDay;
    lines.push(`DTSTART;VALUE=DATE:${ymd(startDay)}`, `DTEND;VALUE=DATE:${ymd(addDays(lastDay, 1))}`);
  }
  lines.push(`SUMMARY:${icsText(summary)}`);
  if (location) lines.push(`LOCATION:${icsText(location)}`);
  lines.push(`DESCRIPTION:${icsText(description)}`, `URL:${postUrl}`, "TRANSP:OPAQUE");
  if (isTimed(entry)) {
    lines.push(...alarm("-PT30M", `${summary} en 30 minutos`), ...alarm("-PT5M", `${summary} en 5 minutos`));
  } else {
    // Día completo: aviso a las 9:00 del día anterior.
    lines.push(...alarm("-PT15H", `Mañana: ${summary}`));
  }
  lines.push("END:VEVENT");
  return lines;
}

export function buildIcs(entries: AgendaEntry[], options: { baseUrl: string; calName?: string; now?: Date }): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Grok Bots//Agenda//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsText(options.calName ?? "Grok Bots · Eventos")}`,
    `X-WR-TIMEZONE:${ICS_TZID}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...VTIMEZONE,
  ];
  for (const entry of entries) lines.push(...buildVevent(entry, options));
  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
