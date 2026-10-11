export type EventFacts = {
  place?: string;
  price?: string;
  modality?: string;
};

const PLACE = /^(?:lugar|ubicaci[oó]n|location)\s*[:\-–]\s*(.+)$/i;
const PRICE = /^(?:precio|entrada|costo|price)\s*[:\-–]\s*(.+)$/i;
const MODALITY = /^(?:modalidad|formato|tipo)\s*[:\-–]\s*(.+)$/i;
const FACT_LINE =
  /^(?:fecha(?:\s+y\s+hora)?|horario|lugar|ubicaci[oó]n|location|precio|entrada|costo|price|modalidad|formato|inscripci[oó]n|rsvp|link)\s*[:\-–]/i;

function cleanLine(line: string): string {
  return line.replace(/^[-*#>\s]+/, "").replace(/\*+/g, "").trim();
}

function firstSentence(value: string, max = 42): string {
  const trimmed = value.split(/[.(]/)[0]?.trim() || value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

export function parseEventFacts(
  markdown: string,
  details?: Record<string, unknown> | null,
): EventFacts {
  const facts: EventFacts = {};
  for (const raw of markdown.split(/\n+/)) {
    const line = cleanLine(raw);
    if (!line) continue;
    const place = line.match(PLACE)?.[1]?.trim();
    const price = line.match(PRICE)?.[1]?.trim();
    const modality = line.match(MODALITY)?.[1]?.trim();
    if (place && !facts.place) facts.place = firstSentence(place);
    if (price && !facts.price) facts.price = eventPriceChip(price);
    if (modality && !facts.modality) facts.modality = firstSentence(modality, 24);
  }

  if (details && typeof details === "object") {
    const place = stringField(details, ["location", "place", "lugar", "venue"]);
    const price = stringField(details, ["price_text", "price", "precio"]);
    const modality = stringField(details, ["modality", "modalidad", "format", "formato"]);
    if (place) facts.place = firstSentence(place);
    if (price) facts.price = eventPriceChip(price);
    if (modality) facts.modality = firstSentence(modality, 24);
  }

  return facts;
}

export function eventPriceChip(price: string): string {
  if (/gratis|free|sin cargo|sin costo|\$\s*0(?:[.,]0+)?\b/i.test(price)) {
    return "Gratis";
  }
  return firstSentence(price, 28);
}

export function hasEventFacts(facts: EventFacts): boolean {
  return Boolean(facts.place || facts.price || facts.modality);
}

export function stripEventFactLines(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => !FACT_LINE.test(cleanLine(line)))
    .join("\n");
}

function stringField(
  details: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const value = details[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}
