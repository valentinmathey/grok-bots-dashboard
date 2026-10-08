"use client";

import { useRouter } from "next/navigation";
import { POST_KINDS, type PostKind } from "@/lib/types";
import { kindLabel } from "@/lib/format";
import type { PostFilters } from "@/lib/filters";

export function FeedFilters({
  action,
  products,
  values,
}: {
  action: string;
  products: string[];
  values: PostFilters;
}) {
  const router = useRouter();

  function apply(formData: FormData) {
    const params = new URLSearchParams();
    const fields = ["from", "to", "product", "kind", "tag"] as const;
    for (const field of fields) {
      const value = String(formData.get(field) ?? "").trim();
      if (value) {
        params.set(field, field === "tag" ? value.replace(/^#/, "") : value);
      }
    }
    const query = params.toString();
    router.push(query ? `${action}?${query}` : action);
  }

  return (
    <form
      action={action}
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        apply(new FormData(event.currentTarget));
      }}
      className="grid gap-3 rounded-2xl border border-line bg-raised p-3 sm:grid-cols-2 lg:grid-cols-6 sm:p-4"
    >
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-muted">Desde</span>
        <input
          type="date"
          name="from"
          defaultValue={values.from ?? ""}
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm"
        />
      </label>
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-muted">Hasta</span>
        <input
          type="date"
          name="to"
          defaultValue={values.to ?? ""}
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm"
        />
      </label>
      <label className="block text-xs sm:col-span-2 lg:col-span-1">
        <span className="mb-1 block font-medium text-muted">Producto</span>
        <input
          name="product"
          list="product-options"
          defaultValue={values.product ?? ""}
          placeholder="Todos"
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm"
        />
        <datalist id="product-options">
          {products.map((product) => (
            <option key={product} value={product} />
          ))}
        </datalist>
      </label>
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-muted">Tipo</span>
        <select
          name="kind"
          defaultValue={values.kind ?? ""}
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm"
        >
          <option value="">Todos</option>
          {POST_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kindLabel(kind as PostKind)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-muted">Etiqueta</span>
        <input
          name="tag"
          defaultValue={values.tag ?? ""}
          placeholder="weekly"
          className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-sm"
        />
      </label>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
        <button
          type="submit"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink sm:flex-none"
        >
          Filtrar
        </button>
        <button
          type="button"
          onClick={() => router.push(action)}
          className="inline-flex min-h-11 items-center rounded-full border border-line px-4 text-sm"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
