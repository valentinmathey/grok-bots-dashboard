import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { listRequests } from "@/lib/requests";

export async function PedidosHome() {
  const rows = await listRequests({});
  const pending = rows.filter((row) => row.status === "pendiente").length;
  const unread = rows.filter((row) => row.unread).length;
  if (!rows.length) return null;
  return (
    <Link
      href="/pedidos"
      className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2.5 text-sm hover:bg-chip"
    >
      <span className="inline-flex items-center gap-2">
        <MessageSquare size={14} strokeWidth={1.75} className="text-accent" />
        Pedidos
      </span>
      <span className="text-xs text-muted">
        {pending} pendientes
        {unread ? ` · ${unread} sin leer` : ""}
      </span>
    </Link>
  );
}
