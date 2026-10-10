import { BotAvatar } from "@/components/BotAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { resolveAvatar } from "@/lib/avatar";
import type { Bot } from "@/lib/types";

export function ShareChrome({
  bot,
  children,
}: {
  bot: Bot;
  children: React.ReactNode;
}) {
  const avatar = resolveAvatar(bot);

  return (
    <div
      className="bot-skin flex min-h-full flex-1 flex-col"
      style={{ "--bot-fill": avatar.fill } as React.CSSProperties}
    >
      <header className="sticky top-0 z-30 border-b border-line/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 min-w-0 max-w-2xl items-center justify-between gap-3 overflow-x-clip px-3.5 sm:h-16 sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <BotAvatar bot={bot} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold tracking-tight">
                {bot.name}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-chip px-2 py-0.5 text-[11px] font-medium text-muted">
              Solo lectura
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-2xl flex-1 overflow-x-clip px-3.5 pb-16 pt-5 sm:px-4 sm:pt-6">
        {children}
      </main>
    </div>
  );
}
