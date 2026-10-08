"use client";

import { useState } from "react";
import { ApiKeyReveal } from "@/components/ApiKeyReveal";

export function RegenerateKeyButton({
  botId,
  keyPrefix,
}: {
  botId: string;
  keyPrefix: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [prefix, setPrefix] = useState(keyPrefix);

  async function regenerate() {
    if (
      !window.confirm(
        "Esto invalida la clave anterior. El bot va a tener que usar la nueva.",
      )
    ) {
      return;
    }

    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/bots/${botId}/keys`, {
      method: "POST",
    });
    const payload = (await response.json()) as {
      api_key?: string;
      key_prefix?: string;
      error?: { message: string };
    };
    setPending(false);

    if (!response.ok || !payload.api_key) {
      setError(payload.error?.message ?? "No se pudo regenerar la clave");
      return;
    }

    setApiKey(payload.api_key);
    setPrefix(payload.key_prefix ?? payload.api_key.slice(0, 10));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Clave activa:{" "}
        <span className="font-mono text-foreground">
          {prefix ? `${prefix}…` : "no hay una clave activa"}
        </span>
      </p>
      <button
        type="button"
        onClick={regenerate}
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Regenerando…" : "Regenerar clave"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {apiKey ? (
        <ApiKeyReveal apiKey={apiKey} title="Nueva clave de API" />
      ) : null}
    </div>
  );
}
