import {
  IMPORTANCE_BADGE,
  buyBeforeLabel,
  readImportance,
  type ImportanceLevel,
} from "@/lib/importance";

const CHIP =
  "inline-flex max-w-full shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none";

/** Badge + razón + “Comprar antes del dd/mm” para cards de eventos. */
export function ImportanceBadge({
  details,
  compact = false,
}: {
  details: Record<string, unknown> | null | undefined;
  compact?: boolean;
}) {
  const { level, reason, buyBefore } = readImportance(details);
  if (!level || level === "normal") {
    return buyBefore ? (
      <span className={`${CHIP} bg-chip font-medium text-muted`}>{buyBeforeLabel(buyBefore)}</span>
    ) : null;
  }
  const badge = IMPORTANCE_BADGE[level as Exclude<ImportanceLevel, "normal">];
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1.5">
      <span title={reason ?? undefined} className={`${CHIP} ${badge.className}`}>
        <span aria-hidden>{badge.emoji}</span>
        {badge.label}
      </span>
      {!compact && reason ? (
        <span className="max-w-full text-[11px] font-medium leading-4 text-muted [overflow-wrap:anywhere]">
          {reason}
        </span>
      ) : null}
      {compact && reason ? (
        <span className="basis-full text-[11px] leading-4 text-muted [overflow-wrap:anywhere] sm:basis-auto sm:hidden">
          {reason}
        </span>
      ) : null}
      {buyBefore ? (
        <span className={`${CHIP} bg-chip font-medium text-muted`}>{buyBeforeLabel(buyBefore)}</span>
      ) : null}
    </span>
  );
}

/** Línea de razón debajo del título cuando el badge está compacto. */
export function ImportanceReasonLine({
  details,
}: {
  details: Record<string, unknown> | null | undefined;
}) {
  const { level, reason } = readImportance(details);
  if (!reason || !level || level === "normal") return null;
  return (
    <p className="mt-1 text-[12px] leading-5 text-muted [overflow-wrap:anywhere] sm:hidden">
      {reason}
    </p>
  );
}
