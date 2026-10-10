import Link from "next/link";
import { Bell, LogOut, Settings } from "lucide-react";
import { SearchOverlay } from "@/components/SearchOverlay";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="safe-px mx-auto flex h-14 min-w-0 max-w-5xl items-center justify-between gap-3 overflow-x-clip sm:h-16">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-accent text-[13px] font-bold text-accent-ink">
            G
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight">
            Grok Bots
          </span>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <ThemeToggle />
          <SearchOverlay />
          <Link
            href="/notificaciones"
            aria-label="Notificaciones"
            title="Notificaciones"
            className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-foreground"
          >
            <Bell size={18} strokeWidth={1.75} />
          </Link>
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            title="Ajustes"
            className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-foreground"
          >
            <Settings size={18} strokeWidth={1.75} />
          </Link>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm text-muted hover:bg-chip hover:text-foreground"
              title={email}
            >
              <LogOut size={16} strokeWidth={1.75} />
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
