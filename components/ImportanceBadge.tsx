import {
  IMPORTANCE_BADGE,
  buyBeforeLabel,
  readImportance,
  type ImportanceLevel,
} from "@/lib/importance";

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
      <span className="inline-flex max-w-full items-center rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-muted">
        {buyBeforeLabel(buyBefore)}
      </span>
    ) : null;
  }
  const badge = IMPORTANCE_BADGE[level as Exclude<ImportanceLevel, "normal">];
  return (
    <>
      <span
        title={reason ?? undefined}
        className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
      >
        <span aria-hidden>{badge.emoji}</span>
        {badge.label}
        {!compact && reason ? (
          <span className="hidden font-medium opacity-80 sm:inline">· {reason}</span>
        ) : null}
      </span>
      {reason && compact ? (
        <span className="basis-full text-[11px] leading-4 text-muted sm:hidden">{reason}</span>
      ) : null}
      {buyBefore ? (
        <span className="inline-flex max-w-full items-center rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-muted">
          {buyBeforeLabel(buyBefore)}
        </span>
      ) : null}
    </>
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
  return <p className="mt-1 text-[12px] leading-5 text-muted sm:hidden">{reason}</p>;
}
