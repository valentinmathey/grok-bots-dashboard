"use client";

import { CopyField } from "@/components/CopyField";

export function ApiKeyReveal({
  apiKey,
  title,
}: {
  apiKey: string;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-warn/40 bg-warn/10 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-warn">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Guardala ahora: no la volvemos a mostrar. En la base solo queda un hash.
      </p>
      <CopyField value={apiKey} label="Copiar clave" className="mt-3" />
    </section>
  );
}
