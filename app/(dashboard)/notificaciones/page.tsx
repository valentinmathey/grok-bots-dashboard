import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { getRepository } from "@/lib/data";

export default async function NotificacionesPage() {
  const bots = await getRepository().listBots();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/" className="hidden min-h-11 items-center gap-1 text-sm font-medium text-accent lg:inline-flex">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Inicio
        </Link>
        <h1 className="page-heading mt-3 text-2xl font-semibold tracking-tight">Notificaciones</h1>
        <p className="mt-1.5 text-sm leading-6 text-muted">
          Avisos al celu cuando un bot publica, baja un precio o hay un evento mañana. Cero costo:
          Web Push estándar.
        </p>
      </div>
      <div className="surface rounded-3xl p-5">
        <NotificationsPanel bots={bots.map((bot) => ({
            id: bot.id,
            name: bot.name,
            slug: bot.slug,
            avatar_color: bot.avatar_color,
            avatar_shape: bot.avatar_shape,
            avatar_url: bot.avatar_url,
          }))} />
      </div>
    </div>
  );
}
