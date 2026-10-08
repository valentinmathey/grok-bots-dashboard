import { kindLabel } from "@/lib/format";
import type { PostKind } from "@/lib/types";

const KNOWN: Record<string, string> = {
  update: "bg-sky-500/12 text-sky-800 dark:text-sky-200",
  result: "bg-teal-500/12 text-teal-800 dark:text-teal-200",
  report: "bg-amber-500/12 text-amber-900 dark:text-amber-200",
  note: "bg-violet-500/12 text-violet-800 dark:text-violet-200",
  evento: "bg-rose-500/12 text-rose-800 dark:text-rose-200",
};

const FALLBACK = [
  "bg-stone-500/12 text-stone-800 dark:text-stone-200",
  "bg-cyan-500/12 text-cyan-800 dark:text-cyan-200",
  "bg-lime-500/12 text-lime-800 dark:text-lime-200",
];

function styleFor(kind: string): string {
  if (KNOWN[kind]) {
    return KNOWN[kind];
  }
  let hash = 0;
  for (const ch of kind) hash = (hash + ch.charCodeAt(0)) % FALLBACK.length;
  return FALLBACK[hash] ?? FALLBACK[0];
}

export function KindBadge({ kind }: { kind: PostKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${styleFor(kind)}`}
    >
      {kindLabel(kind)}
    </span>
  );
}
