"use client";

import { useState } from "react";

export function AgendaFeedButton() {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    const res = await fetch("/api/admin/agenda-feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    });
    const data = (await res.json()) as { url?: string };
    setUrl(data.url ?? null);
    setBusy(false);
  }

  async function revoke() {
    setBusy(true);
    await fetch("/api/admin/agenda-feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke" }),
    });
    setUrl(null);
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">
        Feed privado para Google Calendar. El token se muestra una vez.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy}
          className="rounded-full bg-accent px-3 py-2 text-xs font-semibold text-accent-ink"
        >
          Generar feed .ics
        </button>
        <a href="/api/agenda.ics" className="rounded-full bg-chip px-3 py-2 text-xs font-medium">
          Descargar .ics
        </a>
        <button type="button" onClick={() => void revoke()} className="text-xs text-muted">
          Revocar
        </button>
      </div>
      {url ? <p className="break-all font-mono text-xs">{url}</p> : null}
    </div>
  );
}
