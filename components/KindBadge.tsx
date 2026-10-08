import { kindLabel } from "@/lib/format";
import type { PostKind } from "@/lib/types";

const STYLES: Record<PostKind, string> = {
  update: "bg-sky-400/15 text-sky-200",
  result: "bg-accent/15 text-accent",
  report: "bg-warn/15 text-warn",
  note: "bg-violet-400/15 text-violet-200",
};

export function KindBadge({ kind }: { kind: PostKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[kind]}`}
    >
      {kindLabel(kind)}
    </span>
  );
}
