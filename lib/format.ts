import { BA_TIMEZONE, isDateOnlyMidnightBa } from "@/lib/event-time";
import type { BotSummary, PostKind } from "@/lib/types";

const KIND_LABELS: Record<string, string> = {
  update: "Actualización",
  result: "Resultado",
  report: "Informe",
  note: "Nota",
  evento: "Evento",
  alojamiento: "Alojamiento",
  resumen: "Resumen",
  oportunidades: "Oportunidades",
  ranking: "Ranking",
  newsletter: "Newsletter",
  informe: "Finanzas",
  workflow: "Workflow",
};

export function kindLabel(kind: PostKind): string {
  if (KIND_LABELS[kind]) {
    return KIND_LABELS[kind];
  }
  if (!kind) {
    return "Post";
  }
  return kind.charAt(0).toUpperCase() + kind.slice(1).replace(/-/g, " ");
}

function localeText(
  date: Date,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat("es-AR", options)
    .format(date)
    .replace(/[\u00a0\u202f\u2007\u2009]/g, " ");
}

export function formatDateTime(iso: string): string {
  return localeText(new Date(iso), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return localeText(new Date(iso), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatEventStamp(iso: string): string {
  const date = new Date(iso);
  const weekday = localeText(date, {
    weekday: "short",
    timeZone: BA_TIMEZONE,
  }).replace(/\.$/, "");
  const dayMonth = localeText(date, {
    day: "numeric",
    month: "short",
    timeZone: BA_TIMEZONE,
  });
  const head = `${weekday} ${dayMonth}`.toLowerCase();
  if (isDateOnlyMidnightBa(iso)) {
    return head;
  }
  const time = localeText(date, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BA_TIMEZONE,
    hourCycle: "h23",
  });
  return `${head} · ${time}`;
}

export function formatEventWhen(iso: string, endIso?: string | null): string {
  const start = formatEventStamp(iso);
  if (!endIso) {
    return start;
  }
  const end = formatEventStamp(endIso);
  return end === start ? start : `${start} – ${end}`;
}

export function formatCount(n: number, one: string, many: string): string {
  return n === 1 ? `1 ${one}` : `${n} ${many}`;
}

export function formatPublicationCount(n: number): string {
  return formatCount(n, "publicación", "publicaciones");
}

export type BotCardLead = {
  tone: "live" | "event" | "latest" | "empty";
  label: string | null;
  text: string;
};

export function botCardLead(
  bot: Pick<
    BotSummary,
    "status" | "post_count" | "latest_title" | "next_event_title" | "next_event_at"
  >,
): BotCardLead {
  const status = bot.status?.trim();
  if (status) {
    return { tone: "live", label: null, text: status };
  }
  if (bot.next_event_title?.trim() && bot.next_event_at) {
    return {
      tone: "event",
      label: "Próximo evento",
      text: bot.next_event_title.trim(),
    };
  }
  if (bot.post_count > 0 && bot.latest_title?.trim()) {
    return {
      tone: "latest",
      label: "Última publicación",
      text: bot.latest_title.trim(),
    };
  }
  if (bot.post_count > 0) {
    return {
      tone: "latest",
      label: null,
      text: formatPublicationCount(bot.post_count),
    };
  }
  return { tone: "empty", label: null, text: "Todavía no publicó" };
}

export function formatRelative(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) {
    return "ahora";
  }
  if (diffMs < hour) {
    const mins = Math.floor(diffMs / minute);
    return `hace ${mins} min`;
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour);
    return `hace ${hours} h`;
  }
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day);
    return days === 1 ? "ayer" : `hace ${days} días`;
  }
  return formatDate(iso);
}

export function formatMoney(amount: number, currency = "BRL"): string {
  const digits = amount % 1 === 0 ? 0 : 2;
  const number = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
    .format(amount)
    .replace(/[\u00a0\u202f\u2007\u2009]/g, " ");
  if (currency === "BRL") {
    return `R$ ${number}`;
  }
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: digits,
    })
      .format(amount)
      .replace(/[\u00a0\u202f\u2007\u2009]/g, " ");
  } catch {
    return `${number} ${currency}`;
  }
}

export function previewPlain(markdown: string, max = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max).trim()}…`;
}
