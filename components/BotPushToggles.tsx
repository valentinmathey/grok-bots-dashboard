"use client";

import { BotAvatar } from "@/components/BotAvatar";

export type PushBot = {
  id: string;
  name: string;
  slug: string;
  avatar_color?: string | null;
  avatar_shape?: string | null;
  avatar_url?: string | null;
};

/** Lista de bots con un switch cada uno para elegir cuáles mandan push al celu. */
export function BotPushToggles({
  bots,
  enabled,
  onChange,
  onAll,
}: {
  bots: PushBot[];
  enabled: (botId: string) => boolean;
  onChange: (botId: string, on: boolean) => void;
  onAll: (on: boolean) => void;
}) {
  const onCount = bots.filter((bot) => enabled(bot.id)).length;
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Bots que te avisan</h2>
        <span className="text-xs text-muted">
          {onCount} de {bots.length}
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-muted">
        Apagá los que no querés que te manden notificaciones al celu. Los posts
        seguidos de un mismo bot se agrupan cada 10 minutos.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onAll(true)}
          className="min-h-9 rounded-full bg-chip px-3 text-xs font-medium"
        >
          Prender todos
        </button>
        <button
          type="button"
          onClick={() => onAll(false)}
          className="min-h-9 rounded-full bg-chip px-3 text-xs font-medium"
        >
          Apagar todos
        </button>
      </div>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
        {bots.map((bot) => {
          const on = enabled(bot.id);
          return (
            <li key={bot.id}>
              <label className="flex min-h-14 cursor-pointer items-center gap-3 px-3 py-2">
                <BotAvatar bot={bot} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {bot.name}
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-checked={on}
                  checked={on}
                  onChange={(event) => onChange(bot.id, event.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${on ? "bg-accent" : "bg-chip"}`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`}
                  />
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
