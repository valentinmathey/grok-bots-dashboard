import { formatDateTime, formatRelative } from "@/lib/format";

export function TimeStamp({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className="text-muted">
      {formatRelative(iso)}
    </time>
  );
}
