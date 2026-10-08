import type { PostKind } from "@/lib/types";

const KIND_LABELS: Record<PostKind, string> = {
  update: "Actualización",
  result: "Resultado",
  report: "Informe",
  note: "Nota",
};

export function kindLabel(kind: PostKind): string {
  return KIND_LABELS[kind] ?? kind;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
  return formatDateTime(iso);
}
