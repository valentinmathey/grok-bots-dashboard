import Link from "next/link";
import { CreateBotForm } from "@/components/CreateBotForm";

export default function NewBotPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-accent">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nuevo bot</h1>
        <p className="mt-1 text-sm leading-6 text-muted">
          Después de crearlo te mostramos la clave de API una sola vez. Esa clave
          es la que usa el bot para publicar por HTTP.
        </p>
      </div>
      <CreateBotForm />
    </div>
  );
}
