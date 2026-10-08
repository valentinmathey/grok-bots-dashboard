import Link from "next/link";

export function Header({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 min-w-0 max-w-5xl items-center justify-between gap-3 overflow-x-clip px-3.5 sm:h-16 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-accent text-[13px] font-bold text-accent-ink">
            G
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight">
            Grok Bots
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href="/ajustes"
            aria-label="Ajustes"
            title="Ajustes"
            className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M19.4 13.5a7.8 7.8 0 0 0 .1-3l1.7-1.3-1.7-3-2 .4a8 8 0 0 0-2.6-1.5L14.4 3h-4.8l-.5 2.1A8 8 0 0 0 6.5 6.6l-2-.4-1.7 3 1.7 1.3a7.8 7.8 0 0 0 0 3L2.8 14.8l1.7 3 2-.4a8 8 0 0 0 2.6 1.5l.5 2.1h4.8l.5-2.1a8 8 0 0 0 2.6-1.5l2 .4 1.7-3-1.7-1.3Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-full px-3 text-sm text-muted hover:bg-chip hover:text-foreground"
              title={email}
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
