"use client";

import { useState } from "react";
import { requestMagicLink, signInWithPassword } from "@/app/login/actions";

const inputClass =
  "min-h-12 w-full rounded-xl border border-line bg-raised px-3 text-base outline-none ring-accent/40 focus:ring-2";

export function LoginForm({
  initialError,
}: {
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [linkPending, setLinkPending] = useState(false);
  const [error, setError] = useState(initialError ?? null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await signInWithPassword(email, password);
    if (result.ok) {
      window.location.replace("/");
      return;
    }
    setPending(false);
    setError(result.error);
  }

  async function onSendLink() {
    if (!email) {
      setError("Escribí tu email para mandarte el link.");
      return;
    }
    setLinkPending(true);
    setError(null);
    const result = await requestMagicLink(email);
    setLinkPending(false);
    if (result.ok) {
      setSent(true);
      return;
    }
    setError(result.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
          placeholder="tu@email.com"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Contraseña</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {sent ? (
        <p className="rounded-2xl border border-accent/30 bg-accent/10 p-3 text-sm leading-6 text-muted">
          Te mandamos un link a <strong className="text-foreground">{email}</strong>. Abrilo en
          este mismo navegador.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <button
        type="button"
        onClick={onSendLink}
        disabled={linkPending}
        className="w-full text-sm text-muted underline-offset-4 hover:underline disabled:opacity-60"
      >
        {linkPending ? "Enviando…" : "Enviarme un link"}
      </button>
    </form>
  );
}
