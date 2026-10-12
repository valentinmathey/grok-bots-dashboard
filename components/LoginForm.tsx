"use client";

import { useState } from "react";
import { requestMagicLink, verifyLoginCode } from "@/app/login/actions";

export function LoginForm({
  initialError,
}: {
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError ?? null);
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVerifying(true);
    setError(null);
    const result = await verifyLoginCode(email, code);
    if (result.ok) {
      window.location.replace("/");
      return;
    }
    setVerifying(false);
    setError(result.error);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await requestMagicLink(email);
    setPending(false);
    if (result.ok) {
      setSent(true);
      return;
    }
    setError(result.error);
  }

  if (sent) {
    return (
      <form onSubmit={onVerify} className="space-y-4">
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5">
          <h2 className="text-lg font-semibold">Revisá tu correo</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Te mandamos un código a <strong className="text-foreground">{email}</strong>.
            Escribilo acá (ideal desde la app instalada) o tocá el link del mail.
          </p>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Código</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={8}
            required
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="min-h-12 w-full rounded-xl border border-line bg-raised px-3 text-center font-mono text-2xl tracking-[0.4em] outline-none ring-accent/40 focus:ring-2"
            placeholder="000000"
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={verifying || code.length < 6}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          {verifying ? "Verificando…" : "Entrar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setCode("");
            setError(null);
          }}
          className="w-full text-sm text-muted underline-offset-4 hover:underline"
        >
          Usar otro email o pedir un código nuevo
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-line bg-raised px-3 text-base outline-none ring-accent/40 focus:ring-2"
          placeholder="tu@email.com"
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviarme el código"}
      </button>
    </form>
  );
}
