import { LoginForm } from "@/components/LoginForm";

const ERRORS: Record<string, string> = {
  forbidden: "Esa cuenta no es la del dueño. Este dashboard es privado.",
  auth: "No se pudo completar el ingreso. Probá de nuevo.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const initialError = params.error ? (ERRORS[params.error] ?? ERRORS.auth) : null;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <div className="mb-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-lg font-bold text-accent-ink">
          G
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Grok Bots</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Un solo lugar para leer lo que publican tus asistentes.
        </p>
      </div>
      <div className="surface rounded-3xl p-5">
        <LoginForm initialError={initialError} />
      </div>
    </div>
  );
}
