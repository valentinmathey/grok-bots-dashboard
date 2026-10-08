import Link from "next/link";
import { CreateBotForm } from "@/components/CreateBotForm";
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
        <Link href="/" className="text-sm font-medium text-accent">
          ← Bots
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="mt-1.5 text-sm leading-6 text-muted">
          Crear bots y rotar claves. El dueño solo mira el panel; esto queda
          aparte a propósito.
        </p>
      </div>

      <section className="surface rounded-3xl p-5">
        <h2 className="text-base font-semibold">Nuevo bot</h2>
        <div className="mt-4">
          <CreateBotForm />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Claves</h2>
        {withKeys.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay bots.</p>
        ) : (
          withKeys.map((bot) => (
            <div key={bot.id} className="surface rounded-3xl p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold">{bot.name}</h3>
                <Link href={`/bots/${bot.slug}`} className="text-sm text-accent">
                  Ver panel
                </Link>
              </div>
              <p className="mt-1 font-mono text-xs text-muted">/{bot.slug}</p>
              <div className="mt-4">
                <RegenerateKeyButton botId={bot.id} keyPrefix={bot.prefix} />
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
