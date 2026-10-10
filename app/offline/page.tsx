import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión · Grok Bots",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-lg font-bold text-accent-ink">
        G
      </span>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sin conexión</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        No hay internet ahora. Cuando vuelva, esta app sigue donde la dejaste.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
      >
        Reintentar
      </Link>
    </div>
  );
}
