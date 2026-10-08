import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">No está</h1>
      <p className="mt-2 text-sm text-muted">
        Esa página no existe o el bot no está creado.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
