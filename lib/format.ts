import type { PostKind } from "@/lib/types";

const KIND_LABELS: Record<string, string> = {
  update: "Actualización",
  result: "Resultado",
  report: "Informe",
  note: "Nota",
  evento: "Evento",
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
    .replace(/\u00a0/g, " ");
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

export function formatCount(n: number, one: string, many: string): string {
  return n === 1 ? `1 ${one}` : `${n} ${many}`;
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
