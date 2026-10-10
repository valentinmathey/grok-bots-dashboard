import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface rounded-3xl px-5 py-12 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-chip text-muted">
        <Inbox size={26} strokeWidth={1.5} />
      </span>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
