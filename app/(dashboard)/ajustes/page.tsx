import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { AgendaFeedButton } from "@/components/AgendaFeedButton";
import { InstallAppButton } from "@/components/InstallAppButton";
import { CreateBotForm } from "@/components/CreateBotForm";
import { EditBotProfileForm } from "@/components/EditBotProfileForm";
import { RegenerateKeyButton } from "@/components/RegenerateKeyButton";
import { getRepository } from "@/lib/data";

export default async function SettingsPage() {
  const repo = getRepository();
  const bots = await repo.listBotSummaries();
  const withKeys = await Promise.all(
    bots.map(async (bot) => ({
      ...bot,
      prefix: await repo.getActiveKeyPrefix(bot.id),
    })),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <Link href="/" className="hidden min-h-11 items-center gap-1 text-sm font-medium text-accent lg:inline-flex">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Bots
        </Link>
        <h1 className="page-heading mt-3 text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1.5 text-sm leading-6 text-muted">
          Crear bots, elegir avatar y rotar claves. El dueño solo mira el
          panel; esto queda aparte a propósito.{" "}
          <Link href="/notificaciones" className="font-medium text-accent">
            Notificaciones
          </Link>
          .
        </p>
      </div>

      <section className="surface rounded-3xl p-5">
        <h2 className="text-base font-semibold">App</h2>
        <div className="mt-3">
          <InstallAppButton className="inline-flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium hover:bg-chip" />
        </div>
      </section>

      <section className="surface rounded-3xl p-5">
        <h2 className="text-base font-semibold">Agenda</h2>
        <div className="mt-3">
          <AgendaFeedButton />
        </div>
      </section>

      <section className="surface rounded-3xl p-5">
        <h2 className="text-base font-semibold">Nuevo bot</h2>
        <div className="mt-4">
          <CreateBotForm />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Bots y claves</h2>
        {withKeys.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay bots.</p>
        ) : (
          withKeys.map((bot) => (
            <div key={bot.id} className="surface rounded-3xl p-5">
              <div className="flex min-w-0 items-start gap-3">
                <BotAvatar bot={bot} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-baseline justify-between gap-3">
                    <h3 className="min-w-0 truncate font-semibold">{bot.name}</h3>
                    <Link href={`/bots/${bot.slug}`} className="text-sm text-accent">
                      Ver panel
                    </Link>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">/{bot.slug}</p>
                </div>
              </div>
              <EditBotProfileForm bot={bot} />
              <div className="mt-5 border-t border-line pt-4">
                <RegenerateKeyButton botId={bot.id} keyPrefix={bot.prefix} />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
