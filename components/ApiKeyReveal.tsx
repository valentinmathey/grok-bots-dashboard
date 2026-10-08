"use client";

import { useState } from "react";

export function ApiKeyReveal({
  apiKey,
  title,
}: {
  apiKey: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-2xl border border-warn/40 bg-warn/10 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-warn">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Guardala ahora: no la volvemos a mostrar. En la base solo queda un hash.
      </p>
      <code className="mt-3 block overflow-x-auto rounded-xl bg-background px-3 py-3 font-mono text-[13px] break-all">
        {apiKey}
      </code>
      <button
        type="button"
        onClick={copy}
        className="mt-3 inline-flex min-h-10 items-center rounded-full bg-warn px-4 text-sm font-semibold text-accent-ink"
      >
        {copied ? "Copiada" : "Copiar clave"}
      </button>
    </section>
  );
}
