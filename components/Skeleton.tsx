export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-2xl ${className}`} />;
}

export function PostCardSkeleton() {
  return (
    <div className="surface overflow-hidden rounded-3xl">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function BotCardSkeleton() {
  return (
    <div className="surface min-h-[168px] rounded-3xl p-4">
      <div className="flex gap-3">
        <Skeleton className="h-[4.5rem] w-[4.5rem] rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <Skeleton className="mt-6 h-4 w-1/2" />
    </div>
  );
}
