import Link from "next/link";

export function Header({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-ink">
            G
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight">
            Grok Bots
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/bots/nuevo"
            className="inline-flex min-h-10 items-center rounded-full bg-accent px-3.5 text-sm font-semibold text-accent-ink"
          >
            Nuevo bot
          </Link>
          <form action="/auth/sign-out" method="post">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-full border border-line px-3 text-sm text-muted"
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
