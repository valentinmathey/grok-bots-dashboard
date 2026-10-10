import {
  CalendarDays,
  CircleDot,
  FileText,
  Flag,
  Home,
  NotebookPen,
  Sparkles,
  Target,
} from "lucide-react";
import { kindLabel } from "@/lib/format";
import type { PostKind } from "@/lib/types";

const KNOWN: Record<string, { className: string; Icon: typeof Sparkles }> = {
  update: {
    className: "bg-sky-500/12 text-sky-800 dark:text-sky-200",
    Icon: CircleDot,
  },
  result: {
    className: "bg-teal-500/12 text-teal-800 dark:text-teal-200",
    Icon: Flag,
  },
  report: {
    className: "bg-amber-500/12 text-amber-900 dark:text-amber-200",
    Icon: FileText,
  },
  note: {
    className: "bg-violet-500/12 text-violet-800 dark:text-violet-200",
    Icon: NotebookPen,
  },
  evento: {
    className: "bg-rose-500/12 text-rose-800 dark:text-rose-200",
    Icon: CalendarDays,
  },
  alojamiento: {
    className: "bg-teal-500/14 text-teal-800 dark:text-teal-200",
    Icon: Home,
  },
  resumen: {
    className: "bg-indigo-500/14 text-indigo-800 dark:text-indigo-200",
    Icon: Sparkles,
  },
  oportunidades: {
    className: "bg-emerald-500/14 text-emerald-800 dark:text-emerald-200",
    Icon: Target,
  },
};

const FALLBACK = [
  "bg-stone-500/12 text-stone-800 dark:text-stone-200",
  "bg-cyan-500/12 text-cyan-800 dark:text-cyan-200",
  "bg-lime-500/12 text-lime-800 dark:text-lime-200",
];

function styleFor(kind: string): string {
  if (KNOWN[kind]) {
    return KNOWN[kind].className;
  }
  let hash = 0;
  for (const ch of kind) hash = (hash + ch.charCodeAt(0)) % FALLBACK.length;
  return FALLBACK[hash] ?? FALLBACK[0];
}

export function KindBadge({ kind }: { kind: PostKind }) {
  const Icon = KNOWN[kind]?.Icon ?? Sparkles;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${styleFor(kind)}`}
    >
      <Icon size={12} strokeWidth={1.75} />
      {kindLabel(kind)}
    </span>
  );
}
