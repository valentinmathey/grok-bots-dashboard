"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/10 p-5">
      <h1 className="text-lg font-semibold">Algo salió mal</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {error.message || "No se pudo cargar el dashboard."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
      >
        Reintentar
      </button>
    </div>
  );
}
