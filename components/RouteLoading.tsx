import { BotCardSkeleton, PostCardSkeleton, Skeleton } from "@/components/Skeleton";

/**
 * Esqueleto que Next muestra al instante (loading.tsx) mientras el server
 * component del destino se renderiza, así la navegación nunca queda congelada.
 */
export function RouteLoading({
  variant = "feed",
  label = "Cargando…",
}: {
  variant?: "feed" | "bots" | "list" | "grid" | "bot" | "form";
  label?: string;
}) {
  return (
    <div className="route-loading space-y-5" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {variant === "bot" ? (
        <div className="flex items-start gap-3">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 pt-1">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-3 w-16 rounded-full" />
          <Skeleton className="h-8 w-56 max-w-[70%]" />
          <Skeleton className="h-4 w-72 max-w-[85%]" />
        </div>
      )}
      {variant === "feed" || variant === "bot" ? (
        <div className="space-y-3">
          <Skeleton className="h-11 w-full rounded-full" />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : variant === "bots" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <BotCardSkeleton />
          <BotCardSkeleton />
          <BotCardSkeleton />
          <BotCardSkeleton />
        </div>
      ) : variant === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-3xl" />
          ))}
        </div>
      ) : variant === "form" ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
