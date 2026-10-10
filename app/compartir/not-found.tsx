export default function ShareNotFound() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">No está</h1>
      <p className="mt-2 text-sm text-muted">
        Ese link no existe, expiró o la publicación no está.
      </p>
    </div>
  );
}
